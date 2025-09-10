"use server";

import { createSafeActionClient } from "next-safe-action";
import { OrderModel } from "../models/OrderModel";
import { authMiddleware } from "./middlewares";
import { CreateOrderSchema } from "../schemas/order-schemas";
import { revalidatePath } from "next/cache";
import z from "zod";
import { OrderStatus } from "../constants";

const orderModel = new OrderModel();

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

    try {
      if (validatedData.customerId !== user.$id) {
        throw new Error(
          "Invalid customer ID - can only create orders for yourself"
        );
      }

      const orderNumber = generateOrderNumber();

      const result = await orderModel.createOrder({
        ...validatedData,
        orderNumber,
      });

      if (!result.success || !result.order) {
        throw new Error(result.error || "Failed to create order");
      }

      revalidatePath("/my-orders");
      revalidatePath("/admin/[storeId]/orders");

      return {
        success: true,
        order: result.order,
      };
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create order"
      );
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
      throw new Error("Unauthorized");
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

function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${timestamp}-${random}`;
}
