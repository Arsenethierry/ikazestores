import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import {
  BaseModel,
  PaginationResult,
  QueryFilter,
  QueryOptions,
} from "../core/database";
import { OrderNotificationService } from "../core/messaging-services";
import {
  COMMISSION_RECORDS_COLLECTION_ID,
  DATABASE_ID,
  ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
  ORDERS_COLLECTION_ID,
  ORDERS_RETURN_REQUESTS_COLLECTION_ID,
} from "../env-config";
import {
  CreateOrderInput,
  CreateOrdersReturnRequestInput,
  OrderItemCreateData,
} from "../schemas/order-schemas";
import {
  CommissionRecord,
  OrderFullfilmentRecords,
  OrderItems,
  Orders,
  ReturnOrderRequests,
} from "../types/appwrite-types";
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
    try {
      const validation = await this.validateOrderData(orderData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const orderId = ID.unique();

      const orderPayload = {
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        customerEmail: orderData.customerEmail || null,
        customerPhone: orderData.customerPhone || "",
        virtualStoreId: orderData.virtualStoreId,

        currency: orderData.currency,
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        taxAmount: orderData.taxAmount,
        discountAmount: orderData.discountAmount,
        totalAmount: orderData.totalAmount,

        deliveryAddress: this.formatAddressString(orderData.shippingAddress),

        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus || "pending",

        orderStatus: OrderStatus.PENDING,
        orderDate: orderData.orderDate,
        estimatedDeliveryDate: orderData.estimatedDeliveryDate || null,
        notes: orderData.notes || null,

        totalCommission: null,
        isExpressDelivery: orderData.deliveryType === "express",
        itemCount: orderData.orderItems.length,
        deliveredAt: null,
        cancellationReason: null,
        cancelledAt: null,
        statusHistory: JSON.stringify([
          {
            status: OrderStatus.PENDING,
            timestamp: new Date().toISOString(),
            updatedBy: orderData.customerId,
          },
        ]),
      };

      const orderRecord = await this.create(orderPayload, orderData.customerId);

      const orderItemsWithOrderId = orderData.orderItems.map((item) => ({
        ...item,
        orderId: orderId,
      }));

      const orderItems = await this.orderItemsModel.createOrderItems(
        orderItemsWithOrderId,
        orderData.customerId,
        orderData.virtualStoreId
      );

      const fulfillmentRecords =
        (await this.createFulfillmentRecords(
          orderId,
          orderItemsWithOrderId,
          orderData.virtualStoreId
        )) || [];

      const commissionRecords = await this.createCommissionRecords(
        orderId,
        orderItemsWithOrderId,
        orderData.virtualStoreId
      );

      const totalCommission = commissionRecords.reduce(
        (sum, record) => sum + record.totalCommission,
        0
      );

      if (totalCommission > 0) {
        await this.updatePartial(orderId, { totalCommission });
        orderRecord.totalCommission = totalCommission;
      }

      await this.notificationService.sendNewOrderNotification(
        orderRecord,
        orderItemsWithOrderId
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

  /**
   * Find orders by store (virtual or physical)
   * Uses BaseModel.findMany with proper filters
   */
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
    try {
      const filters: QueryFilter[] = [];

      // Store filter based on type
      if (storeType === "virtual") {
        filters.push({
          field: "virtualStoreId",
          operator: "equal",
          value: storeId,
        });
      } else {
        // For physical stores, get order IDs from fulfillment records
        const { databases } = await createAdminClient();
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

        filters.push({
          field: "$id",
          operator: "in",
          values: orderIds,
        });
      }

      // Add additional filters
      if (options.status && options.status.length > 0) {
        filters.push({
          field: "orderStatus",
          operator: "in",
          values: options.status,
        });
      }

      if (options.customerId) {
        filters.push({
          field: "customerId",
          operator: "equal",
          value: options.customerId,
        });
      }

      if (options.customerEmail) {
        filters.push({
          field: "customerEmail",
          operator: "equal",
          value: options.customerEmail,
        });
      }

      if (options.dateRange) {
        filters.push({
          field: "$createdAt",
          operator: "greaterThanEqual",
          value: options.dateRange.from.toISOString(),
        });
        filters.push({
          field: "$createdAt",
          operator: "lessThanEqual",
          value: options.dateRange.to.toISOString(),
        });
      }

      const limit = options.limit || 25;
      const offset = ((options.page || 1) - 1) * limit;

      const result = await this.findMany({
        filters,
        limit,
        offset,
        orderBy: options.sortBy || "$createdAt",
        orderType: options.sortOrder || "desc",
      });

      const ordersWithRelations = await Promise.all(
        result.documents.map(async (order) => {
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
        total: result.total,
        hasMore: result.hasMore,
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
    try {
      const filters: QueryFilter[] = [
        { field: "customerId", operator: "equal", value: customerId },
      ];

      if (options.status && options.status.length > 0) {
        filters.push({
          field: "orderStatus",
          operator: "in",
          values: options.status,
        });
      }

      const limit = options.limit || 10;
      const offset = ((options.page || 1) - 1) * limit;

      const result = await this.findMany({
        filters,
        limit,
        offset,
        orderBy: "$createdAt",
        orderType: "desc",
      });

      const ordersWithItems = await Promise.all(
        result.documents.map(async (order) => {
          const items = await this.orderItemsModel.findByOrder(order.$id);
          return { ...order, items };
        })
      );

      return {
        orders: ordersWithItems,
        total: result.total,
        hasMore: result.hasMore,
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

  async findByOrderNumber(orderNumber: string): Promise<Orders | null> {
    return this.findOneByField("orderNumber", orderNumber);
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    updatedBy: string,
    cancellationReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentOrder = await this.findById(orderId, {});
      if (!currentOrder) {
        return { success: false, error: "Order not found" };
      }

      const updateData: Partial<Orders> = {
        orderStatus: status,
      };

      if (status === OrderStatus.CANCELLED) {
        updateData.cancellationReason = cancellationReason;
        updateData.cancelledAt = new Date().toISOString();
      } else if (status === OrderStatus.DELIVERED) {
        updateData.deliveredAt = new Date().toISOString();
      }

      const currentHistory = currentOrder.statusHistory
        ? JSON.parse(currentOrder.statusHistory)
        : [];

      const newHistoryEntry = {
        status,
        timestamp: new Date().toISOString(),
        updatedBy,
        reason: cancellationReason || null,
      };

      updateData.statusHistory = JSON.stringify([
        ...currentHistory,
        newHistoryEntry,
      ]);

      const order = await this.updatePartial(orderId, updateData);

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

  async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: "pending" | "confirmed" | "failed"
  ): Promise<Orders> {
    return this.updatePartial(orderId, { paymentStatus });
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
      if (orderIds.length > 50) {
        return {
          success: false,
          error: "Maximum 50 orders can be updated at once",
        };
      }

      await this.batchUpdate(orderIds, updates);

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
    try {
      const filters: QueryFilter[] = [];

      if (storeType === "virtual") {
        filters.push({
          field: "virtualStoreId",
          operator: "equal",
          value: storeId,
        });
      } else if (storeType === "physical") {
        const { databases } = await createSessionClient();

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
            statusBreakdown: Object.values(OrderStatus).reduce(
              (acc, s) => ({ ...acc, [s]: 0 }),
              {}
            ),
            orders: [],
          };
        }

        filters.push({
          field: "$id",
          operator: "in",
          values: orderIds.slice(0, 100),
        });
      }

      if (dateRange) {
        filters.push({
          field: "$createdAt",
          operator: "greaterThanEqual",
          value: dateRange.from.toISOString(),
        });
        filters.push({
          field: "$createdAt",
          operator: "lessThanEqual",
          value: dateRange.to.toISOString(),
        });
      }

      const { documents: orders } = await this.findMany({ filters });

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      );
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const statusBreakdown = orders.reduce((acc, order) => {
        acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.values(OrderStatus).forEach((status) => {
        if (!statusBreakdown[status]) statusBreakdown[status] = 0;
      });

      return {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        statusBreakdown,
        orders: orders.slice(0, 10),
      };
    } catch (error) {
      console.error("Error getting order stats:", error);
      throw error;
    }
  }

  async getFulfillmentRecords(
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

  async getCommissionRecords(orderId: string): Promise<CommissionRecord[]> {
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

  async calculateAndRecordCommissions(orderId: string): Promise<{
    success: boolean;
    commissions?: CommissionRecord[];
    error?: string;
  }> {
    try {
      const { databases } = await createAdminClient();

      const order = await this.findById(orderId, {});
      if (!order) {
        return { success: false, error: "Order not found" };
      }

      const orderItems = await this.orderItemsModel.findByOrder(orderId);
      if (!orderItems.documents.length) {
        return { success: false, error: "No order items found" };
      }

      const virtualStoreModel = new VirtualStore();
      const virtualStore = await virtualStoreModel.findById(
        order.virtualStoreId,
        {}
      );

      if (!virtualStore) {
        return { success: false, error: "Virtual store not found" };
      }

      const commissions: CommissionRecord[] = [];
      let totalCommission = 0;

      for (const item of orderItems.documents) {
        const affiliateProduct = await this.affiliateProductModel.findById(
          item.virtualProductId,
          {}
        );

        if (!affiliateProduct) {
          console.warn(`Affiliate product not found for item: ${item.$id}`);
          continue;
        }

        const priceMarkup = item.sellingPrice - affiliateProduct.basePrice;
        const itemCommission = priceMarkup * (item.quantity || 1);

        if (itemCommission > 0) {
          const commissionRecord =
            await databases.createDocument<CommissionRecord>(
              DATABASE_ID,
              COMMISSION_RECORDS_COLLECTION_ID,
              ID.unique(),
              {
                orderId,
                orderItemId: item.$id,
                virtualStoreId: order.virtualStoreId,
                influencerId: virtualStore.ownerId,
                originalProductId: affiliateProduct.originalProductId,
                virtualProductId: item.virtualProductId,
                basePrice: affiliateProduct.basePrice,
                sellingPrice: item.sellingPrice,
                quantity: item.quantity || 1,
                commissionAmount: itemCommission,
                currency: order.currency,
                commissionStatus: "pending",
                calculatedAt: new Date().toISOString(),
              }
            );

          commissions.push(commissionRecord);
          totalCommission += itemCommission;
        }
      }

      if (totalCommission > 0) {
        await this.updatePartial(orderId, { totalCommission });
      }

      console.log(`Commissions calculated for order ${orderId}:`, {
        totalCommission,
        commissionRecords: commissions.length,
      });

      return {
        success: true,
        commissions,
      };
    } catch (error) {
      console.error("Error calculating commissions:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate commissions",
      };
    }
  }

  private async createCommissionRecords(
    orderId: string,
    items: OrderItemCreateData[],
    virtualStoreId: string
  ): Promise<CommissionRecord[]> {
    const { databases } = await createAdminClient();

    try {
      const itemsByPhysicalStore = items.reduce((acc, item) => {
        const storeId = item.physicalStoreId || "unknown";
        if (!acc[storeId]) {
          acc[storeId] = [];
        }
        acc[storeId].push(item);
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
    } catch (error) {
      console.error("Error creating commission records:", error);
      return [];
    }
  }

  private async createFulfillmentRecords(
    orderId: string,
    items: OrderItemCreateData[],
    virtualStoreId: string
  ): Promise<OrderFullfilmentRecords[] | null> {
    try {
      const { databases } = await createAdminClient();

      const itemsByPhysicalStore = items.reduce((acc, item) => {
        const storeId = item.physicalStoreId || "unknown";
        if (!acc[storeId]) {
          acc[storeId] = [];
        }
        acc[storeId].push(item);
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
                cancelledAt: null,
              }
            );
          }
        )
      );

      return fulfillmentRecords;
    } catch (error) {
      console.log("Error creating fulfillment records:", error);
      return null;
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

    const calculatedTotal =
      orderData.subtotal +
      orderData.shippingCost +
      orderData.taxAmount -
      orderData.discountAmount;

    if (Math.abs(calculatedTotal - orderData.totalAmount) > 0.01) {
      return { valid: false, error: "Total calculation mismatch" };
    }

    if (orderData.subtotal <= 0) {
      return { valid: false, error: "Order subtotal must be positive" };
    }

    if (orderData.totalAmount <= 0) {
      return { valid: false, error: "Order total must be positive" };
    }

    for (const item of orderData.orderItems) {
      if (item.quantity <= 0) {
        return {
          valid: false,
          error: `Invalid quantity for item: ${item.productName}`,
        };
      }

      if (item.sellingPrice <= 0) {
        return {
          valid: false,
          error: `Invalid price for item: ${item.productName}`,
        };
      }

      if (Math.abs(item.subtotal - item.sellingPrice * item.quantity) > 0.01) {
        return {
          valid: false,
          error: `Subtotal mismatch for item: ${item.productName}`,
        };
      }

      if (item.commission < 0) {
        return {
          valid: false,
          error: `Invalid commission for item: ${item.productName}`,
        };
      }

      if (item.commission > item.sellingPrice) {
        return {
          valid: false,
          error: `Commission cannot exceed selling price for item: ${item.productName}`,
        };
      }
    }

    return { valid: true };
  }

  private formatAddressString(address: any): string {
    return `${address.fullName}, ${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  }
}

export class ReturnOrderRequestsModel extends BaseModel<ReturnOrderRequests> {
  constructor() {
    super(ORDERS_RETURN_REQUESTS_COLLECTION_ID);
  }

  async createOrderReturnRequest(
    data: CreateOrdersReturnRequestInput
  ): Promise<{
    success: boolean;
    orderRequest?: ReturnOrderRequests;
    error?: string;
  }> {
    try {
      const results = await this.create(
        { ...data, requestedAt: new Date().toISOString() },
        data.customerId
      );

      return {
        success: true,
        orderRequest: results,
      };
    } catch (error) {
      console.error("Error requesting return:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to request return"
      );
    }
  }
}
