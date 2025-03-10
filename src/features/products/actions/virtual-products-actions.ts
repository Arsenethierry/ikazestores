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
        );

        return products
    } catch (error) {
        console.log("getVirtualStoreProducts: ", error)
        throw error
    }
}
export const getVirtualProductById = async (productId: string) => {
    try {
        const { databases } = await createSessionClient();
        const product = await databases.getDocument(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            productId
        )

        return product
    } catch (error) {
        console.log("getVirtualProductById: ", error)
        throw error
    }
}

export const getAllVirtualProducts = async () => {
    try {
        const { databases } = await createSessionClient();
        const products = await databases.listDocuments(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
        );

        return products
    } catch (error) {
        console.log("getVirtualStoreProducts: ", error)
        throw error
    }
}

export const addNewVirtualProduct = action
    .use(authMiddleware)
    .schema(VirtualProductSchema)
    .action(async ({ parsedInput: values, ctx }) => {
        const rollback = new AppwriteRollback(ctx.storage, ctx.databases)

        try {
            const isValidPrice = values.sellingPrice > values.purchasePrice;
            if(!isValidPrice) throw new Error("Price must be greater than original price");
            
            const getExistingCloneedProduct = await ctx.databases.listDocuments(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                [
                    Query.and([
                        Query.equal("store", values.storeId),
                        Query.equal("originalProduct", values.originalProductId)
                    ])
                ]
            );

            if (getExistingCloneedProduct.total > 0) {
                throw new Error("Product already cloned")
            }

            const droppedProduct = await ctx.databases.createDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                ID.unique(),
                {
                    createdBy: ctx.user.$id,
                    store: values.storeId,
                    sellingPrice: values.sellingPrice,
                    purchasePrice: values.purchasePrice,
                    originalProduct: values.originalProductId,
                    title: values.title,
                    description: values.description,
                    imageUrls: values.imageUrls
                }
            );

            await rollback.trackDocument(VIRTUAL_PRODUCT_ID, droppedProduct.$id)

            return { success: 'Product successfully added to your store' };
        } catch (error) {
            console.log("addNewVirtualProduct eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to drop new product" };
        }
    })
