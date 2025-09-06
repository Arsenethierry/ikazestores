import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  createDocumentPermissions,
  createSessionClient,
} from "../appwrite";
import {
  BaseModel,
  PaginationResult,
  QueryFilter,
  QueryOptions,
} from "../core/database";
import {
  COMMISSION_RECORDS_COLLECTION_ID,
  DATABASE_ID,
  ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
  ORDER_ITEMS_COLLECTION_ID,
  ORDERS_COLLECTION_ID,
} from "../env-config";
import {
  CommissionRecord,
  OrderFullfilmentRecords,
  OrderItems,
  Orders,
} from "../types/appwrite/appwrite";
import { PhysicalStoreModel } from "./physical-store-model";
import { ProductModel } from "./ProductModel";
import { VirtualStore } from "./virtual-store";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "../constants";
import { PhysicalStoreTypes, VirtualStoreTypes } from "../types";
import { OrderNotificationService } from "../core/messaging-services";

export interface OrderFilters {
  orderStatus?: OrderStatus[];
  fulfillmentStatus?: PhysicalStoreFulfillmentOrderStatus[];
  commissionStatus?: string[];
  virtualStoreId?: string;
  physicalStoreId?: string;
  customerId?: string;
  customerEmail?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface OrderItemCreateData {
  virtualProductId: string;
  originalProductId: string;
  productName: string;
  productImage?: string;
  sku: string;
  basePrice: number;
  sellingPrice: number;
  commission: number;
  quantity: number;
  subtotal: number;
  virtualStoreId: string;
  physicalStoreId: string;
}

export interface OrderCreateData {
  orderNumber: string;
  customerId: string;
  customerEmail?: string;
  virtualStoreId: string;
  customerCurrency: string;
  customerSubtotal: number;
  customerTotalAmount: number;
  customerShippingCost?: number;
  customerTaxAmount?: number;
  baseSubtotal: number;
  baseTotalAmount: number;
  baseShippingCost?: number;
  baseTaxAmount?: number;
  baseCurrency: string;
  exchangeRateToBase: number;
  shippingAddress: string;
  billingAddress?: string;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  estimatedDeliveryDate?: string;
  notes?: string;
  orderItems: OrderItemCreateData[];
}

export interface OrderWithRelations extends Orders {
  items?: OrderItems[];
  fulfillmentRecords?: OrderFullfilmentRecords[];
  commissionRecords?: CommissionRecord[];
  virtualStore?: VirtualStoreTypes;
  physicalStores?: PhysicalStoreTypes[];
}

export class OrderModel extends BaseModel<Orders> {
  constructor() {
    super(ORDERS_COLLECTION_ID);
  }

  async findByVirtualStore(
    virtualStoreId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Orders>> {
    const filters: QueryFilter[] = [
      { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });
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

  async findByPhysicalStore(
    physicalStoreId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Orders>> {
    try {
      const { databases } = await createSessionClient();

      const orderItemsResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDER_ITEMS_COLLECTION_ID,
        [Query.equal("physicalStoreId", physicalStoreId), Query.limit(1000)]
      );

      const orderIds = [
        ...new Set(orderItemsResponse.documents.map((item) => item.orderId)),
      ];

      if (orderIds.length === 0) {
        return { documents: [], total: 0, hasMore: false, limit: 1, offset: 0 };
      }

      const filters: QueryFilter[] = [
        { field: "$id", operator: "equal", values: orderIds },
        ...(options.filters || []),
      ];

      return this.findMany({
        ...options,
        filters,
        orderBy: "$createdAt",
        orderType: "desc",
      });
    } catch (error) {
      console.error("Error finding orders by physical store:", error);
      return { documents: [], total: 0, hasMore: false, limit: 1, offset: 0 };
    }
  }

  async findByCustomer(
    customerId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Orders>> {
    const filters: QueryFilter[] = [
      { field: "customerId", operator: "equal", value: customerId },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });
  }

  async findByStatus(
    status: OrderStatus,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Orders>> {
    const filters: QueryFilter[] = [
      { field: "orderStatus", operator: "equal", value: status },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });
  }

  async findOverdueOrders(
    options: QueryOptions = {}
  ): Promise<PaginationResult<Orders>> {
    const today = new Date().toISOString();
    const filters: QueryFilter[] = [
      { field: "estimatedDeliveryDate", operator: "lessThan", value: today },
      {
        field: "orderStatus",
        operator: "notEqual",
        value: OrderStatus.DELIVERED,
      },
      {
        field: "orderStatus",
        operator: "notEqual",
        value: OrderStatus.CANCELLED,
      },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
      orderBy: "estimatedDeliveryDate",
      orderType: "asc",
    });
  }

  async findWithFilters(
    filters: OrderFilters,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Orders>> {
    const queryFilters: QueryFilter[] = [];

    if (filters.orderStatus && filters.orderStatus.length > 0) {
      queryFilters.push({
        field: "orderStatus",
        operator: "equal",
        values: filters.orderStatus,
      });
    }

    if (filters.virtualStoreId) {
      queryFilters.push({
        field: "virtualStoreId",
        operator: "equal",
        value: filters.virtualStoreId,
      });
    }

    if (filters.customerId) {
      queryFilters.push({
        field: "customerId",
        operator: "equal",
        value: filters.customerId,
      });
    }

    if (filters.customerEmail) {
      queryFilters.push({
        field: "customerEmail",
        operator: "equal",
        value: filters.customerEmail,
      });
    }

    if (filters.dateRange) {
      queryFilters.push({
        field: "$createdAt",
        operator: "greaterThanEqual",
        value: filters.dateRange.from.toISOString(),
      });
      queryFilters.push({
        field: "$createdAt",
        operator: "lessThanEqual",
        value: filters.dateRange.to.toISOString(),
      });
    }

    if (filters.physicalStoreId) {
      return this.findByPhysicalStore(filters.physicalStoreId, {
        ...options,
        filters: queryFilters,
      });
    }

    return this.findMany({
      ...options,
      filters: queryFilters,
      orderBy: "$createdAt",
      orderType: "desc",
    });
  }

  async getOrderWithRelations(
    orderId: string
  ): Promise<OrderWithRelations | null> {
    try {
      const order = await this.findById(orderId, {});
      if (!order) return null;

      const { databases } = await createSessionClient();

      const orderItemsResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDER_ITEMS_COLLECTION_ID,
        [Query.equal("orderId", orderId)]
      );

      const fulfillmentResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
        [Query.equal("orderId", orderId)]
      );

      const commissionResponse = await databases.listDocuments(
        DATABASE_ID,
        COMMISSION_RECORDS_COLLECTION_ID,
        [Query.equal("orderId", orderId)]
      );

      const virtualStore = await this.virtualStoreModel.findById(
        order.virtualStoreId,
        {}
      );

      const physicalStoreIds = [
        ...new Set(
          orderItemsResponse.documents.map((item) => item.physicalStoreId)
        ),
      ];
      const physicalStores = await Promise.all(
        physicalStoreIds.map((id) => this.physicalStoreModel.findById(id, {}))
      );

      return {
        ...order,
        items: orderItemsResponse.documents as OrderItems[],
        fulfillmentRecords:
          fulfillmentResponse.documents as OrderFullfilmentRecords[],
        commissionRecords: commissionResponse.documents as CommissionRecord[],
        virtualStore: virtualStore || undefined,
        physicalStores: physicalStores.filter(Boolean) as PhysicalStoreTypes[],
      };
    } catch (error) {
      console.error("Error getting order with relations:", error);
      return null;
    }
  }

  async createOrder(data: OrderCreateData, userId: string): Promise<Orders> {
    try {
      const { databases } = await createAdminClient();
      const permissions = createDocumentPermissions({ userId });

      const orderId = ID.unique();
      const order = await databases.createDocument<Orders>(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        orderId,
        {
          ...data,
          orderStatus: OrderStatus.PENDING,
          itemCount: data.orderItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
        },
        permissions
      );

      const orderItems = await Promise.all(
        data.orderItems.map(async (item) => {
          const itemId = ID.unique();
          return databases.createDocument(
            DATABASE_ID,
            ORDER_ITEMS_COLLECTION_ID,
            itemId,
            {
              orderId,
              ...item,
            },
            permissions
          );
        })
      );

      // Create commission records grouped by virtual store
      const virtualStoreCommissions = data.orderItems.reduce((acc, item) => {
        if (!acc[item.virtualStoreId]) {
          acc[item.virtualStoreId] = 0;
        }
        acc[item.virtualStoreId] += item.commission * item.quantity;
        return acc;
      }, {} as Record<string, number>);

      await Promise.all(
        Object.entries(virtualStoreCommissions).map(
          async ([virtualStoreId, totalCommission]) => {
            const commissionId = ID.unique();
            return databases.createDocument(
              DATABASE_ID,
              COMMISSION_RECORDS_COLLECTION_ID,
              commissionId,
              {
                orderId,
                virtualStoreId,
                totalCommission,
                commissionStatus: "pending",
              },
              permissions
            );
          }
        )
      );

      // Create fulfillment records grouped by physical store
      const physicalStoreBreakdown = data.orderItems.reduce((acc, item) => {
        if (!acc[item.physicalStoreId]) {
          acc[item.physicalStoreId] = {
            itemCount: 0,
            totalValue: 0,
          };
        }
        acc[item.physicalStoreId].itemCount += item.quantity;
        acc[item.physicalStoreId].totalValue += item.basePrice * item.quantity;
        return acc;
      }, {} as Record<string, { itemCount: number; totalValue: number }>);

      await Promise.all(
        Object.entries(physicalStoreBreakdown).map(
          async ([physicalStoreId, breakdown]) => {
            const fulfillmentId = ID.unique();
            return databases.createDocument(
              DATABASE_ID,
              ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
              fulfillmentId,
              {
                orderId,
                physicalStoreId,
                itemCount: breakdown.itemCount,
                totalValue: breakdown.totalValue,
                physicalStoreFulfillmentOrderStatus:
                  PhysicalStoreFulfillmentOrderStatus.PENDING,
              },
              permissions
            );
          }
        )
      );

      await this.sendOrderNotifications(order, data.orderItems);

      this.invalidateCache(["findMany"]);

      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string
  ): Promise<Orders | { error: string }> {
    try {
      const updateData: any = {
        orderStatus: status,
        $updatedAt: new Date().toString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === OrderStatus.DELIVERED) {
        updateData.actualDeliveryDate = new Date().toISOString();
      }

      const updatedData = await this.update(orderId, updateData);

      await this.notificationService.sendOrderStatusUpdateNotification(
        updateData
      );

      return updateData;
    } catch (error) {
      console.error("Error updating order status:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update order status";
      return { error: errorMessage };
    }
  }

  async updateFulfillmentStatus(
    fulfillmentRecordId: string,
    status: PhysicalStoreFulfillmentOrderStatus,
    notes?: string
  ): Promise<void | { error: string }> {
    try {
      const { databases } = await createSessionClient();

      const updateData: any = {
        physicalStoreFulfillmentOrderStatus: status,
        $updatedAt: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === PhysicalStoreFulfillmentOrderStatus.SHIPPED) {
        updateData.shippedAt = new Date().toISOString();
      }

      if (status === PhysicalStoreFulfillmentOrderStatus.COMPLETED) {
        updateData.completedAt = new Date().toISOString();
      }

      await databases.updateDocument(
        DATABASE_ID,
        ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
        fulfillmentRecordId,
        updateData
      );

      const fulfillmentRecord = await databases.getDocument(
        DATABASE_ID,
        ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
        fulfillmentRecordId
      );

      await this.notificationService.sendFulfillmentStatusUpdateNotification(
        fulfillmentRecord as OrderFullfilmentRecords
      );
    } catch (error) {
      console.error("Error updating fulfillment status:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error updating fulfillment status";
      return { error: errorMessage };
    }
  }

  async getOrderStats(
    filters: OrderFilters = {},
    storeId?: string,
    storeType?: "physical" | "virtual"
  ) {
    try {
      const ordersResult =
        storeType === "physical" && storeId
          ? await this.findByPhysicalStore(storeId, {
              filters: this.convertToQueryFilters(filters),
            })
          : await this.findWithFilters(filters);

      const orders = ordersResult.documents;

      return {
        totalOrders: orders.length,
        totalRevenue: orders.reduce(
          (sum, order) => sum + order.customerTotalAmount,
          0
        ),
        avgOrderValue:
          orders.length > 0
            ? orders.reduce(
                (sum, order) => sum + order.customerTotalAmount,
                0
              ) / orders.length
            : 0,
        statusBreakdown: {
          [OrderStatus.PENDING]: orders.filter(
            (o) => o.orderStatus === OrderStatus.PENDING
          ).length,
          [OrderStatus.PROCESSING]: orders.filter(
            (o) => o.orderStatus === OrderStatus.PROCESSING
          ).length,
          [OrderStatus.SHIPPED]: orders.filter(
            (o) => o.orderStatus === OrderStatus.SHIPPED
          ).length,
          [OrderStatus.DELIVERED]: orders.filter(
            (o) => o.orderStatus === OrderStatus.DELIVERED
          ).length,
          [OrderStatus.CANCELLED]: orders.filter(
            (o) => o.orderStatus === OrderStatus.CANCELLED
          ).length,
        },
      };
    } catch (error) {
      console.error("Error getting order stats:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error getting order stats";
      return { error: errorMessage };
    }
  }

  private async sendOrderNotifications(
    order: Orders,
    orderItems: OrderItemCreateData[]
  ): Promise<void> {
    try {
      await this.notificationService.sendNewOrderNotification(
        order,
        orderItems
      );
    } catch (error) {
      console.error("Error sending order notifications:", error);
    }
  }

  private convertToQueryFilters(filters: OrderFilters): QueryFilter[] {
    const queryFilters: QueryFilter[] = [];

    if (filters.orderStatus && filters.orderStatus.length > 0) {
      queryFilters.push({
        field: "orderStatus",
        operator: "equal",
        value: filters.orderStatus,
      });
    }

    if (filters.virtualStoreId) {
      queryFilters.push({
        field: "virtualStoreId",
        operator: "equal",
        value: filters.virtualStoreId,
      });
    }

    if (filters.customerId) {
      queryFilters.push({
        field: "customerId",
        operator: "equal",
        value: filters.customerId,
      });
    }

    if (filters.dateRange) {
      queryFilters.push({
        field: "$createdAt",
        operator: "greaterThanEqual",
        value: filters.dateRange.from.toISOString(),
      });
      queryFilters.push({
        field: "$createdAt",
        operator: "lessThanEqual",
        value: filters.dateRange.to.toISOString(),
      });
    }

    return queryFilters;
  }
}
