"use server";

import { createSafeActionClient } from "next-safe-action"
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, ORIGINAL_PRODUCT_ID, PRODUCTS_BUCKET_ID, PRODUCTS_IMAGES_COLORS_COLLECTION_ID, VIRTUAL_PRODUCT_ID } from "@/lib/env-config";
import { authMiddleware, physicalStoreOwnerMiddleware } from "../../../lib/actions/middlewares";
import { ID, Query } from "node-appwrite";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { revalidatePath } from "next/cache";
import { getAllVirtualPropByOriginalProduct } from "./virtual-products-actions";
import { DeleteProductSchema, ProductSchema } from "@/lib/schemas/products-schems";
import { OriginalProductTypes } from "@/lib/types";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const createNewProduct = action
    .use(authMiddleware)
    .schema(ProductSchema)
    .action(async ({ parsedInput: { images, categoryId, colorImages, storeId, ...values }, ctx }) => {
        const rollback = new AppwriteRollback(ctx.storage, ctx.databases)
        try {
            const generalImageDocuments = await Promise.all(
                images.map(async (image) => {
                    const imageId = ID.unique();
                    const uploadedImage = await ctx.storage.createFile(
                        PRODUCTS_BUCKET_ID,
                        imageId,
                        image
                    );
                    await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);

                    return {
                        imageUrl: `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`
                    };
                }) || []
            );

            const colorImagesDocuments = [];
            for (const colorImage of colorImages) {
                const color = colorImages.find(c => c.colorHex === colorImage.colorHex);
                if (!color) {
                    throw new Error(`Color ${colorImage.colorHex} not found`);
                }

                const colorDocs = await Promise.all(
                    colorImage.images.map(async (image) => {
                        const imageId = ID.unique();
                        const uploadedImage = await ctx.storage.createFile(
                            PRODUCTS_BUCKET_ID,
                            imageId,
                            image
                        );
                        await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);

                        const doc = await ctx.databases.createDocument(
                            DATABASE_ID,
                            PRODUCTS_IMAGES_COLORS_COLLECTION_ID,
                            ID.unique(),
                            {
                                colorHex: color.colorHex,
                                colorName: color.colorName,
                                imageId: uploadedImage.$id,
                                imageUrl: `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`
                            }
                        );
                        await rollback.trackDocument(PRODUCTS_IMAGES_COLORS_COLLECTION_ID, doc.$id);
                        return doc
                    })
                );
                colorImagesDocuments.push(...colorDocs);
            }

            const newProduct = await ctx.databases.createDocument(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                ID.unique(),
                {
                    ...values,
                    createdBy: ctx.user.$id,
                    store: storeId,
                    colorImages: colorImagesDocuments.map(document => document.$id),
                    category: categoryId,
                    // imageIds: productImagesUploaded.map(image => image.id),
                    generalProductImages: generalImageDocuments.map(image => image.imageUrl)
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

export const getOriginalProductsWithVirtualProducts = action
    .use(authMiddleware)
    .use(physicalStoreOwnerMiddleware)
    .action(async () => {
        try {
            const { databases } = await createSessionClient();
            const products = await databases.listDocuments<OriginalProductTypes>(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                [
                    Query.orderDesc('$updatedAt')
                    // Query.limit(15)
                ]
            )

            if (products.total > 0) {
                const productsWithVirtualProducts = await Promise.all(
                    products.documents.map(async (product) => {
                        const virtualProductsResponse = await getAllVirtualPropByOriginalProduct(product.$id);

                        const virtualProducts = 'error' in virtualProductsResponse
                            ? []
                            : virtualProductsResponse.documents;

                        return {
                            ...product,
                            vitualProducts: virtualProducts
                        };
                    })
                );

                return {
                    products: {
                        ...products,
                        documents: productsWithVirtualProducts
                    }
                };
            }
            return {
                products: {
                    total: 0,
                    documents: []
                }
            };
        } catch (error) {
            return { error: error instanceof Error ? error.message : "Failed to fetch products" };
        }
    })

export const getStoreOriginalProducts = async (physicalStoreId: string) => {
    try {
        const { databases } = await createSessionClient();
        const products = await databases.listDocuments<OriginalProductTypes>(
            DATABASE_ID,
            ORIGINAL_PRODUCT_ID,
            [
                Query.equal("storeId", physicalStoreId),
            ]
        );

        return products
    } catch (error) {
        console.log("getStoreOriginalProducts: Failed to fetch products", error)
        return {
            documents: [],
            total: 0
        }
    }
}

export const getNearbyStoresOriginalProducts = async (
    southWest: { lat: number, lng: number },
    northEast: { lat: number, lng: number }
) => {
    try {
        const { databases } = await createSessionClient();
        const nearbyProducts = await databases.listDocuments<OriginalProductTypes>(
            DATABASE_ID,
            ORIGINAL_PRODUCT_ID,
            [
                Query.greaterThan("storeLat", southWest.lat),
                Query.lessThan("storeLat", northEast.lat),
                Query.greaterThan("storeLong", southWest.lng),
                Query.lessThan("storeLong", northEast.lng)
            ]
        );

        if (nearbyProducts.total > 0) {
            const productsWithVirtualProducts = await Promise.all(
                nearbyProducts.documents.map(async (product) => {
                    const virtualProductsResponse = await getAllVirtualPropByOriginalProduct(product.$id);

                    const virtualProducts = 'error' in virtualProductsResponse
                        ? []
                        : virtualProductsResponse.documents;

                    return {
                        ...product,
                        vitualProducts: virtualProducts
                    }
                })
            );

            return {
                ...nearbyProducts,
                documents: productsWithVirtualProducts
            }
        }

        return {
            total: 0,
            documents: []
        }
    } catch (error) {
        console.error("Error getting stores in bounding box:", error);
        return { total: 0, documents: [] }
    }
}

export const deleteOriginalProduct = action
    .use(authMiddleware)
    .schema(DeleteProductSchema)
    .action(async ({ parsedInput: { productId }, ctx }) => {
        const { databases } = ctx;
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                productId
            );

            const clones = await getAllVirtualPropByOriginalProduct(productId)

            if (clones && clones.total > 0) {
                await Promise.all(
                    clones.documents.map(async (document) => {
                        await databases.updateDocument(
                            DATABASE_ID,
                            VIRTUAL_PRODUCT_ID,
                            document.$id,
                            {
                                archived: true
                            }
                        )
                    })
                )
            }

            revalidatePath('/admin/stores/[storeId]/products')
        } catch (error) {
            return { error: error instanceof Error ? error.message : "Failed to delete product" };
        }
    })
