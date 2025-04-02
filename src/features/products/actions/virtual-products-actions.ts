"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, VIRTUAL_PRODUCT_ID } from "@/lib/env-config";
import { deleteVirtualProductSchema, VirtualProductSchema } from "@/lib/schemas";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
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
                Query.equal("virtualStore", virtualStoreId)
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
            if (!isValidPrice) throw new Error("Price must be greater than original price");

            const getExistingCloneedProduct = await ctx.databases.listDocuments(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                [
                    Query.and([
                        Query.equal("virtualStore", values.storeId),
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
                    virtualStoreId: values.storeId,
                    sellingPrice: values.sellingPrice,
                    purchasePrice: values.purchasePrice,
                    originalProduct: values.originalProductId,
                    title: values.title,
                    description: values.description,
                    imageUrls: values.imageUrls,
                    originalProductId: values.originalProductId,
                    virtualStore: values.storeId,
                }
            );

            await rollback.trackDocument(VIRTUAL_PRODUCT_ID, droppedProduct.$id)
            revalidatePath('/admin/stores/[storeId]/products/clone-products', 'page')
            return { success: 'Product successfully added to your store' };
        } catch (error) {
            console.log("addNewVirtualProduct eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to drop new product" };
        }
    });

export const removeProduct = action
    .use(authMiddleware)
    .schema(deleteVirtualProductSchema)
    .action(async ({ parsedInput: { productId, virtualStoreId }, ctx }) => {
        try {

            const existingCloneedProduct = await ctx.databases.listDocuments(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                [
                    Query.and([
                        Query.equal("store", virtualStoreId),
                        Query.equal("originalProduct", productId)
                    ])
                ]
            );

            if (existingCloneedProduct.total < 1) {
                throw new Error("No product found.")
            }

            await ctx.databases.deleteDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                existingCloneedProduct.documents[0].$id
            );

            revalidatePath('/admin/stores/[storeId]/products/clone-products', 'page')
        } catch (error) {
            console.log("removeProduct", error)
            return { error: error instanceof Error ? error.message : "Failed to delete product" };
        }
    })

export const getAllVirtualPropByOriginalProduct = async (originalProductId: string) => {
    try {
        const { databases } = await createSessionClient()
        const products = await databases.listDocuments(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            [
                Query.equal("originalProductId", originalProductId)
            ]
        );

        return products
    } catch (error) {
        return {
            error:
                error instanceof Error ? error.message : "Failed to fetch products",
            total: 0,
            documents: []
        };
    }
}
