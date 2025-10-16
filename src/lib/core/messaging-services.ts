import { ID, Messaging, Query, Users } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { VirtualStore } from "../models/virtual-store";
import { PhysicalStoreModel } from "../models/physical-store-model";
import { OrderFullfilmentRecords, Orders } from "../types/appwrite/appwrite";
import { OrderModel } from "../models/OrderModel";
import { getUserData } from "../actions/auth.action";
import { format } from "date-fns";
import { PhysicalStoreTypes, VirtualStoreTypes } from "../types";
import { getUsersRolesByLabels } from "../actions/user-labels";
import {
  OrderStatus,
  PhysicalStoreFulfillmentOrderStatus,
  UserRole,
} from "../constants";
import { DATABASE_ID } from "../env-config";
import { OrderItemCreateData } from "../schemas/order-schemas";

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  userId?: string;
}

export class MessagingService {
  private messaging: Messaging | null = null;
  private users: Users | null = null;

  constructor() {
    this.initializeClients();
  }

  private async initializeClients() {
    try {
      const { account } = await createAdminClient();
      const client = (account as any).client;
      this.messaging = new Messaging(client);
      this.users = new Users(client);
    } catch (error) {
      console.error("Failed to initialize messaging clients:", error);
    }
  }

  async sendViaResend(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    try {
      const resendApiKey = process.env.RESEND_MAIL_API_KEY;
      const fromEmail = process.env.EMAIL_FROM || "mail@info.ikazestores.com";

      if (!resendApiKey) {
        console.error("RESEND_MAIL_API_KEY not configured");
        return false;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Resend API error:", error);
        return false;
      }

      const result = await response.json();
      console.log(`Email sent via Resend to ${to}:`, result.id);
      return true;
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
      return false;
    }
  }

  async sendAffiliateWelcomeEmail(affiliate: EmailRecipient): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "Welcome to Our Affiliate Program!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome ${
            affiliate.name || "Partner"
          }!</h1>
          <p>Thank you for joining our affiliate program. You're now ready to start earning commissions!</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Getting Started:</h3>
            <ul>
              <li>Create your virtual store</li>
              <li>Browse our product catalog</li>
              <li>Start promoting products</li>
              <li>Track your earnings in real-time</li>
            </ul>
          </div>
          <a href="/affiliate/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Access Your Dashboard
          </a>
        </div>
      `,
      text: `Welcome ${
        affiliate.name || "Partner"
      }! Thank you for joining our affiliate program. Access your dashboard to get started.`,
    };

    return this.sendTransactionalEmail([affiliate], template);
  }

  async sendTransactionalEmail(
    recipients: EmailRecipient[],
    template: EmailTemplate
  ): Promise<boolean> {
    try {
      if (!this.messaging || !this.users) {
        await this.initializeClients();
      }

      if (!this.messaging || !this.users) {
        console.error("Messaging service not initialized");
        return false;
      }

      const registeredUsers: { userId: string; email: string }[] = [];
      const nonRegisteredUsers: string[] = [];

      for (const recipient of recipients) {
        if (recipient.userId) {
          // If userId is provided, use it directly
          registeredUsers.push({
            userId: recipient.userId,
            email: recipient.email,
          });
        } else {
          // Try to find user by email
          try {
            const userList = await this.users.list([
              Query.equal("email", recipient.email),
              Query.limit(1),
            ]);

            if (userList.total > 0 && userList.users[0]) {
              registeredUsers.push({
                userId: userList.users[0].$id,
                email: recipient.email,
              });
            } else {
              nonRegisteredUsers.push(recipient.email);
            }
          } catch (error) {
            console.warn(
              `Could not lookup user for email ${recipient.email}:`,
              error
            );
            nonRegisteredUsers.push(recipient.email);
          }
        }
      }

      let appwriteSuccess = true;
      let resendSuccess = true;

      // Send to registered users via Appwrite messaging
      if (registeredUsers.length > 0) {
        try {
          const userIds = registeredUsers.map((u) => u.userId);
          await this.messaging.createEmail(
            ID.unique(),
            template.subject,
            template.html,
            undefined, // topics
            userIds, // users - array of user IDs
            undefined, // targets
            undefined, // cc
            undefined, // bcc
            undefined, // attachments
            false, // draft
            true // html
          );

          console.log(
            `Email sent via Appwrite to ${registeredUsers.length} registered user(s)`
          );
        } catch (error) {
          console.error("Failed to send email via Appwrite:", error);
          appwriteSuccess = false;

          // Fallback: try sending via Resend
          console.log("Attempting to send via Resend as fallback...");
          for (const user of registeredUsers) {
            await this.sendViaResend(
              user.email,
              template.subject,
              template.html
            );
          }
        }
      }

      // Send to non-registered users via Resend
      if (nonRegisteredUsers.length > 0) {
        console.log(
          `Sending to ${nonRegisteredUsers.length} non-registered user(s) via Resend`
        );

        const resendPromises = nonRegisteredUsers.map((email) =>
          this.sendViaResend(email, template.subject, template.html)
        );

        const results = await Promise.all(resendPromises);
        resendSuccess = results.every((result) => result === true);

        if (!resendSuccess) {
          console.error("Some emails failed to send via Resend");
        }
      }

      // Return true if at least one method succeeded
      return appwriteSuccess || resendSuccess;
    } catch (error) {
      console.error("Failed to send transactional email:", error);
      return false;
    }
  }
}

export class OrderNotificationService {
  private messagingService: MessagingService;
  private virtualStoreModel: VirtualStore;
  private physicalStoreModel: PhysicalStoreModel;
  private orders: OrderModel;

  constructor() {
    this.messagingService = new MessagingService();
    this.virtualStoreModel = new VirtualStore();
    this.physicalStoreModel = new PhysicalStoreModel();
    this.orders = new OrderModel();
  }

  async sendNewOrderNotification(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): Promise<void> {
    try {
      await Promise.all([
        this.sendCustomerOrderConfirmation(order, orderItems),
        this.sendVirtualStoreNewSaleNotification(order, orderItems),
        this.sendPhysicalStoreFulfillmentRequest(order, orderItems),
        this.sendSystemAdminOrderNotification(order, orderItems),
      ]);
    } catch (error) {}
  }

  async sendOrderStatusUpdateNotification(order: Orders): Promise<void> {
    try {
      await Promise.all([
        this.sendCustomerStatusUpdateNotification(order),
        this.sendVirtualStoreStatusUpdateNotification(order),
      ]);
    } catch (error) {
      console.error("Error sending order status update notifications:", error);
    }
  }

  async sendFulfillmentStatusUpdateNotification(
    fulfillmentRecord: OrderFullfilmentRecords
  ): Promise<void> {
    try {
      await this.sendVirtualStoreFulfillmentUpdateNotification(
        fulfillmentRecord
      );
    } catch (error) {
      console.error(
        "Error sending fulfillment status update notifications:",
        error
      );
    }
  }

  private async sendCustomerOrderConfirmation(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): Promise<void> {
    try {
      const customer = await getUserData(order.customerId);
      if (!customer || !customer.email) return;

      const template: EmailTemplate = {
        subject: `Order Confirmation - #${order.orderNumber}`,
        html: this.generateOrderConfirmationHTML(order, orderItems),
        text: this.generateOrderConfirmationText(order, orderItems),
      };

      const recipient: EmailRecipient = {
        email: customer.email,
        name: customer.fullName,
        userId: customer.$id,
      };

      await this.messagingService.sendTransactionalEmail([recipient], template);
    } catch (error) {
      console.error(
        "Error sending physical store fulfillment requests:",
        error
      );
    }
  }

  private async sendVirtualStoreNewSaleNotification(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): Promise<void> {
    try {
      const virtualStore = await this.virtualStoreModel.findById(
        order.virtualStoreId,
        {}
      );
      if (!virtualStore) return;

      const storeOwner = await getUserData(virtualStore.owner);
      if (!storeOwner || !storeOwner.email) return;

      const totalCommission = orderItems.reduce(
        (sum, item) => sum + item.commission * item.quantity,
        0
      );

      const template: EmailTemplate = {
        subject: `🎉 New Sale! Order #${order.orderNumber}`,
        html: this.generateVirtualStoreNewSaleHTML(
          order,
          orderItems,
          totalCommission,
          virtualStore
        ),
        text: this.generateVirtualStoreNewSaleText(
          order,
          orderItems,
          totalCommission,
          virtualStore
        ),
      };

      const recipient: EmailRecipient = {
        email: storeOwner.email,
        name: storeOwner.fullName,
        userId: storeOwner.$id,
      };

      await this.messagingService.sendTransactionalEmail([recipient], template);
    } catch (error) {
      console.error(
        "Error sending virtual store new sale notification:",
        error
      );
    }
  }

  private async sendPhysicalStoreFulfillmentRequest(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): Promise<void> {
    try {
      const itemsByPhysicalStore = orderItems.reduce((acc, item) => {
        if (!acc[item.physicalStoreId]) {
          acc[item.physicalStoreId] = [];
        }
        acc[item.physicalStoreId].push(item);
        return acc;
      }, {} as Record<string, OrderItemCreateData[]>);

      await Promise.all(
        Object.entries(itemsByPhysicalStore).map(
          async ([physicalStoreId, items]) => {
            const typedData = items as OrderItemCreateData[];

            const physicalStore = await this.physicalStoreModel.findById(
              physicalStoreId,
              {}
            );
            if (!physicalStore) return;

            const storeOwner = await getUserData(physicalStore.owner);
            if (!storeOwner || !storeOwner.email) return;

            const totalValue = typedData.reduce(
              (sum, item) => sum + item.basePrice * item.quantity,
              0
            );
            const itemCount = typedData.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

            const template: EmailTemplate = {
              subject: `📦 New Order to Fulfill - #${order.orderNumber}`,
              html: this.generatePhysicalStoreFulfillmentHTML(
                order,
                typedData,
                totalValue,
                itemCount,
                physicalStore
              ),
              text: this.generatePhysicalStoreFulfillmentText(
                order,
                typedData,
                totalValue,
                itemCount,
                physicalStore
              ),
            };

            const recipient: EmailRecipient = {
              email: storeOwner.email,
              name: storeOwner.fullName,
              userId: storeOwner.$id,
            };

            await this.messagingService.sendTransactionalEmail(
              [recipient],
              template
            );
          }
        )
      );
    } catch (error) {
      console.error(
        "Error sending physical store fulfillment requests:",
        error
      );
    }
  }

  private async sendSystemAdminOrderNotification(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): Promise<void> {
    try {
      const systemAdminUsers = await getUsersRolesByLabels([
        UserRole.SYS_ADMIN,
      ]);

      if (systemAdminUsers.length === 0) {
        console.warn("No system admins found to send order notification");
        return;
      }

      const systemAdmins = systemAdminUsers
        .filter((user) => user.email)
        .map((user) => ({
          email: user.email,
          name: user.name || user.email.split("@")[0],
        }));

      if (systemAdmins.length === 0) {
        console.warn("No system admins with valid email addresses found");
        return;
      }

      const template: EmailTemplate = {
        subject: `New Order Alert - #${order.orderNumber}`,
        html: this.generateSystemAdminOrderHTML(order, orderItems),
        text: this.generateSystemAdminOrderText(order, orderItems),
      };

      await this.messagingService.sendTransactionalEmail(
        systemAdmins,
        template
      );

      console.log(
        `Order notification sent to ${systemAdmins.length} system admin(s) for order #${order.orderNumber}`
      );
    } catch (error) {
      console.error("Error sending system admin order notification:", error);
    }
  }

  private async sendVirtualStoreFulfillmentUpdateNotification(
    fulfillmentRecord: OrderFullfilmentRecords
  ): Promise<void> {
    try {
      const order = await this.orders.findById(fulfillmentRecord.orderId, {});
      if (!order) {
        console.log("Can't find order");
        return;
      }

      const virtualStore = await this.virtualStoreModel.findById(
        order.virtualStoreId,
        {}
      );
      if (!virtualStore) return;

      const storeOwner = await getUserData(virtualStore.owner);
      if (!storeOwner || !storeOwner.email) return;

      const statusMessages: Record<
        PhysicalStoreFulfillmentOrderStatus,
        string
      > = {
        [PhysicalStoreFulfillmentOrderStatus.PENDING]: "is pending fulfillment",
        [PhysicalStoreFulfillmentOrderStatus.PROCESSING]: "started processing",
        [PhysicalStoreFulfillmentOrderStatus.SHIPPED]: "shipped",
        [PhysicalStoreFulfillmentOrderStatus.COMPLETED]:
          "completed fulfillment",
        [PhysicalStoreFulfillmentOrderStatus.CANCELLED]:
          "cancelled fulfillment",
      };

      const template: EmailTemplate = {
        subject: `Fulfillment Update - Order #${order.orderNumber}`,
        html: this.generateFulfillmentUpdateHTML(
          order,
          fulfillmentRecord,
          statusMessages[fulfillmentRecord.physicalStoreFulfillmentOrderStatus]
        ),
        text: this.generateFulfillmentUpdateText(
          order,
          fulfillmentRecord,
          statusMessages[fulfillmentRecord.physicalStoreFulfillmentOrderStatus]
        ),
      };

      const recipient: EmailRecipient = {
        email: storeOwner.email,
        name: storeOwner.fullName,
        userId: storeOwner.$id,
      };

      await this.messagingService.sendTransactionalEmail([recipient], template);
    } catch (error) {
      console.error(
        "Error sending virtual store fulfillment update notification:",
        error
      );
    }
  }

  private async sendCustomerStatusUpdateNotification(
    order: Orders
  ): Promise<void> {
    try {
      const customer = await getUserData(order.customerId);
      if (!customer || !customer.email) return;

      const statusMessages: Record<OrderStatus, string> = {
        [OrderStatus.PENDING]: "Your order is pending confirmation",
        [OrderStatus.PROCESSING]: "Your order is being prepared",
        [OrderStatus.SHIPPED]: "Your order has been shipped",
        [OrderStatus.DELIVERED]: "Your order has been delivered",
        [OrderStatus.CANCELLED]: "Your order has been cancelled",
      };

      const template: EmailTemplate = {
        subject: `Order Update - #${order.orderNumber}`,
        html: this.generateOrderStatusUpdateHTML(
          order,
          statusMessages[order.orderStatus as OrderStatus]
        ),
        text: this.generateOrderStatusUpdateText(
          order,
          statusMessages[order.orderStatus as OrderStatus]
        ),
      };

      const recipient: EmailRecipient = {
        email: customer.email,
        name: customer.fullName,
        userId: customer.$id,
      };

      await this.messagingService.sendTransactionalEmail([recipient], template);
    } catch (error) {
      console.error(
        "Error sending customer status update notification:",
        error
      );
    }
  }

  private async sendVirtualStoreStatusUpdateNotification(
    order: Orders
  ): Promise<void> {
    try {
      const virtualStore = await this.virtualStoreModel.findById(
        order.virtualStoreId,
        {}
      );
      if (!virtualStore) return;

      const storeOwner = await getUserData(virtualStore.owner);
      if (!storeOwner || !storeOwner.email) return;

      const template: EmailTemplate = {
        subject: `Order Status Update - #${order.orderNumber}`,
        html: this.generateVirtualStoreStatusUpdateHTML(order, virtualStore),
        text: this.generateVirtualStoreStatusUpdateText(order, virtualStore),
      };

      const recipient: EmailRecipient = {
        email: storeOwner.email,
        name: storeOwner.fullName,
        userId: storeOwner.$id,
      };

      await this.messagingService.sendTransactionalEmail([recipient], template);
    } catch (error) {
      console.error(
        "Error sending virtual store status update notification:",
        error
      );
    }
  }
  // HTML Email Templates
  private generateOrderConfirmationHTML(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): string {
    const itemsHTML = orderItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center;">
            ${
              item.productImage
                ? `<img src="${item.productImage}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 12px; border-radius: 4px;">`
                : ""
            }
            <div>
              <strong>${item.productName}</strong><br>
              <small>SKU: ${item.sku}</small>
            </div>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.sellingPrice.toFixed(
          2
        )} ${order.customerCurrency}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.subtotal.toFixed(
          2
        )} ${order.customerCurrency}</td>
      </tr>
    `
      )
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #2563eb; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Order Confirmation</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Thank you for your order!</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 12px 0; color: #1e293b;">Order Details</h2>
            <p style="margin: 4px 0;"><strong>Order Number:</strong> #${
              order.orderNumber
            }</p>
            <p style="margin: 4px 0;"><strong>Order Date:</strong> ${format(
              new Date(order.orderDate),
              "PPP"
            )}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; text-transform: capitalize;">${
              order.orderStatus
            }</span></p>
            ${
              order.estimatedDeliveryDate
                ? `<p style="margin: 4px 0;"><strong>Estimated Delivery:</strong> ${format(
                    new Date(order.estimatedDeliveryDate),
                    "PPP"
                  )}</p>`
                : ""
            }
          </div>

          <h3 style="color: #1e293b; margin: 24px 0 16px 0;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 12px; text-align: left; color: #475569;">Product</th>
                <th style="padding: 12px; text-align: center; color: #475569;">Qty</th>
                <th style="padding: 12px; text-align: right; color: #475569;">Price</th>
                <th style="padding: 12px; text-align: right; color: #475569;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div style="border-top: 2px solid #e2e8f0; padding-top: 16px; text-align: right;">
            <p style="margin: 4px 0; font-size: 16px;"><strong>Subtotal: ${order.customerSubtotal.toFixed(
              2
            )} ${order.customerCurrency}</strong></p>
            ${
              order.customerShippingCost
                ? `<p style="margin: 4px 0;">Shipping: ${order.customerShippingCost.toFixed(
                    2
                  )} ${order.customerCurrency}</p>`
                : ""
            }
            ${
              order.customerTaxAmount
                ? `<p style="margin: 4px 0;">Tax: ${order.customerTaxAmount.toFixed(
                    2
                  )} ${order.customerCurrency}</p>`
                : ""
            }
            <p style="margin: 12px 0 0 0; font-size: 20px; color: #2563eb;"><strong>Total: ${order.customerTotalAmount.toFixed(
              2
            )} ${order.customerCurrency}</strong></p>
          </div>

          <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 16px; border-radius: 8px; margin-top: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #065f46;">Shipping Address</h4>
            <p style="margin: 0; white-space: pre-line;">${
              order.shippingAddress
            }</p>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="/orders/${
              order.$id
            }" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Track Your Order
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateOrderConfirmationText(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): string {
    return `
Order Confirmation - #${order.orderNumber}

Thank you for your order!

Order Details:
- Order Number: #${order.orderNumber}
- Order Date: ${format(new Date(order.orderDate), "PPP")}
- Status: ${order.orderStatus}
- Total: ${order.customerTotalAmount.toFixed(2)} ${order.customerCurrency}

Items:
${orderItems
  .map(
    (item) =>
      `- ${item.productName} (${item.quantity}x) - ${item.subtotal.toFixed(
        2
      )} ${order.customerCurrency}`
  )
  .join("\n")}

Shipping Address:
${order.shippingAddress}

Track your order: /orders/${order.$id}
    `;
  }

  private generateVirtualStoreNewSaleText(
    order: Orders,
    orderItems: OrderItemCreateData[],
    totalCommission: number,
    virtualStore: VirtualStoreTypes
  ): string {
    return `
🎉 New Sale! Order #${order.orderNumber}

You've earned a commission!

Sale Summary:
- Order Number: #${order.orderNumber}
- Store: ${virtualStore.storeName}
- Customer Total: ${order.customerTotalAmount.toFixed(2)} ${
      order.customerCurrency
    }
- Your Commission: ${totalCommission.toFixed(2)} ${order.baseCurrency}

View order details: /admin/stores/${virtualStore.$id}/orders
    `;
  }

  private generatePhysicalStoreFulfillmentText(
    order: Orders,
    items: OrderItemCreateData[],
    totalValue: number,
    itemCount: number,
    physicalStore: PhysicalStoreTypes
  ): string {
    return `
📦 New Order to Fulfill - #${order.orderNumber}

Fulfillment Request:
- Order Number: #${order.orderNumber}
- Store: ${physicalStore.storeName}
- Items to Fulfill: ${itemCount}
- Order Value: ${totalValue.toFixed(2)} ${order.baseCurrency}

Items:
${items.map((item) => `- ${item.productName} (${item.quantity}x)`).join("\n")}

Shipping Address:
${order.shippingAddress}

Manage fulfillment: /admin/stores/${physicalStore.$id}/orders
    `;
  }

  private generateSystemAdminOrderHTML(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #6366f1; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">New Order Alert</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">System notification</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 4px 0;"><strong>Order Number:</strong> #${
              order.orderNumber
            }</p>
            <p style="margin: 4px 0;"><strong>Customer:</strong> ${
              order.customerEmail || "Guest"
            }</p>
            <p style="margin: 4px 0;"><strong>Total Value:</strong> ${order.customerTotalAmount.toFixed(
              2
            )} ${order.customerCurrency}</p>
            <p style="margin: 4px 0;"><strong>Items:</strong> ${orderItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            )}</p>
          </div>

          <div style="text-align: center;">
            <a href="/admin/orders/${
              order.$id
            }" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Order Details
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateSystemAdminOrderText(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): string {
    return `
New Order Alert - #${order.orderNumber}

Order Details:
- Order Number: #${order.orderNumber}
- Customer: ${order.customerEmail || "Guest"}
- Total Value: ${order.customerTotalAmount.toFixed(2)} ${order.customerCurrency}
- Items: ${orderItems.reduce((sum, item) => sum + item.quantity, 0)}

View order details: /admin/orders/${order.$id}
    `;
  }

  private generateVirtualStoreNewSaleHTML(
    order: Orders,
    orderItems: OrderItemCreateData[],
    totalCommission: number,
    virtualStore: VirtualStoreTypes
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #10b981; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎉 New Sale!</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">You've earned a commission!</p>
        </div>
        
        <div style="padding: 24px;">
          <h2 style="color: #1e293b; margin: 0 0 16px 0;">Sale Summary</h2>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 4px 0;"><strong>Order Number:</strong> #${
              order.orderNumber
            }</p>
            <p style="margin: 4px 0;"><strong>Store:</strong> ${
              virtualStore.storeName
            }</p>
            <p style="margin: 4px 0;"><strong>Customer Total:</strong> ${order.customerTotalAmount.toFixed(
              2
            )} ${order.customerCurrency}</p>
            <p style="margin: 12px 0 4px 0; font-size: 18px; color: #10b981;"><strong>Your Commission: ${totalCommission.toFixed(
              2
            )} ${order.baseCurrency}</strong></p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="/admin/stores/${
              virtualStore.$id
            }/orders" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Order Details
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generatePhysicalStoreFulfillmentHTML(
    order: Orders,
    items: OrderItemCreateData[],
    totalValue: number,
    itemCount: number,
    physicalStore: PhysicalStoreTypes
  ): string {
    const itemsHTML = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${
          item.productName
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(
          item.basePrice * item.quantity
        ).toFixed(2)} ${order.baseCurrency}</td>
      </tr>
    `
      )
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #f59e0b; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📦 New Order to Fulfill</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Action required from your store</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background: #fefbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 12px 0; color: #92400e;">Fulfillment Request</h2>
            <p style="margin: 4px 0;"><strong>Order Number:</strong> #${
              order.orderNumber
            }</p>
            <p style="margin: 4px 0;"><strong>Store:</strong> ${
              physicalStore.storeName
            }</p>
            <p style="margin: 4px 0;"><strong>Items to Fulfill:</strong> ${itemCount}</p>
            <p style="margin: 4px 0;"><strong>Order Value:</strong> ${totalValue.toFixed(
              2
            )} ${order.baseCurrency}</p>
          </div>

          <h3 style="color: #1e293b; margin: 24px 0 12px 0;">Items to Fulfill</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 8px; text-align: left;">Product</th>
                <th style="padding: 8px; text-align: center;">Quantity</th>
                <th style="padding: 8px; text-align: right;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 16px; border-radius: 8px; margin-top: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #065f46;">Shipping Address</h4>
            <p style="margin: 0; white-space: pre-line;">${
              order.shippingAddress
            }</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="/admin/stores/${
              physicalStore.$id
            }/orders" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Manage Fulfillment
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateFulfillmentUpdateHTML(
    order: Orders,
    fulfillmentRecord: OrderFullfilmentRecords,
    statusMessage: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #059669; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Fulfillment Update</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Physical store has ${statusMessage} your order</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 4px 0;"><strong>Order Number:</strong> #${
              order.orderNumber
            }</p>
            <p style="margin: 4px 0;"><strong>Fulfillment Status:</strong> <span style="text-transform: capitalize;">${fulfillmentRecord.physicalStoreFulfillmentOrderStatus.replace(
              "_",
              " "
            )}</span></p>
            <p style="margin: 4px 0;"><strong>Items:</strong> ${
              fulfillmentRecord.itemCount
            }</p>
            <p style="margin: 4px 0;"><strong>Value:</strong> ${
              fulfillmentRecord.totalValue || "NA"
            } ${order.baseCurrency}</p>
          </div>
        </div>
      </div>
    `;
  }

  private generateFulfillmentUpdateText(
    order: Orders,
    fulfillmentRecord: OrderFullfilmentRecords,
    statusMessage: string
  ): string {
    return `
Fulfillment Update - Order #${order.orderNumber}

Physical store has ${statusMessage} your order.

Order Number: #${order.orderNumber}
Fulfillment Status: ${fulfillmentRecord.physicalStoreFulfillmentOrderStatus.replace(
      "_",
      " "
    )}
Items: ${fulfillmentRecord.itemCount}
Value: ${fulfillmentRecord.totalValue} ${order.baseCurrency}
    `;
  }

  private generateOrderStatusUpdateHTML(
    order: Orders,
    statusMessage: string
  ): string {
    const statusColors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: "#82db77ff",
      [OrderStatus.PROCESSING]: "#f59e0b",
      [OrderStatus.SHIPPED]: "#3b82f6",
      [OrderStatus.DELIVERED]: "#10b981",
      [OrderStatus.CANCELLED]: "#ef4444",
    };

    const color = statusColors[order.orderStatus as OrderStatus] || "#6b7280";

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: ${color}; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Order Update</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">${statusMessage}</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 4px 0;"><strong>Order Number:</strong> #${
              order.orderNumber
            }</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> <span style="background: ${color}20; color: ${color}; padding: 4px 8px; border-radius: 4px; text-transform: capitalize;">${
      order.orderStatus
    }</span></p>
            ${
              order.estimatedDeliveryDate
                ? `<p style="margin: 4px 0;"><strong>Estimated Delivery:</strong> ${format(
                    new Date(order.estimatedDeliveryDate),
                    "PPP"
                  )}</p>`
                : ""
            }
          </div>

          <div style="text-align: center;">
            <a href="/orders/${
              order.$id
            }" style="background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Track Your Order
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateOrderStatusUpdateText(
    order: Orders,
    statusMessage: string
  ): string {
    return `
Order Update - #${order.orderNumber}

${statusMessage}

Order Number: #${order.orderNumber}
Status: ${order.orderStatus}

Track your order: /orders/${order.$id}
    `;
  }

  private generateVirtualStoreStatusUpdateHTML(
    order: Orders,
    virtualStore: VirtualStoreTypes
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #2563eb; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Order Status Update</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Your customer's order has been updated</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 4px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
            <p style="margin: 4px 0;"><strong>Store:</strong> ${virtualStore.storeName}</p>
            <p style="margin: 4px 0;"><strong>New Status:</strong> <span style="text-transform: capitalize;">${order.orderStatus}</span></p>
          </div>

          <div style="text-align: center;">
            <a href="/admin/stores/${virtualStore.$id}/orders" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Order Details
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateVirtualStoreStatusUpdateText(
    order: Orders,
    virtualStore: VirtualStoreTypes
  ): string {
    return `
Order Status Update - #${order.orderNumber}

Your customer's order has been updated.

Order Number: #${order.orderNumber}
Store: ${virtualStore.storeName}
New Status: ${order.orderStatus}

View order details: /admin/stores/${virtualStore.$id}/orders
    `;
  }
}
