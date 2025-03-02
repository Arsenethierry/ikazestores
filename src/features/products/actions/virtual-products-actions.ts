"use server";

import { authMiddleware } from "@/features/auth/auth-middleware";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, VIRTUAL_PRODUCT_ID } from "@/lib/env-config";
import { VirtualProductSchema } from "@/lib/schemas";
import { createSafeActionClient } from "next-safe-action";
import { ID, Query } from "node-appwrite";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const getVirtualStoreProducts = async (virtualStoreId: string) => {
    try {
        const { databases } = await createSessionClient();
        const products = await databases.listDocuments(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            [
                Query.equal("store", virtualStoreId)
            ]
        )

        return products
    } catch (error) {
        console.log(error)
        return { error: error instanceof Error ? error.message : "Failed to fetch products" };
    }
}

export const addNewVirtualProduct = action
    .use(authMiddleware)
    .schema(VirtualProductSchema)
    .action(async ({ parsedInput: values, ctx }) => {
        const rollback = new AppwriteRollback(ctx.storage, ctx.databases)

        try {
            const droppedProduct = await ctx.databases.createDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                ID.unique(),
                {
                    droppedBy: ctx.user.$id,
                    store: values.storeId,
                    sellingPrice: values.sellingPrice,
                    purchasePrice: values.purchasePrice,
                    originalProduct: values.originalProductId
                }
            );

            return droppedProduct
        } catch (error) {
            console.log("addNewVirtualProduct eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to drop new product" };
        }
    })