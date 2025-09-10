import { ID } from "node-appwrite";
import {
  createAdminClient,
  createOrderPermissions,
  createSessionClient,
} from "../appwrite";
import {
  BaseModel,
  PaginationResult,
  QueryFilter,
  QueryOptions,
} from "../core/database";
import { DATABASE_ID, ORDER_ITEMS_COLLECTION_ID } from "../env-config";
import { OrderItems } from "../types/appwrite/appwrite";
import { OrderItemCreateData } from "../schemas/order-schemas";

export interface OrderItemUpdateData {
  quantity?: number;
  subtotal?: number;
  commission?: number;
}

export class OrderItemsModel extends BaseModel<OrderItems> {
  constructor() {
    super(ORDER_ITEMS_COLLECTION_ID);
  }

  async findByOrder(
    orderId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<OrderItems>> {
    const filters: QueryFilter[] = [
      { field: "orderId", operator: "equal", value: orderId },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
      orderBy: "$createdAt",
      orderType: "asc",
    });
  }

  async findByVirtualStore(
    virtualStoreId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<OrderItems>> {
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

  async findByPhysicalStore(
    physicalStoreId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<OrderItems>> {
    const filters: QueryFilter[] = [
      { field: "physicalStoreId", operator: "equal", value: physicalStoreId },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });
  }

  async findByProduct(
    originalProductId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<OrderItems>> {
    const filters: QueryFilter[] = [
      {
        field: "originalProductId",
        operator: "equal",
        value: originalProductId,
      },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });
  }

  async createOrderItems(
    items: OrderItemCreateData[],
    customerId: string,
    virtualStoreId: string
  ): Promise<OrderItems[]> {
    try {
      const { databases } = await createAdminClient();
      const permissions = createOrderPermissions({
        storeId: virtualStoreId,
        customerId,
      });

      const createdItems = await Promise.all(
        items.map(async (item) => {
          const itemId = ID.unique();
          return databases.createDocument<OrderItems>(
            DATABASE_ID,
            ORDER_ITEMS_COLLECTION_ID,
            itemId,
            {
              orderId: item.orderId,
              virtualProductId: item.virtualProductId,
              originalProductId: item.originalProductId,
              productName: item.productName,
              productImage: item.productImage,
              sku: item.sku,
              basePrice: item.basePrice,
              sellingPrice: item.sellingPrice,
              commission: item.commission,
              quantity: item.quantity,
              subtotal: item.subtotal,
              virtualStoreId: item.virtualStoreId,
              physicalStoreId: item.physicalStoreId
            },
            permissions
          );
        })
      );

      this.invalidateCache(["findMany"]);

      return createdItems;
    } catch (error) {
      console.error("Error creating order items:", error);
      throw error;
    }
  }

  async updateOrderItem(
    itemId: string,
    updateData: OrderItemUpdateData
  ): Promise<OrderItems> {
    try {
      const updatedItem = await this.update(itemId, updateData);
      this.invalidateCache([
        `findById:${itemId}`,
        `findByOrder:${updatedItem.orderId}`,
        "findMany",
      ]);

      return updatedItem;
    } catch (error) {
      console.error("Error updating order item:", error);
      throw error;
    }
  }

  async deleteOrderItem(itemId: string): Promise<void> {
    try {
      const orderItem = await this.findById(itemId, {});

      await this.delete(itemId);

      if (orderItem) {
        this.invalidateCache([
          `findById:${itemId}`,
          `findByOrder:${orderItem.orderId}`,
          "findMany",
        ]);
      }
    } catch (error) {
      console.error("Error deleting order item:", error);
      throw error;
    }
  }

  async getOrderItemStats(
    filters: {
      virtualStoreId?: string;
      physicalStoreId?: string;
      dateRange?: { from: Date; to: Date };
    } = {}
  ) {
    try {
      const queryFilters: QueryFilter[] = [];

      if (filters.virtualStoreId) {
        queryFilters.push({
          field: "virtualStoreId",
          operator: "equal",
          value: filters.virtualStoreId,
        });
      }

      if (filters.physicalStoreId) {
        queryFilters.push({
          field: "physicalStoreId",
          operator: "equal",
          value: filters.physicalStoreId,
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

      const result = await this.findMany({
        filters: queryFilters,
        limit: 1000, // Get all items for stats calculation
      });

      const items = result.documents;

      return {
        totalItems: items.length,
        totalQuantity: items.reduce(
          (sum, item) => sum + (item.quantity || 1),
          0
        ),
        totalRevenue: items.reduce((sum, item) => sum + item.subtotal, 0),
        totalCommission: items.reduce(
          (sum, item) => sum + item.commission * (item.quantity || 1),
          0
        ),
        avgItemPrice:
          items.length > 0
            ? items.reduce((sum, item) => sum + item.sellingPrice, 0) /
              items.length
            : 0,
        topProducts: this.getTopProducts(items),
      };
    } catch (error) {
      console.error("Error getting order item stats:", error);
      throw error;
    }
  }

  private getTopProducts(items: OrderItems[]) {
    const productStats = items.reduce((acc, item) => {
      const key = item.originalProductId;
      if (!acc[key]) {
        acc[key] = {
          productId: item.originalProductId,
          productName: item.productName,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
        };
      }

      acc[key].totalQuantity += item.quantity;
      acc[key].totalRevenue += item.subtotal;
      acc[key].orderCount += 1;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(productStats)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }

  async bulkUpdateOrderItems(
    itemIds: string[],
    updateData: OrderItemUpdateData
  ): Promise<OrderItems[]> {
    try {
      const { databases } = await createSessionClient();

      const updatedItems = await Promise.all(
        itemIds.map(async (itemId) => {
          return databases.updateDocument<OrderItems>(
            DATABASE_ID,
            ORDER_ITEMS_COLLECTION_ID,
            itemId,
            updateData
          );
        })
      );

      this.invalidateCache(["findMany"]);
      itemIds.forEach((id) => {
        this.invalidateCache([`findById:${id}`]);
      });

      return updatedItems;
    } catch (error) {
      console.error("Error bulk updating order items:", error);
      throw error;
    }
  }
}
