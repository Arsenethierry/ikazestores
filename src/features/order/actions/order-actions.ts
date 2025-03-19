"use actions"

import { authMiddleware } from "@/lib/actions/middlewares"
import { AppwriteRollback } from "@/lib/actions/rollback"
import { DATABASE_ID, ORDER_ID } from "@/lib/env-config"
import { CreateOrderSchema } from "@/lib/schemas"
import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { ID } from "node-appwrite"

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const createOrder = action
    .use(authMiddleware)
    .schema(CreateOrderSchema)
    .action(async ({ parsedInput: orderData, ctx }) => {
        const rollback = new AppwriteRollback(ctx.storage, ctx.databases)

        try {
            const newOrder = await ctx.databases.createDocument(
                DATABASE_ID,
                ORDER_ID,
                ID.unique(),
                orderData
            );
            revalidatePath('/my-orders')
            return { success: 'Product successfully added to your store', data: newOrder };
        } catch (error) {
            console.log("createOrder eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create new order" };
        }
    })