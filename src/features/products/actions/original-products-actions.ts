"use server";

import { createSafeActionClient } from "next-safe-action"
import { ProductSchema } from "@/lib/schemas";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, ORIGINAL_PRODUCT_ID, PRODUCTS_BUCKET_ID } from "@/lib/env-config";
import { authMiddleware, physicalStoreOwnerMiddleware } from "../../auth/auth-middleware";
import { ID, Query } from "node-appwrite";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const createNewProduct = action
    .use(authMiddleware)
    .schema(ProductSchema)
    .action(async ({ parsedInput: { images, storeId, ...values }, ctx }) => {
        const rollback = new AppwriteRollback(ctx.storage, ctx.databases)
        try {
            const productImagesUploaded = await Promise.all(
                images.map(async (image) => {
                    const imageId = ID.unique();

                    const uploadedImage = await ctx.storage.createFile(
                        PRODUCTS_BUCKET_ID,
                        imageId,
                        image
                    );
                    await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);
                    return {
                        id: uploadedImage.$id,
                        name: uploadedImage.name,
                        url: `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`
                    }
                }) || []
            );

            const newProduct = await ctx.databases.createDocument(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                ID.unique(),
                {
                    ...values,
                    createdBy: ctx.user.$id,
                    store: storeId,
                    imageIds: productImagesUploaded.map(image => image.id),
                    imageUrls: productImagesUploaded.map(image => image.url)
                }
            );
            await rollback.trackDocument(ORIGINAL_PRODUCT_ID, newProduct.$id);

            return { success: `Product with id: ${newProduct.$id} has been created` };
        } catch (error) {
            console.log("createNewProduct eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create product" };
        }
    })

export const getOriginalProducts = action
    .use(authMiddleware)
    .use(physicalStoreOwnerMiddleware)
    .action(async () => {
        try {
            const { databases } = await createSessionClient();
            const products = await databases.listDocuments(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                [
                    Query.orderDesc('$updatedAt')
                    // Query.limit(15)
                ]
            )

            return { products }
        } catch (error) {
            return { error: error instanceof Error ? error.message : "Failed to fetch products" };
        }
    })

export const getStoreOriginalProducts = async (physicalStoreId: string) => {
    try {
        const { databases } = await createSessionClient();
        const products = await databases.listDocuments(
            DATABASE_ID,
            ORIGINAL_PRODUCT_ID,
            [
                Query.equal("storeId", physicalStoreId)
            ]
        )

        return products
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to fetch products" };
    }
}