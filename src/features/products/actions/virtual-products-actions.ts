"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, ORIGINAL_PRODUCT_ID, VARIANT_COMBINATIONS_COLLECTION_ID, VIRTUAL_COMBINATION_PRICES_COLLECTION_ID, VIRTUAL_PRODUCT_ID, VIRTUAL_STORE_ID } from "@/lib/env-config";
import { deleteVirtualProductSchema, GetProductsWithVirtualSchema, VirtualProductSchema } from "@/lib/schemas/products-schems";
import { OriginalProductTypes, OriginalProductWithVirtualProducts, ProductCombinationTypes, SortBy, VirtualProductsSearchParams, VirtualProductTypes, VirtualStoreTypes } from "@/lib/types";
import { calculateDistanceBtnCoordinates } from "@/lib/utils";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
});

export const getOriginalProductsWithVirtualProducts = action
    .use(authMiddleware)
    .schema(GetProductsWithVirtualSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { databases } = ctx;
        try {
            const queries: string[] = [];

            if (parsedInput.storeId) queries.push(Query.equal('storeId', parsedInput.storeId));
            if (parsedInput.categoryId) queries.push(Query.equal('categoryId', parsedInput.categoryId));
            if (parsedInput.subcategoryId) queries.push(Query.equal('subcategoryId', parsedInput.subcategoryId));
            if (parsedInput.productTypeId) queries.push(Query.equal('productTypeId', parsedInput.productTypeId));
            if (parsedInput.status) queries.push(Query.equal('status', parsedInput.status));
            if (parsedInput.featured !== undefined) queries.push(Query.equal('featured', parsedInput.featured));
            if (parsedInput.search) queries.push(Query.search('name', parsedInput.search));
            if (parsedInput.tags?.length) queries.push(Query.contains('tags', parsedInput.tags));
            if (parsedInput.priceMin !== undefined) queries.push(Query.greaterThanEqual('basePrice', parsedInput.priceMin));
            if (parsedInput.priceMax !== undefined) queries.push(Query.lessThanEqual('basePrice', parsedInput.priceMax));

            if (parsedInput.limit) queries.push(Query.limit(parsedInput.limit));
            if (parsedInput.offset) queries.push(Query.offset(parsedInput.offset));
            if (parsedInput.sortBy) {
                const order = parsedInput.sortOrder === 'desc' ? Query.orderDesc : Query.orderAsc;
                queries.push(order(parsedInput.sortBy));
            }

            const originalProducts = await databases.listDocuments<OriginalProductTypes>(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                queries
            );

            const productsWithVirtual = await Promise.all(
                originalProducts.documents.map(async (product) => {
                    const virtualProducts = await databases.listDocuments<VirtualProductTypes>(
                        DATABASE_ID,
                        VIRTUAL_PRODUCT_ID,
                        [Query.equal('originalProductId', product.$id)]
                    );

                    let priceRange = undefined;
                    let combinationsData = undefined;
                    if (product.hasVariants && product.combinationIds?.length > 0) {
                        const combinations = await Promise.all(
                            product.combinationIds.map((id: string) =>
                                databases.getDocument<ProductCombinationTypes>(DATABASE_ID, VARIANT_COMBINATIONS_COLLECTION_ID, id)
                            )
                        );
                        combinationsData = combinations
                        const prices = combinations.map(combo => combo.price);
                        priceRange = {
                            min: Math.min(...prices),
                            max: Math.max(...prices)
                        };
                    };

                    return {
                        ...product,
                        combinations: combinationsData,
                        virtualProducts: virtualProducts.documents,
                        priceRange
                    } as OriginalProductWithVirtualProducts;
                })
            );

            let filteredProducts = productsWithVirtual;
            if (parsedInput.userLat && parsedInput.userLng && parsedInput.radiusKm) {
                filteredProducts = productsWithVirtual.filter(product => {
                    if (!product.storeLat || !product.storeLong) return false;

                    const distance = calculateDistanceBtnCoordinates(
                        parsedInput.userLat!,
                        parsedInput.userLng!,
                        product.storeLat,
                        product.storeLong
                    );

                    return distance <= parsedInput.radiusKm!;
                });
            }
            return {
                success: true,
                data: {
                    products: filteredProducts,
                    total: filteredProducts.length,
                    hasMore: originalProducts.total > (parsedInput.offset || 0) + filteredProducts.length
                }
            };
        } catch (error) {
            console.error('Error fetching products with virtual products:', error);
            return {
                error: error instanceof Error ? error.message : "Failed to fetch products"
            };
        }
    });

export const getNearbyOriginalProducts = action
    .use(authMiddleware)
    .schema(GetProductsWithVirtualSchema.required({
        userLat: true,
        userLng: true,
        radiusKm: true
    }))
    .action(async ({ parsedInput, ctx }) => {
        const { databases } = ctx;
        try {
            const allProducts = await databases.listDocuments<OriginalProductTypes>(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                [
                    Query.equal('status', 'active'),
                    Query.limit(parsedInput.limit || 50)
                ]
            );
            const nearbyProducts = allProducts.documents.filter(product => {
                if (!product.storeLat || !product.storeLong) return false;

                const distance = calculateDistanceBtnCoordinates(
                    parsedInput.userLat,
                    parsedInput.userLng,
                    product.storeLat,
                    product.storeLong
                );

                return distance <= parsedInput.radiusKm;
            });

            const productsWithVirtual = await Promise.all(
                nearbyProducts.map(async (product) => {
                    const virtualProducts = await databases.listDocuments<VirtualProductTypes>(
                        DATABASE_ID,
                        VIRTUAL_PRODUCT_ID,
                        [Query.equal('originalProductId', product.$id)]
                    );

                    const distance = calculateDistanceBtnCoordinates(
                        parsedInput.userLat,
                        parsedInput.userLng,
                        product.storeLat,
                        product.storeLong
                    );

                    return {
                        ...product,
                        virtualProducts: virtualProducts.documents,
                        distance: Math.round(distance * 100) / 100,
                        priceRange: {
                            min: 0,
                            max: 0
                        }
                    } as OriginalProductWithVirtualProducts;
                })
            );

            productsWithVirtual.sort((a, b) => a.distance - b.distance);

            return {
                success: true,
                data: {
                    products: productsWithVirtual,
                    total: productsWithVirtual.length,
                    hasMore: false
                }
            };
        } catch (error) {
            console.error('Error fetching nearby products:', error);
            return {
                error: error instanceof Error ? error.message : "Failed to fetch nearby products"
            };
        }
    });

export const checkProductCloneStatus = action
    .use(authMiddleware)
    .schema(z.object({
        originalProductId: z.string(),
        virtualStoreId: z.string()
    }))
    .action(async ({ parsedInput, ctx }) => {
        const { databases } = ctx;
        try {
            const existingClone = await databases.listDocuments(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                [
                    Query.equal('originalProductId', parsedInput.originalProductId),
                    Query.equal('virtualStoreId', parsedInput.virtualStoreId)
                ]
            );

            return {
                success: true,
                data: {
                    isCloned: existingClone.total > 0,
                    cloneDetails: existingClone.documents[0] || null
                }
            };
        } catch (error) {
            console.error('Error checking clone status:', error);
            return {
                error: error instanceof Error ? error.message : "Failed to check clone status"
            };
        }
    });

export const getVirtualStoreProducts = async ({
    virtualStoreId,
    limit = 10,
    page = 1,
    search,
    withStoreData
}: {
    virtualStoreId: string;
    limit?: number;
    page?: number;
    search?: string;
    withStoreData: boolean;
}) => {
    try {
        const { databases } = await createSessionClient();
        const query = search ? [Query.search("title", search)] : []
        const products = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            [
                ...query,
                Query.equal("virtualStoreId", virtualStoreId),
                Query.offset((page - 1) * limit),
                Query.limit(limit),
                Query.orderDesc('$createdAt')
            ]
        );

        let documentsWithStoreData = products.documents;

        if (withStoreData) {
            const store = await databases.getDocument<VirtualStoreTypes>(
                DATABASE_ID,
                VIRTUAL_STORE_ID,
                virtualStoreId
            );

            documentsWithStoreData = products.documents.map(product => ({
                ...product,
                virtualStore: store
            }));
        }

        return {
            documents: documentsWithStoreData,
            total: products.total,
            totalPages: Math.ceil(products.total / limit)
        };
    } catch (error) {
        console.log("getVirtualStoreProducts: ", error)
        return null
    }
}

export const getVirtualProductById = async (productId: string) => {
    try {
        const { databases } = await createSessionClient();
        const product = await databases.getDocument<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            productId
        );

        return product
    } catch (error) {
        console.log("getVirtualProductById: ", error)
        return null
    }
}

export const getAllVirtualProducts = async ({
    limit = 10,
    page = 1,
    search
}: {
    search?: string;
    page?: number;
    limit?: number
}) => {
    try {
        const { databases } = await createSessionClient();
        const query = search ? [Query.search("title", search)] : []
        const products = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            [
                ...query,
                Query.offset((page - 1) * limit),
                Query.limit(limit),
                Query.orderDesc('$createdAt')
            ]
        );

        return {
            documents: products.documents,
            total: products.total,
            totalPages: Math.ceil(products.total / limit)
        }
    } catch (error) {
        console.log("getVirtualStoreProducts: ", error)
        return {
            documents: [],
            total: 0,
            totalPages: 0
        }
    }
}

export const addNewVirtualProduct = action
    .use(authMiddleware)
    .schema(VirtualProductSchema)
    .action(async ({ parsedInput: values, ctx }) => {
        const rollback = new AppwriteRollback(ctx.storage, ctx.databases)

        try {

            const isValidPrice = values.sellingPrice > values.purchasePrice;
            if (!isValidPrice) {
                throw new Error("Selling price must be greater than purchase price");
            }

            if (values.combinationPrices && values.combinationPrices.length > 0) {
                const invalidCombinations = values.combinationPrices.filter(
                    combo => combo.finalPrice <= combo.basePrice
                );
                if (invalidCombinations.length > 0) {
                    throw new Error("All combination final prices must be greater than base prices");
                }
            }

            const existingClonedProduct = await ctx.databases.listDocuments(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                [
                    Query.and([
                        Query.equal("virtualStoreId", values.storeId),
                        Query.equal("originalProductId", values.originalProductId)
                    ])
                ]
            );

            if (existingClonedProduct.total > 0) {
                throw new Error("Product already cloned to this store");
            }

            const originalProduct = await ctx.databases.getDocument(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                values.originalProductId
            );

            if (!originalProduct) {
                throw new Error("Original product not found");
            }

            const virtualProduct = await ctx.databases.createDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                ID.unique(),
                {
                    originalProductId: values.originalProductId,
                    createdBy: ctx.user.$id,
                    virtualStoreId: values.storeId,
                    sellingPrice: values.sellingPrice,
                    purchasePrice: values.purchasePrice,
                    currency: values.currency,
                    generalImageUrls: values.generalImageUrls.map(image => image),
                    mainProdCommission: values.commission,
                    combinationPricesIds: []
                }
            );

            await rollback.trackDocument(VIRTUAL_PRODUCT_ID, virtualProduct.$id);

            const combinationPriceIds: string[] = [];

            if (values.combinationPrices && values.combinationPrices.length > 0) {
                const combinationPromises = values.combinationPrices.map(async (combo) => {
                    const combinationPrice = await ctx.databases.createDocument(
                        DATABASE_ID,
                        VIRTUAL_COMBINATION_PRICES_COLLECTION_ID,
                        ID.unique(),
                        {
                            virtualProductId: virtualProduct.$id,
                            combinationId: combo.combinationId,
                            basePrice: combo.basePrice,
                            commission: combo.commission,
                            finalPrice: combo.finalPrice,
                            combination: combo.combinationId
                        }
                    );
                    await rollback.trackDocument(VIRTUAL_COMBINATION_PRICES_COLLECTION_ID, combinationPrice.$id);

                    return combinationPrice.$id;
                });

                const createdCombinationIds = await Promise.all(combinationPromises);
                combinationPriceIds.push(...createdCombinationIds);

                await ctx.databases.updateDocument(
                    DATABASE_ID,
                    VIRTUAL_PRODUCT_ID,
                    virtualProduct.$id,
                    {
                        combinationPricesIds: combinationPriceIds
                    }
                )
            }

            revalidatePath('/admin/stores/[storeId]/products/clone-products', 'page');
            revalidatePath('/admin/stores/[storeId]/products', 'page');

            return {
                success: 'Product successfully added to your store',
                data: {
                    virtualProductId: virtualProduct.$id,
                    combinationPricesCount: combinationPriceIds.length
                }
            };
        } catch (error) {
            console.error("addNewVirtualProduct error: ", error);
            await rollback.rollback();

            if (error instanceof Error) {
                return { error: error.message };
            }

            return { error: "Failed to add product to store" };
        }
    });

export const removeProduct = action
    .use(authMiddleware)
    .schema(deleteVirtualProductSchema)
    .action(async ({ parsedInput: { productId }, ctx }) => {
        try {
            await ctx.databases.deleteDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                productId
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
        const products = await databases.listDocuments<VirtualProductTypes>(
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

export const searchVirtualProducts = async ({ query, limit = 10, currentStoreId }: { query: string, limit: number, currentStoreId?: string }) => {
    try {
        const { databases } = await createSessionClient();

        const queries = [
            Query.or([
                Query.search("title", query),
                Query.contains("categoryNames", query),
            ]),
            Query.limit(limit)
        ]

        if (currentStoreId) {
            queries.push(Query.equal("virtualStoreId", currentStoreId));
        }

        const results = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            queries
        );

        return results
    } catch (error) {
        return {
            error:
                error instanceof Error ? error.message : "Failed to search products",
            total: 0,
            documents: []
        };
    }
}

export const getPaginatedVirtualProducts = async ({ searchParams, storeId }: { searchParams: VirtualProductsSearchParams, storeId?: string }) => {
    try {
        const { databases } = await createSessionClient();
        const queries = [Query.limit(5)];

        if (storeId) {
            queries.push(Query.equal("virtualStoreId", storeId))
        }

        if (searchParams.query && searchParams.query !== '') {
            queries.push(Query.search('title', searchParams.query));
        }

        if (searchParams.category && searchParams.category !== '') {
            queries.push(Query.search('categoryNames', searchParams.category));
        }

        if (searchParams.minPrice !== undefined && parseFloat(searchParams.minPrice) > 0) {
            queries.push(Query.greaterThanEqual('sellingPrice', parseFloat(searchParams.minPrice)));
        }

        if (searchParams.maxPrice !== undefined && parseFloat(searchParams.maxPrice) < 60000) {
            queries.push(Query.lessThanEqual('sellingPrice', parseFloat(searchParams.maxPrice)));
        }

        let sortDirection = 'DESC';
        let sortField = '$createdAt';

        switch (searchParams.sortBy) {
            case SortBy.priceLowToHigh:
                sortField = 'sellingPrice';
                sortDirection = 'ASC';
                queries.push(Query.orderAsc('sellingPrice'));
                break;
            case SortBy.priceHighToLow:
                sortField = 'sellingPrice';
                sortDirection = 'DESC';
                queries.push(Query.orderDesc('sellingPrice'));
                break;
            case SortBy.newestFirst:
            default:
                sortField = '$createdAt';
                sortDirection = 'DESC';
                queries.push(Query.orderDesc('$createdAt'));
                break;
        }

        if (searchParams.lastId && searchParams.lastId !== '') {
            const lastDoc = await databases.getDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                searchParams.lastId
            );

            if (sortDirection === 'DESC') {
                queries.push(Query.lessThan(sortField, lastDoc[sortField]));
            } else {
                queries.push(Query.greaterThan(sortField, lastDoc[sortField]));
            }
        } else if (searchParams.firstId && searchParams.firstId !== '') {
            const firstDoc = await databases.getDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                searchParams.firstId
            );

            if (sortDirection === 'DESC') {
                queries.push(Query.greaterThan(sortField, firstDoc[sortField]));
            } else {
                queries.push(Query.lessThan(sortField, firstDoc[sortField]));
            }
        }

        const products = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            queries
        );

        return products;
    } catch (error) {
        console.log("getVirtualStoreProducts: ", error);
        return {
            total: 0,
            documents: []
        };
    }
};