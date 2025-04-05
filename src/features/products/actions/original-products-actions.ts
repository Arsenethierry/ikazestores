"use server";

import { createSafeActionClient } from "next-safe-action"
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, CATEGORIES_COLLECTION_ID, DATABASE_ID, ORIGINAL_PRODUCT_ID, PRODUCTS_BUCKET_ID, SUB_CATEGORIES_COLLECTION_ID, VIRTUAL_PRODUCT_ID } from "@/lib/env-config";
import { authMiddleware, physicalStoreOwnerMiddleware } from "../../../lib/actions/middlewares";
import { ID, Query } from "node-appwrite";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { revalidatePath } from "next/cache";
import { getAllVirtualPropByOriginalProduct } from "./virtual-products-actions";
import { CategoryById, CategorySchema, DeleteProductSchema, ProductSchema } from "@/lib/schemas/products-schems";
import { DocumentType } from "@/lib/types";

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

export const getOriginalProductsWithVirtualProducts = action
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
        const products = await databases.listDocuments(
            DATABASE_ID,
            ORIGINAL_PRODUCT_ID,
            [
                Query.equal("storeId", physicalStoreId),
            ]
        );

        return products
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to fetch products" };
    }
}

export const getNearbyStoresOriginalProducts = async (
    southWest: { lat: number, lng: number },
    northEast: { lat: number, lng: number }
) => {
    try {
        const { databases } = await createSessionClient();
        const nearbyProducts = await databases.listDocuments(
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

export const createNewCategory = action
    .use(authMiddleware)
    .schema(CategorySchema)
    .action(async ({ parsedInput: {
        categoryName,
        icon
    }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const uploadedIcon = await storage.createFile(
                PRODUCTS_BUCKET_ID,
                ID.unique(),
                icon
            );
            await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedIcon.$id);

            const newProduct = await databases.createDocument(
                DATABASE_ID,
                CATEGORIES_COLLECTION_ID,
                ID.unique(),
                {
                    categoryName,
                    iconFileId: uploadedIcon.$id,
                    iconUrl: `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedIcon.$id}/view?project=${APPWRITE_PROJECT_ID}`
                }
            );
            await rollback.trackDocument(CATEGORIES_COLLECTION_ID, newProduct.$id);

            return { success: `Category has been created successfully` };

        } catch (error) {
            console.log("createNewCategory error: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create category" };
        }
    });

export const getCategoryById = async (categoryId: string) => {
    try {
        const { databases } = await createSessionClient();
        const category = await databases.getDocument(
            DATABASE_ID,
            CATEGORIES_COLLECTION_ID,
            categoryId
        );
        return category;
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to fetch category", };
    }
}

export const deleteCategoryById = action
    .use(authMiddleware)
    .schema(CategoryById)
    .action(async ({ parsedInput: { categoryId }, ctx }) => {
        const { databases, storage } = ctx;
        try {
            const subCetegories = await getSubcategoriesByParentId(categoryId);
            const category = await getCategoryById(categoryId) as DocumentType;
            if (!category) {
                return { error: "Category not found" };
            }
            if (subCetegories.total > 0) {
                await Promise.all(
                    subCetegories.documents.map(async (subcategory) => {
                        await deleteSubcategoryById({ categoryId: subcategory.$id })
                    })
                )
            }
            if (category.iconFileId) {
                await storage.deleteFile(
                    PRODUCTS_BUCKET_ID,
                    category.iconFileId
                )
            }
            await databases.deleteDocument(
                DATABASE_ID,
                CATEGORIES_COLLECTION_ID,
                category.$id
            )
            return { success: "category deleted successfully" }
        } catch (error) {
            return { error: error instanceof Error ? error.message : "Failed to delete category" };
        }
    })

export const getSubcategoriesByParentId = async (categoryId: string) => {
    try {
        const { databases } = await createSessionClient();
        const subcategories = await databases.listDocuments(
            DATABASE_ID,
            SUB_CATEGORIES_COLLECTION_ID,
            [
                Query.equal("categoryId", categoryId)
            ]
        );
        return subcategories
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to fetch category",
            documents: [],
            total: 0
        };
    }
}

export const deleteSubcategoryById = action
    .use(authMiddleware)
    .schema(CategoryById)
    .action(async ({ parsedInput: { categoryId }, ctx }) => {
        const { databases } = ctx;
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                SUB_CATEGORIES_COLLECTION_ID,
                categoryId
            );
        } catch (error) {
            console.log("deleteSubcategoryById error: ", error)
            return { error: error instanceof Error ? error.message : "Failed to delete sub category" };
        }
    })