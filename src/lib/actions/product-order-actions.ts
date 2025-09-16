"use server";

import { createSafeActionClient } from "next-safe-action";
import { OrderModel, ReturnOrderRequestsModel } from "../models/OrderModel";
import { authMiddleware } from "./middlewares";
import { CreateOrderSchema } from "../schemas/order-schemas";
import { revalidatePath } from "next/cache";
import z from "zod";
import { OrderStatus } from "../constants";
import { differenceInHours } from "date-fns";
import { OrderItemsModel } from "../models/OrderItemsModel";
import { createSessionClient } from "../appwrite";
import { Query } from "node-appwrite";
import { Orders } from "../types/appwrite/appwrite";
import { DATABASE_ID, ORDERS_COLLECTION_ID } from "../env-config";

const orderModel = new OrderModel();
const orderReturnModel = new ReturnOrderRequestsModel();
const orderItemsModel = new OrderItemsModel();

const action = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Server action error:", error);
    return error.message;
  },
});

export const createOrderAction = action
  .schema(CreateOrderSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput: validatedData, ctx }) => {
    const { user } = ctx;
    console.log("%%%%%: ", validatedData)
    try {
      if (validatedData.customerId !== user.$id) {
        throw new Error(
          "Invalid customer ID - can only create orders for yourself"
        );
      }

      const currencies = [
        ...new Set(
          validatedData.orderItems.map((item) => {
            return validatedData.currency;
          })
        ),
      ];

      if (currencies.length > 1) {
        throw new Error("All items must use the same currency");
      }

      if (validatedData.totalAmount <= 0) {
        throw new Error("Order total must be greater than zero");
      }

      if (validatedData.orderItems.length === 0) {
        throw new Error("Order must contain at least one item");
      }

      const virtualStores = [
        ...new Set(validatedData.orderItems.map((item) => item.virtualStoreId)),
      ];
      if (virtualStores.length > 1) {
        throw new Error("All items must belong to the same virtual store");
      }

      if (virtualStores[0] !== validatedData.virtualStoreId) {
        throw new Error("Virtual store ID mismatch between order and items");
      }

      const orderNumber = generateOrderNumber();

      const orderPayload = {
        ...validatedData,
        orderNumber,
        customerEmail: validatedData.customerEmail || user.email || undefined,
        customerPhone:
          validatedData.customerPhone ||
          validatedData.shippingAddress?.phoneNumber ||
          "",
        orderDate: validatedData.orderDate || new Date().toISOString(),
        estimatedDeliveryDate:
          validatedData.estimatedDeliveryDate ||
          new Date(
            Date.now() +
              (validatedData.deliveryType === "express" ? 2 : 7) *
                24 *
                60 *
                60 *
                1000
          ).toISOString(),
        paymentStatus: validatedData.paymentStatus || "pending",
      };

      const result = await orderModel.createOrder(orderPayload);

      if (!result.success || !result.order) {
        throw new Error(result.error || "Failed to create order");
      }

      revalidatePath("/my-orders");
      revalidatePath("/admin/[storeId]/orders");
      revalidatePath(`/store/${validatedData.virtualStoreId}/orders`);

      return {
        success: true,
        data: {
          success: true,
          order: result.order,
          orderItems: result.orderItems,
          fulfillmentRecords: result.fulfillmentRecords,
          commissionRecords: result.commissionRecords,
        },
      };
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create order"
      );
    }
  });

export const cancelOrderAction = action
  .schema(
    z.object({
      orderId: z.string(),
      reason: z.string().min(1, "Cancellation reason is required"),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { orderId, reason } = parsedInput;

    try {
      const order = await orderModel.findById(orderId, {});

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.customerId !== user.$id) {
        throw new Error("Unauthorized: You can only cancel your own orders");
      }

      if (
        order.orderStatus !== OrderStatus.PENDING &&
        order.orderStatus !== OrderStatus.PROCESSING
      ) {
        throw new Error(
          `Order cannot be cancelled in status: ${order.orderStatus}`
        );
      }

      const orderDate = new Date(order.orderDate);
      const hoursSinceOrder = differenceInHours(new Date(), orderDate);

      const maxHours = order.orderStatus === OrderStatus.PENDING ? 24 : 2;

      if (hoursSinceOrder > maxHours) {
        throw new Error(
          `Order cancellation period has expired (${maxHours} hours limit for ${order.orderStatus} orders)`
        );
      }

      const updateResult = await orderModel.updateOrderStatus(
        order.$id,
        OrderStatus.CANCELLED,
        user.$id,
        reason
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to cancel order");
      }

      revalidatePath("/my-orders");
      revalidatePath(`/my-orders/${orderId}`);
      revalidatePath(`/admin/[storeId]/orders`);

      return { success: true, message: "Order cancelled successfully" };
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to cancel order"
      );
    }
  });

export const requestReturnAction = action
  .schema(
    z.object({
      orderId: z.string(),
      reason: z.string().min(1, "Return reason is required"),
      description: z.string().optional(),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { orderId, reason, description } = parsedInput;

    try {
      const order = await orderModel.findById(orderId, {});

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.customerId !== user.$id) {
        throw new Error("Unauthorized: You can only cancel your own orders");
      }

      if (order.orderStatus !== OrderStatus.DELIVERED) {
        throw new Error("Returns can only be requested for delivered orders");
      }

      const deliveryDate = order.deliveredAt
        ? new Date(order.deliveredAt)
        : new Date(order.$updatedAt);

      const daysSinceDelivery = Math.floor(
        (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const returnWindowDays = 30;
      if (daysSinceDelivery > returnWindowDays) {
        throw new Error(
          `Return period has expired (${returnWindowDays} days limit)`
        );
      }

      const returnResults = await orderReturnModel.createOrderReturnRequest({
        customerId: user.$id,
        orderId: order.$id,
        reason,
        description: description || undefined,
        returnOrderStatus: "pending",
      });

      if (!returnResults.success) {
        throw new Error(
          returnResults.error || "Failed to create return request"
        );
      }

      revalidatePath("/my-orders");
      revalidatePath(`/my-orders/${orderId}`);

      return {
        success: true,
        message: "Return request submitted successfully",
        returnRequest: returnResults.orderRequest,
      };
    } catch (error) {
      console.error("Error requesting return:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to request return",
      };
    }
  });

export const getCustomerOrdersAction = action
  .schema(
    z.object({
      customerId: z.string(),
      page: z.number().default(1),
      limit: z.number().default(10),
      status: z.array(z.nativeEnum(OrderStatus)).optional(),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    if (parsedInput.customerId !== user.$id) {
      throw new Error("Unauthorized: Can only fetch your own orders");
    }

    try {
      const result = await orderModel.getCustomerOrders(
        parsedInput.customerId,
        {
          page: parsedInput.page,
          limit: parsedInput.limit,
          status: parsedInput.status,
        }
      );

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      throw new Error("Failed to fetch orders");
    }
  });

export const searchOrdersAction = action
  .schema(
    z.object({
      search: z.string().optional(),
      status: z.array(z.nativeEnum(OrderStatus)).optional(),
      paymentStatus: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(10),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    try {
      const { databases } = await createSessionClient();
      const queries: any[] = [Query.equal("customerId", user.$id)];

      if (parsedInput.search) {
        queries.push(Query.search("orderNumber", parsedInput.search));
      }

      if (parsedInput.status && parsedInput.status.length > 0) {
        queries.push(Query.equal("orderStatus", parsedInput.status));
      }

      if (parsedInput.paymentStatus) {
        queries.push(Query.equal("paymentStatus", parsedInput.paymentStatus));
      }

      if (parsedInput.dateFrom) {
        queries.push(Query.greaterThanEqual("orderDate", parsedInput.dateFrom));
      }
      if (parsedInput.dateTo) {
        queries.push(Query.lessThanEqual("orderDate", parsedInput.dateTo));
      }

      if (parsedInput.minPrice !== undefined) {
        queries.push(
          Query.greaterThanEqual("totalAmount", parsedInput.minPrice)
        );
      }
      if (parsedInput.maxPrice !== undefined) {
        queries.push(Query.lessThanEqual("totalAmount", parsedInput.maxPrice));
      }

      const limit = parsedInput.limit;
      const offset = (parsedInput.page - 1) * limit;
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));
      queries.push(Query.orderDesc("$createdAt"));

      const response = await databases.listDocuments<Orders>(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        queries
      );

      const ordersWithItems = await Promise.all(
        response.documents.map(async (order) => {
          const items = await orderItemsModel.findByOrder(order.$id);
          return {
            ...order,
            items,
          };
        })
      );

      return {
        success: true,
        data: {
          orders: ordersWithItems,
          total: response.total,
          hasMore: response.total > offset + limit,
          currentPage: parsedInput.page,
          totalPages: Math.ceil(response.total / limit),
        },
      };
    } catch (error) {
      console.error("Error searching orders:", error);
      throw new Error("Failed to search orders");
    }
  });

export const downloadInvoiceAction = action
  .schema(
    z.object({
      orderId: z.string(),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { orderId } = parsedInput;

    try {
      const order = await orderModel.findById(orderId, {});
      if (!order) {
        throw new Error("Order not found");
      }

      if (order.customerId !== user.$id) {
        throw new Error(
          "Unauthorized: You can only download invoices for your own orders"
        );
      }

      const items = await orderItemsModel.findByOrder(orderId);

      const invoiceData = {
        invoiceNumber: `INV-${order.orderNumber}`,
        orderDate: order.orderDate,
        order: {
          ...order,
          items: items.documents,
        },
        customer: {
          id: user.$id,
          email: order.customerEmail || user.email,
          phone: order.customerPhone,
        },
        shippingAddress: order.deliveryAddress,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        taxAmount: order.taxAmount,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        currency: order.currency,
      };

      return {
        success: true,
        data: {
          invoiceData,
          downloadUrl: `/api/invoice/${orderId}/download`,
        },
      };
    } catch (error) {
      console.error("Error generating invoice:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate invoice"
      );
    }
  });

export const trackShipmentAction = action
  .schema(
    z.object({
      orderId: z.string(),
      trackingNumber: z.string().optional(),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { orderId, trackingNumber } = parsedInput;

    try {
      const order = await orderModel.findById(orderId, {});
      if (!order) {
        throw new Error("Order not found");
      }

      if (order.customerId !== user.$id) {
        throw new Error("Unauthorized");
      }

      const trackingData = {
        trackingNumber: trackingNumber || `${order.orderNumber}-TRACK`,
        carrier: "DHL Express",
        status: order.orderStatus,
        estimatedDelivery: order.estimatedDeliveryDate,
        events: [
          {
            timestamp: order.orderDate,
            status: "Order Placed",
            location: "Online",
            description: "Order has been received and is being processed",
          },
          {
            timestamp: order.$updatedAt,
            status: "Processing",
            location: "Fulfillment Center",
            description: "Order is being prepared for shipment",
          },
        ],
      };

      if (order.orderStatus === OrderStatus.SHIPPED) {
        trackingData.events.push({
          timestamp: new Date().toISOString(),
          status: "Shipped",
          location: "Distribution Center",
          description: "Package has been shipped",
        });
      }

      if (order.orderStatus === OrderStatus.DELIVERED) {
        trackingData.events.push({
          timestamp: order.deliveredAt || new Date().toISOString(),
          status: "Delivered",
          location: order.deliveryAddress?.split(",")[0] || "Customer Address",
          description: "Package has been delivered",
        });
      }

      if (order.orderStatus === OrderStatus.CANCELLED) {
        trackingData.events.push({
          timestamp: order.cancelledAt || new Date().toISOString(),
          status: "Cancelled",
          location: "System",
          description: `Order cancelled: ${
            order.cancellationReason || "Customer request"
          }`,
        });
      }

      return {
        success: true,
        data: {
          trackingData,
        },
      };
    } catch (error) {
      console.error("Error tracking shipment:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to track shipment"
      );
    }
  });

function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${timestamp}-${random}`;
}
