"use server";

import { createSafeActionClient } from "next-safe-action";
import { OrderFilters, OrderModel } from "../models/OrderModel";
import {
  BulkUpdateOrdersSchema,
  GetOrdersSchema,
  UpdateFulfillmentStatusSchema,
  UpdateOrderStatusSchema,
} from "../schemas/products-schems";
import { authMiddleware } from "./middlewares";
import { revalidatePath } from "next/cache";
import { getAuthState } from "../user-permission";
import z from "zod";
import { OrderStatus } from "../constants";

const orderModel = new OrderModel();

const action = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Server action error:", error);
    return error.message;
  },
});

export const getOrdersAction = action
  .schema(GetOrdersSchema)
  .action(async ({ parsedInput }) => {
    const {
      storeId,
      storeType,
      filters = {},
      sorting = { field: "$createdAt", direction: "desc" },
      pagination = { page: 1, limit: 25 },
    } = parsedInput;
    try {
      const orderFilters: OrderFilters = {
        orderStatus: filters.status,
        fulfillmentStatus: filters.fulfillmentStatus,
        commissionStatus: filters.commissionStatus,
        dateRange: filters.dateRange,
        virtualStoreId:
          storeId && storeType === "virtual" ? storeId : filters.virtualStoreId,
        physicalStoreId:
          storeId && storeType === "physical"
            ? storeId
            : filters.physicalStoreId,
        customerId: filters.customerId,
        customerEmail: filters.customerEmail,
      };

      const offset = (pagination.page - 1) * pagination.limit;

      let ordersResult;

      if (storeType === "physical" && storeId) {
        ordersResult = await orderModel.findByPhysicalStore(storeId, {
          filters: Object.entries(orderFilters)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => ({ field: key, operator: "equal", value })),
          limit: pagination.limit,
          offset,
          orderBy: sorting.field,
          orderType: sorting.direction,
        });
      } else if (storeType === "virtual" && storeId) {
        ordersResult = await orderModel.findByVirtualStore(storeId, {
          filters: Object.entries(orderFilters)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => ({ field: key, operator: "equal", value })),
          limit: pagination.limit,
          offset,
          orderBy: sorting.field,
          orderType: sorting.direction,
        });
      } else {
        ordersResult = await orderModel.findWithFilters(orderFilters, {
          limit: pagination.limit,
          offset,
          orderBy: sorting.field,
          orderType: sorting.direction,
        });
      }

      const ordersWithRelations = await Promise.all(
        ordersResult.documents.map(async (order) => {
          return await orderModel.getOrderWithRelations(order.$id);
        })
      );

      return {
        success: true,
        data: {
          orders: ordersWithRelations.filter(Boolean),
          total: ordersResult.total,
          page: pagination.page,
          limit: pagination.limit,
        },
      };
    } catch (error) {
      console.error("Get orders error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
      };
    }
  });

export const getOrderById = async (orderId: string) => {
  try {
    const order = await orderModel.getOrderWithRelations(orderId);
    if (!order) {
      return { error: "Order not found" };
    }

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error("Get order by ID error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to fetch order",
    };
  }
};

export const updateOrderStatusAction = action
  .schema(UpdateOrderStatusSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { orderId, status, notes } = parsedInput;

    try {
      const order = await orderModel.findById(orderId, {});
      if (!order) {
        return { error: "Order not found" };
      }

      const updatedOrder = await orderModel.updateOrderStatus(
        orderId,
        status,
        notes
      );

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/stores/[storeId]/orders`, "page");

      return {
        success: true,
        data: updatedOrder,
        message: "Order status updated successfully",
      };
    } catch (error) {
      console.error("Update order status error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update order status",
      };
    }
  });

export const updateFulfillmentStatusAction = action
  .schema(UpdateFulfillmentStatusSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { fulfillmentRecordId, status, notes } = parsedInput;

    try {
      const fulfillmentRecord = await orderModel.findById(
        fulfillmentRecordId,
        {}
      );
      if (!fulfillmentRecord) {
        return { error: "Fulfillment record not found" };
      }

      // For fulfillment, we need to check physical store permissions
      const permissions = await checkOrderPermissions(
        fulfillmentRecord.physicalStoreId,
        "physical"
      );
      if (!permissions.canWrite) {
        throw new Error(
          "Access denied: Insufficient permissions to update fulfillment"
        );
      }

      await orderModel.updateFulfillmentStatus(
        fulfillmentRecordId,
        status,
        notes
      );

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/stores/[storeId]/orders`, "page");

      return {
        success: true,
        message: "Fulfillment status updated successfully",
      };
    } catch (error) {
      console.error("Update fulfillment status error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update fulfillment status",
      };
    }
  });

export const bulkUpdateOrdersAction = action
  .schema(BulkUpdateOrdersSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { orderIds, updates } = parsedInput;

    try {
      for (const orderId of orderIds) {
        const order = await orderModel.findById(orderId, {});
        if (!order) {
          throw new Error(`Order not found: ${orderId}`);
        }

        const permissions = await checkOrderPermissions(
          order.virtualStoreId,
          "virtual"
        );
        if (!permissions.canWrite) {
          throw new Error(
            `Access denied: Insufficient permissions for order ${order.orderNumber}`
          );
        }
      }

      const updatePromises = orderIds.map(async (orderId) => {
        if (updates.orderStatus) {
          return await orderModel.updateOrderStatus(
            orderId,
            updates.orderStatus,
            updates.notes
          );
        }
        return null;
      });

      const results = await Promise.all(updatePromises);

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/stores/[storeId]/orders`, "page");

      return {
        success: true,
        message: `Successfully updated ${orderIds.length} orders`,
        data: results.filter(Boolean),
      };
    } catch (error) {
      console.error("Bulk update orders error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to update orders",
      };
    }
  });

export const getOrderStatsAction = async ({
  storeId,
  storeType,
  dateRange,
}: {
  storeId?: string;
  storeType?: "virtual" | "physical";
  dateRange?: {
    from: Date;
    to: Date;
  };
}) => {
  try {
    const permissions = await checkOrderPermissions(storeId, storeType);
    if (!permissions.canRead) {
      throw new Error("Access denied");
    }

    const filters: OrderFilters = {
      dateRange,
      virtualStoreId: storeType === "virtual" ? storeId : undefined,
      physicalStoreId: storeType === "physical" ? storeId : undefined,
    };

    const stats = await orderModel.getOrderStats(filters, storeId, storeType);

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Get order stats error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch order statistics",
    };
  }
};

export const cancelOrderAction = action
  .schema(
    z.object({
      orderId: z.string().min(1),
      reason: z.string().optional(),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { orderId, reason } = parsedInput;

    try {
      const order = await orderModel.findById(orderId, {});
      if (!order) {
        return { error: "Order not found" };
      }

      // Check if order can be cancelled (only pending or processing orders)
      if (
        ![OrderStatus.PENDING, OrderStatus.PROCESSING].includes(
          order.orderStatus as OrderStatus
        )
      ) {
        return { error: "Order cannot be cancelled in its current status" };
      }

      const permissions = await checkOrderPermissions(
        order.virtualStoreId,
        "virtual"
      );
      if (!permissions.canWrite) {
        throw new Error(
          "Access denied: Insufficient permissions to cancel orders"
        );
      }

      const updatedOrder = await orderModel.updateOrderStatus(
        orderId,
        OrderStatus.CANCELLED,
        reason ? `Cancelled: ${reason}` : "Order cancelled"
      );

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/stores/[storeId]/orders`, "page");

      return {
        success: true,
        data: updatedOrder,
        message: "Order cancelled successfully",
      };
    } catch (error) {
      console.error("Cancel order error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to cancel order",
      };
    }
  });

export const getOverdueOrdersAction = async (
  storeId?: string,
  storeType?: "physical" | "virtual"
) => {
  try {
    const overdueOrders = await orderModel.findOverdueOrders({
      filters: [
        ...(storeId && storeType === "virtual"
          ? [
              {
                field: "virtualStoreId",
                operator: "equal" as const,
                value: storeId,
              },
            ]
          : []),
        // Note: Physical store filtering is handled within the model
      ],
    });

    let filteredOrders = overdueOrders.documents;
    if (storeId && storeType === "physical") {
      const physicalStoreOrders = await orderModel.findByPhysicalStore(storeId);
      const physicalStoreOrderIds = physicalStoreOrders.documents.map(
        (o) => o.$id
      );
      filteredOrders = overdueOrders.documents.filter((o) =>
        physicalStoreOrderIds.includes(o.$id)
      );
    }

    return {
      success: true,
      data: {
        orders: filteredOrders,
        count: filteredOrders.length,
      },
    };
  } catch (error) {
    console.error("Get overdue orders error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch overdue orders",
    };
  }
};

export const getOrdersByCustomerAction = action
  .schema(
    z.object({
      customerId: z.string().min(1),
      pagination: z
        .object({
          page: z.number().min(1),
          limit: z.number().min(1).max(100),
        })
        .optional(),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput }) => {
    const { customerId, pagination = { page: 1, limit: 25 } } = parsedInput;

    try {
      const auth = await getAuthState();

      // Only allow system admins or the customer themselves to access this
      if (!auth.isSystemAdmin && auth.user?.$id !== customerId) {
        throw new Error("Access denied: Can only view your own orders");
      }

      const offset = (pagination.page - 1) * pagination.limit;

      const ordersResult = await orderModel.findByCustomer(customerId, {
        limit: pagination.limit,
        offset,
        orderBy: "$createdAt",
        orderType: "desc",
      });

      const ordersWithRelations = await Promise.all(
        ordersResult.documents.map(async (order) => {
          return await orderModel.getOrderWithRelations(order.$id);
        })
      );

      return {
        success: true,
        data: {
          orders: ordersWithRelations.filter(Boolean),
          total: ordersResult.total,
          page: pagination.page,
          limit: pagination.limit,
        },
      };
    } catch (error) {
      console.error("Get orders by customer error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch customer orders",
      };
    }
  });

async function checkOrderPermissions(
  storeId?: string,
  storeType?: "physical" | "virtual"
) {
  const auth = await getAuthState();

  if (!auth.isAuthenticated) {
    throw new Error("Authentication required");
  }

  if (auth.isSystemAdmin) {
    return { canRead: true, canWrite: true, canDelete: true };
  }

  if (storeId) {
    const storeRole = auth.getStoreRole(storeId);
    if (!storeRole) {
      throw new Error(
        "Access denied: You don't have permission to access this store"
      );
    }

    // Store owners and admins can manage orders, staff can only read
    return {
      canRead: true,
      canWrite: storeRole === "owner" || storeRole === "admin",
      canDelete: storeRole === "owner",
    };
  }

  if (auth.isPhysicalStoreOwner || auth.isVirtualStoreOwner) {
    return { canRead: true, canWrite: true, canDelete: true };
  }

  throw new Error("Access denied: Insufficient permissions");
}
