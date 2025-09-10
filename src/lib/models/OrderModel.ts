import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { BaseModel, PaginationResult } from "../core/database";
import { OrderNotificationService } from "../core/messaging-services";
import {
  COMMISSION_RECORDS_COLLECTION_ID,
  DATABASE_ID,
  ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
  ORDERS_COLLECTION_ID,
} from "../env-config";
import {
  CreateOrderInput,
  OrderItemCreateData,
} from "../schemas/order-schemas";
import {
  CommissionRecord,
  OrderFullfilmentRecords,
  OrderItems,
  Orders,
} from "../types/appwrite/appwrite";
import { AffiliateProductModel } from "./AffliateProductModel";
import { OrderItemsModel } from "./OrderItemsModel";
import { PhysicalStoreModel } from "./physical-store-model";
import { ProductModel } from "./ProductModel";
import { VirtualStore } from "./virtual-store";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "../constants";

export interface OrderWithRelations extends Orders {
  items?: PaginationResult<OrderItems>;
  fulfillmentRecords?: OrderFullfilmentRecords[];
  commissionRecords?: CommissionRecord[];
}

export interface OrderWithItems extends Orders {
  items?: PaginationResult<OrderItems>;
}
export class OrderModel extends BaseModel<Orders> {
  constructor() {
    super(ORDERS_COLLECTION_ID);
  }

  private get virtualStoreModel() {
    return new VirtualStore();
  }

  private get notificationService() {
    return new OrderNotificationService();
  }

  private get physicalStoreModel() {
    return new PhysicalStoreModel();
  }

  private get orderItemsModel() {
    return new OrderItemsModel();
  }

  private get affiliateProductModel() {
    return new AffiliateProductModel();
  }

  private get productModel() {
    return new ProductModel();
  }

  async createOrder(
    orderData: CreateOrderInput & { orderNumber: string }
  ): Promise<{
    success: boolean;
    order?: Orders;
    orderItems?: OrderItems[];
    fulfillmentRecords?: OrderFullfilmentRecords[];
    commissionRecords?: CommissionRecord[];
    error?: string;
  }> {
    const { databases } = await createAdminClient();

    try {
      const validation = await this.validateOrderData(orderData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const orderId = ID.unique();

      const orderRecord = await databases.createDocument<Orders>(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        orderId,
        {
          orderNumber: orderData.orderNumber,
          customerId: orderData.customerId,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          virtualStoreId: orderData.virtualStoreId,

          currency: orderData.currency,
          subtotal: orderData.subtotal,
          shippingCost: orderData.shippingCost,
          taxAmount: orderData.taxAmount,
          discountAmount: orderData.discountAmount,
          totalAmount: orderData.discountAmount,

          deliveryAddress: this.formatAddressString(orderData.shippingAddress),

          paymentMethod: orderData.paymentMethod,
          paymentStatus: orderData.paymentStatus || "pending",

          orderStatus: OrderStatus.PENDING,
          orderDate: orderData.orderDate,
          estimatedDeliveryDate: orderData.estimatedDeliveryDate,
          notes: orderData.notes,
        }
      );

      const orderItems = await this.orderItemsModel.createOrderItems(
        orderData.orderItems,
        orderData.customerId,
        orderData.virtualStoreId
      );

      const fulfillmentRecords =
        (await this.createFulfillmentRecords(
          orderId,
          orderData.orderItems,
          orderData.virtualStoreId
        )) || [];

      const commissionRecords = await this.createCommissionRecords(
        orderId,
        orderData.orderItems,
        orderData.virtualStoreId
      );

      await this.notificationService.sendNewOrderNotification(
        orderRecord,
        orderData.orderItems
      );

      return {
        success: true,
        order: orderRecord,
        orderItems,
        fulfillmentRecords,
        commissionRecords,
      };
    } catch (error) {
      console.error("Error creating order:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create order",
      };
    }
  }

  async findOrdersByStore(
    storeId: string,
    storeType: "virtual" | "physical",
    options: {
      page?: number;
      limit?: number;
      status?: OrderStatus[];
      fulfillmentStatus?: PhysicalStoreFulfillmentOrderStatus[];
      search?: string;
      customerId?: string;
      customerEmail?: string;
      dateRange?: { from: Date; to: Date };
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<{
    orders: OrderWithRelations[];
    total: number;
    hasMore: boolean;
  }> {
    const { databases } = await createAdminClient();

    try {
      const queries: any[] = [];

      // Store filter based on type
      if (storeType === "virtual") {
        queries.push(Query.equal("virtualStoreId", storeId));
      } else {
        // For physical stores, we need to find orders with their items
        // This requires querying fulfillment records first
        const fulfillmentRecords =
          await databases.listDocuments<OrderFullfilmentRecords>(
            DATABASE_ID,
            ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
            [Query.equal("physicalStoreId", storeId)]
          );

        const orderIds = [
          ...new Set(fulfillmentRecords.documents.map((r) => r.orderId)),
        ];

        if (orderIds.length === 0) {
          return { orders: [], total: 0, hasMore: false };
        }

        queries.push(Query.equal("$id", orderIds));
      }

      if (options.status && options.status.length > 0) {
        queries.push(Query.equal("orderStatus", options.status));
      }

      if (options.search) {
        queries.push(Query.search("orderNumber", options.search));
      }

      if (options.customerId) {
        queries.push(Query.equal("customerId", options.customerId));
      }

      if (options.customerEmail) {
        queries.push(Query.equal("customerEmail", options.customerEmail));
      }

      if (options.dateRange) {
        queries.push(
          Query.greaterThanEqual(
            "$createdAt",
            options.dateRange.from.toISOString()
          )
        );
        queries.push(
          Query.lessThanEqual("$createdAt", options.dateRange.to.toISOString())
        );
      }

      const limit = options.limit || 25;
      const offset = ((options.page || 1) - 1) * limit;
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));

      const sortField = options.sortBy || "$createdAt";
      const sortType = options.sortOrder === "asc" ? "ASC" : "DESC";
      queries.push(Query.orderDesc(sortField));

      const response = await databases.listDocuments<Orders>(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        queries
      );

      const ordersWithRelations = await Promise.all(
        response.documents.map(async (order) => {
          const [items, fulfillmentRecords, commissionRecords] =
            await Promise.all([
              this.orderItemsModel.findByOrder(order.$id),
              this.getFulfillmentRecords(
                order.$id,
                storeType === "physical" ? storeId : undefined
              ),
              this.getCommissionRecords(order.$id),
            ]);

          return {
            ...order,
            items,
            fulfillmentRecords,
            commissionRecords,
          };
        })
      );

      return {
        orders: ordersWithRelations,
        total: response.total,
        hasMore: response.total > offset + limit,
      };
    } catch (error) {
      console.error("Error fetching orders:", error);
      return {
        orders: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  async getCustomerOrders(
    customerId: string,
    options: {
      page?: number;
      limit?: number;
      status?: OrderStatus[];
    } = {}
  ): Promise<{
    orders: OrderWithItems[];
    total: number;
    hasMore: boolean;
  }> {
    const { databases } = await createSessionClient();

    try {
      const queries: any[] = [Query.equal("customerId", customerId)];

      if (options.status && options.status.length > 0) {
        queries.push(Query.equal("orderStatus", options.status));
      }

      const limit = options.limit || 10;
      const offset = ((options.page || 1) - 1) * limit;
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
          const items = await this.orderItemsModel.findByOrder(order.$id);
          return {
            ...order,
            items,
          };
        })
      );

      return {
        orders: ordersWithItems,
        total: response.total,
        hasMore: response.total > offset + limit,
      };
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      return {
        orders: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    updatedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const { databases } = await createSessionClient();

    try {
      const order = await databases.updateDocument<Orders>(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        orderId,
        {
          orderStatus: status,
          statusHistory: JSON.stringify([
            { status, timestamp: new Date().toISOString(), updatedBy },
          ]),
        }
      );

      await this.notificationService.sendOrderStatusUpdateNotification(order);

      return { success: true };
    } catch (error) {
      console.error("Error updating order status:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update status",
      };
    }
  }

  async updateFulfillmentStatus(
    fulfillmentId: string,
    status: PhysicalStoreFulfillmentOrderStatus,
    updatedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const { databases } = await createSessionClient();

    try {
      const fulfillmentRecord =
        await databases.updateDocument<OrderFullfilmentRecords>(
          DATABASE_ID,
          ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
          fulfillmentId,
          {
            physicalStoreFulfillmentOrderStatus: status,
          }
        );

      await this.notificationService.sendFulfillmentStatusUpdateNotification(
        fulfillmentRecord
      );

      const allFulfillments =
        await databases.listDocuments<OrderFullfilmentRecords>(
          DATABASE_ID,
          ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
          [Query.equal("orderId", fulfillmentRecord.orderId)]
        );

      const allCompleted = allFulfillments.documents.every(
        (f) => f.physicalStoreFulfillmentOrderStatus === "completed"
      );

      if (allCompleted) {
        await this.updateOrderStatus(
          fulfillmentRecord.orderId,
          OrderStatus.SHIPPED,
          updatedBy
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating fulfillment status:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update fulfillment",
      };
    }
  }

  async bulkUpdateOrders(
    orderIds: string[],
    updates: {
      orderStatus?: OrderStatus;
      paymentStatus?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updatePromises = orderIds.map((orderId) =>
        this.update(orderId, updates)
      );

      await Promise.all(updatePromises);

      return { success: true };
    } catch (error) {
      console.error("Error bulk updating orders:", error);
      return {
        success: false,
        error: "Failed to update orders",
      };
    }
  }

  async getOrderStats(
    storeId: string,
    storeType?: "virtual" | "physical",
    dateRange?: { from: Date; to: Date }
  ) {
    const { databases } = await createAdminClient();

    try {
      const queries: any[] = [];

      if (storeType === "virtual") {
        queries.push(Query.equal("virtualStoreId", storeId));
      } else if (storeType === "physical") {
        // Get orders through fulfillment records
        const fulfillmentRecords =
          await databases.listDocuments<OrderFullfilmentRecords>(
            DATABASE_ID,
            ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
            [Query.equal("physicalStoreId", storeId)]
          );

        const orderIds = [
          ...new Set(fulfillmentRecords.documents.map((r) => r.orderId)),
        ];

        if (orderIds.length === 0) {
          return {
            totalOrders: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            statusBreakdown: {},
            orders: [],
          };
        }

        queries.push(Query.equal("$id", orderIds));
      }

      if (dateRange) {
        queries.push(
          Query.greaterThanEqual("$createdAt", dateRange.from.toISOString())
        );
        queries.push(
          Query.lessThanEqual("$createdAt", dateRange.to.toISOString())
        );
      }

      const response = await databases.listDocuments<Orders>(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        queries
      );

      const orders = response.documents;

      // Calculate stats
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Status breakdown
      const statusBreakdown = orders.reduce((acc, order) => {
        acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Add missing statuses with 0 count
      Object.values(OrderStatus).forEach((status) => {
        if (!statusBreakdown[status]) {
          statusBreakdown[status] = 0;
        }
      });

      return {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        statusBreakdown,
        orders: orders.slice(0, 10), // Recent orders
      };
    } catch (error) {
      console.error("Error getting order stats:", error);
      throw error;
    }
  }

  private async getFulfillmentRecords(
    orderId: string,
    physicalStoreId?: string
  ): Promise<OrderFullfilmentRecords[]> {
    const { databases } = await createAdminClient();

    try {
      const queries = [Query.equal("orderId", orderId)];

      if (physicalStoreId) {
        queries.push(Query.equal("physicalStoreId", physicalStoreId));
      }

      const response = await databases.listDocuments<OrderFullfilmentRecords>(
        DATABASE_ID,
        ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
        queries
      );

      return response.documents;
    } catch (error) {
      console.error("Error fetching fulfillment records:", error);
      return [];
    }
  }

  private async createCommissionRecords(
    orderId: string,
    items: OrderItemCreateData[],
    virtualStoreId: string
  ): Promise<CommissionRecord[]> {
    const { databases } = await createAdminClient();

    const itemsByPhysicalStore = items.reduce((acc, item) => {
      if (!acc[item.physicalStoreId]) {
        acc[item.physicalStoreId] = [];
      }
      acc[item.physicalStoreId].push(item);
      return acc;
    }, {} as Record<string, OrderItemCreateData[]>);

    const commissionRecords = await Promise.all(
      Object.entries(itemsByPhysicalStore).map(
        async ([physicalStoreId, storeItems]) => {
          const recordId = ID.unique();
          const totalCommission = storeItems.reduce(
            (sum, item) => sum + item.commission * item.quantity,
            0
          );
          const orderValue = storeItems.reduce(
            (sum, item) => sum + item.subtotal,
            0
          );

          return databases.createDocument<CommissionRecord>(
            DATABASE_ID,
            COMMISSION_RECORDS_COLLECTION_ID,
            recordId,
            {
              orderId,
              virtualStoreId,
              physicalStoreId,
              totalCommission,
              orderValue,
              commissionStatus: "pending",
            }
          );
        }
      )
    );

    return commissionRecords;
  }

  private async createFulfillmentRecords(
    orderId: string,
    items: OrderItemCreateData[],
    virtualStoreId: string
  ): Promise<OrderFullfilmentRecords[] | null> {
    try {
      const { databases } = await createAdminClient();

      const itemsByPhysicalStore = items.reduce((acc, item) => {
        if (!acc[item.physicalStoreId]) {
          acc[item.physicalStoreId] = [];
        }
        acc[item.physicalStoreId].push(item);
        return acc;
      }, {} as Record<string, OrderItemCreateData[]>);

      const fulfillmentRecords = await Promise.all(
        Object.entries(itemsByPhysicalStore).map(
          async ([physicalStoreId, storeItems]) => {
            const recordId = ID.unique();
            const totalValue = storeItems.reduce(
              (sum, item) => sum + item.subtotal,
              0
            );
            const itemCount = storeItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

            return databases.createDocument<OrderFullfilmentRecords>(
              DATABASE_ID,
              ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
              recordId,
              {
                orderId,
                physicalStoreId,
                virtualStoreId,
                physicalStoreFulfillmentOrderStatus:
                  PhysicalStoreFulfillmentOrderStatus.PENDING,
                itemCount,
                totalValue,
              }
            );
          }
        )
      );

      return fulfillmentRecords;
    } catch (error) {
      console.log("error creating fullfillment records: ", error);
      return null;
    }
  }

  private async getCommissionRecords(
    orderId: string
  ): Promise<CommissionRecord[]> {
    const { databases } = await createSessionClient();

    try {
      const response = await databases.listDocuments<CommissionRecord>(
        DATABASE_ID,
        COMMISSION_RECORDS_COLLECTION_ID,
        [Query.equal("orderId", orderId)]
      );

      return response.documents;
    } catch (error) {
      console.error("Error fetching commission records:", error);
      return [];
    }
  }

  private async validateOrderData(orderData: CreateOrderInput): Promise<{
    valid: boolean;
    error?: string;
  }> {
    const storeIds = new Set(
      orderData.orderItems.map((item) => item.virtualStoreId)
    );
    if (storeIds.size > 1) {
      return {
        valid: false,
        error: "All items must be from the same virtual store",
      };
    }

    if (
      orderData.orderItems.length > 0 &&
      orderData.orderItems[0].virtualStoreId !== orderData.virtualStoreId
    ) {
      return { valid: false, error: "Virtual store ID mismatch" };
    }

    const calculatedSubtotal = orderData.orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    if (Math.abs(calculatedSubtotal - orderData.subtotal) > 0.01) {
      return { valid: false, error: "Subtotal calculation mismatch" };
    }

    if (Math.abs(calculatedSubtotal - orderData.subtotal) > 0.01) {
      return { valid: false, error: "Subtotal calculation mismatch" };
    }

    const calculatedTotal =
      orderData.subtotal +
      orderData.shippingCost +
      orderData.taxAmount -
      orderData.discountAmount;

    if (Math.abs(calculatedTotal - orderData.totalAmount) > 0.01) {
      return { valid: false, error: "Total calculation mismatch" };
    }

    return { valid: true };
  }

  private formatAddressString(address: any): string {
    return `${address.fullName}, ${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  }
}
