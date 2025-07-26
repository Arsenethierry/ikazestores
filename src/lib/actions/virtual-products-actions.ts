"use server";

import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, ORIGINAL_PRODUCT_ID, VARIANT_COMBINATIONS_COLLECTION_ID, } from "@/lib/env-config";
import { VirtualProductsModel } from "@/lib/models/virtual-products-model";
import { CreateVirtualProductTypes, OriginalProductTypes, OriginalProductWithVirtualProducts, ProductCombinationTypes, VirtualProductsSearchParams, VirtualProductTypes } from "@/lib/types";
import { calculateDistanceBtnCoordinates } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { Query } from "node-appwrite";

const virtualProductServices = new VirtualProductsModel();

export async function addNewVirtualProduct(data: CreateVirtualProductTypes): Promise<VirtualProductTypes | { error: string }> {
    try {
        const result = await virtualProductServices.createVirtualProduct(data);

        if ('error' in result) {
            return result;
        }

        revalidatePath('/admin/stores/[storeId]/products/clone-products', 'page');
        revalidatePath('/admin/stores/[storeId]/products', 'page');

        return result
    } catch (error) {
        console.error('Error adding virtual product:', error);
        return {
            error: error instanceof Error ? error.message : "Failed to add product to store"
        };
    }
}

export async function getOriginalProductsWithVirtualProducts(params: {
    storeId?: string;
    categoryId?: string;
    subcategoryId?: string;
    productTypeId?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    tags?: string[];
    maxPrice?: number;
    minPrice?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userLat?: number;
    userLng?: number;
    radiusKm?: number;
}) {
    try {
        const { databases } = await createSessionClient();
        const queries: string[] = [];

        if (params.storeId) queries.push(Query.equal('storeId', params.storeId));
        if (params.categoryId) queries.push(Query.equal('categoryId', params.categoryId));
        if (params.subcategoryId) queries.push(Query.equal('subcategoryId', params.subcategoryId));
        if (params.productTypeId) queries.push(Query.equal('productTypeId', params.productTypeId));
        if (params.status) queries.push(Query.equal('status', params.status));
        if (params.featured !== undefined) queries.push(Query.equal('featured', params.featured));
        if (params.search) queries.push(Query.search('name', params.search));
        if (params.tags?.length) queries.push(Query.contains('tags', params.tags));
        if (params.minPrice !== undefined) queries.push(Query.greaterThanEqual('basePrice', params.minPrice));
        if (params.maxPrice !== undefined) queries.push(Query.lessThanEqual('basePrice', params.maxPrice));

        if (params.limit) queries.push(Query.limit(params.limit));
        if (params.offset) queries.push(Query.offset(params.offset));
        if (params.sortBy) {
            const order = params.sortOrder === 'desc' ? Query.orderDesc : Query.orderAsc;
            queries.push(order(params.sortBy));
        }

        const originalProducts = await databases.listDocuments<OriginalProductTypes>(
            DATABASE_ID,
            ORIGINAL_PRODUCT_ID,
            queries
        );

        const productsWithVirtual = await Promise.all(
            originalProducts.documents.map(async (product) => {
                const virtualProductsResult = await virtualProductServices.getAllVirtualPropByOriginalProduct(product.$id);

                let priceRange = undefined;
                let combinationsData = undefined;

                if (product && product.hasVariants && product.combinationIds && product.combinationIds?.length > 0) {
                    const combinations = await Promise.all(
                        product.combinationIds.map((id: string) =>
                            databases.getDocument<ProductCombinationTypes>(DATABASE_ID, VARIANT_COMBINATIONS_COLLECTION_ID, id)
                        )
                    );
                    combinationsData = combinations;
                    const prices = combinations.map(combo => combo.price);
                    priceRange = {
                        min: Math.min(...prices),
                        max: Math.max(...prices)
                    };
                }

                return {
                    ...product,
                    combinations: combinationsData,
                    virtualProducts: virtualProductsResult.documents || [],
                    priceRange
                } as OriginalProductWithVirtualProducts;
            })
        );
        let filteredProducts = productsWithVirtual;

        if (params.userLat && params.userLng && params.radiusKm) {
            filteredProducts = productsWithVirtual.filter(product => {
                if (!product.storeLat || !product.storeLong) return false;

                const distance = calculateDistanceBtnCoordinates(
                    params.userLat!,
                    params.userLng!,
                    product.storeLat,
                    product.storeLong
                );

                return distance <= params.radiusKm!;
            });
        }

        return {
            success: true,
            data: {
                products: filteredProducts,
                total: filteredProducts.length,
                hasMore: originalProducts.total > (params.offset || 0) + filteredProducts.length
            }
        };
    } catch (error) {
        console.error('Error fetching products with virtual products:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch products"
        };
    }
}

export async function getNearbyOriginalProducts(params: {
    userLat: number;
    userLng: number;
    radiusKm: number;
    limit?: number;
}) {
    try {
        const { databases } = await createSessionClient();
        const allProducts = await databases.listDocuments<OriginalProductTypes>(
            DATABASE_ID,
            ORIGINAL_PRODUCT_ID,
            [
                Query.equal('status', 'active'),
                Query.limit(params.limit || 50)
            ]
        );

        const nearbyProducts = allProducts.documents.filter(product => {
            if (!product.storeLat || !product.storeLong) return false;

            const distance = calculateDistanceBtnCoordinates(
                params.userLat,
                params.userLng,
                product.storeLat,
                product.storeLong
            );

            return distance <= params.radiusKm;
        });

        const productsWithVirtual = await Promise.all(
            nearbyProducts.map(async (product) => {
                const virtualProductsResult = await virtualProductServices.getAllVirtualPropByOriginalProduct(product.$id);

                const distance = calculateDistanceBtnCoordinates(
                    params.userLat,
                    params.userLng,
                    product.storeLat,
                    product.storeLong
                );

                return {
                    ...product,
                    virtualProducts: virtualProductsResult.documents || [],
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
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch nearby products"
        };
    }
}

export async function checkProductCloneStatus(originalProductId: string, virtualStoreId: string) {
    try {
        const result = await virtualProductServices.checkProductCloneStatus(originalProductId, virtualStoreId);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error checking clone status:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to check clone status"
        };
    }
}

export async function getVirtualStoreProducts({
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
}) {
    try {
        const result = await virtualProductServices.getVirtualStoreProducts({
            virtualStoreId,
            limit,
            page,
            search,
            withStoreData
        });

        if (!result) {
            return {
                success: false,
                error: "Failed to fetch virtual store products"
            };
        }

        return {
            success: true,
            data: result.documents
        };
    } catch (error) {
        console.error("getVirtualStoreProducts error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch virtual store products"
        };
    }
}

export async function getVirtualProductById(productId: string) {
    try {
        const product = await virtualProductServices.findById(productId, {});
        
        if (!product) {
            return {
                success: false,
                error: "Product not found"
            };
        }

        return {
            success: true,
            data: product
        };
    } catch (error) {
        console.error("getVirtualProductById error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch product"
        };
    }
}

export async function getAllVirtualProducts({
    limit = 10,
    page = 1,
    search
}: {
    search?: string;
    page?: number;
    limit?: number
}) {
    try {
        const result = await virtualProductServices.getAllVirtualProducts({
            limit,
            page,
            search
        });

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error("getAllVirtualProducts error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch products",
            data: {
                documents: [],
                total: 0,
                totalPages: 0
            }
        };
    }
}

export async function updateVirtualProduct(productId: string, updateData: Partial<VirtualProductTypes>) {
    try {
        const updatedProduct = await virtualProductServices.update(productId, updateData);

        revalidatePath('/admin/stores/[storeId]/products', 'page');
        revalidatePath('/admin/stores/[storeId]/products/clone-products', 'page');

        return {
            success: true,
            data: updatedProduct
        };
    } catch (error) {
        console.error("updateVirtualProduct error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update product"
        };
    }
}

export async function removeProduct(productId: string) {
    try {
        await virtualProductServices.delete(productId);

        revalidatePath('/admin/stores/[storeId]/products/clone-products', 'page');
        revalidatePath('/admin/stores/[storeId]/products', 'page');

        return {
            success: true,
            message: "Product deleted successfully"
        };
    } catch (error) {
        console.error("removeProduct error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete product"
        };
    }
}

export async function getAllVirtualPropByOriginalProduct(originalProductId: string) {
    try {
        const result = await virtualProductServices.getAllVirtualPropByOriginalProduct(originalProductId);

        if ('error' in result) {
            return {
                success: false,
                error: result.error,
                data: {
                    total: 0,
                    documents: []
                }
            };
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error("getAllVirtualPropByOriginalProduct error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch products",
            data: {
                total: 0,
                documents: []
            }
        };
    }
}

export async function searchVirtualProducts({ query, limit = 10, currentStoreId }: { query: string, limit: number, currentStoreId?: string }) {
    try {
        const result = await virtualProductServices.searchVirtualProducts({ query, limit, currentStoreId });

        if ('error' in result) {
            return {
                success: false,
                error: result.error,
                data: {
                    total: 0,
                    documents: []
                }
            };
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error("searchVirtualProducts error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to search products",
            data: {
                total: 0,
                documents: []
            }
        };
    }
}


export async function getPaginatedVirtualProducts({ searchParams, storeId }: { searchParams: VirtualProductsSearchParams, storeId?: string }) {
    try {
        const result = await virtualProductServices.getPaginatedVirtualProducts({ searchParams, storeId });

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error("getPaginatedVirtualProducts error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch paginated products",
            data: {
                total: 0,
                documents: []
            }
        };
    }
}

export async function getVirtualProductsByStatus(status: "active" | "inactive" | "draft", options?: { limit?: number; page?: number }) {
    try {
        const result = await virtualProductServices.findByStatus(status, {
            limit: options?.limit || 10,
            offset: options?.page ? (options.page - 1) * (options.limit || 10) : 0
        });

        return {
            success: true,
            data: {
                documents: result.documents,
                total: result.total,
                totalPages: Math.ceil(result.total / (options?.limit || 10)),
                hasMore: result.hasMore
            }
        };
    } catch (error) {
        console.error("getVirtualProductsByStatus error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch products by status",
            data: {
                documents: [],
                total: 0,
                totalPages: 0,
                hasMore: false
            }
        };
    }
}

export async function getVirtualProductsByOwner(ownerId: string, options?: { limit?: number; page?: number }) {
    try {
        const result = await virtualProductServices.findByOwner(ownerId, {
            limit: options?.limit || 10,
            offset: options?.page ? (options.page - 1) * (options.limit || 10) : 0
        });

        return {
            success: true,
            data: {
                documents: result.documents,
                total: result.total,
                totalPages: Math.ceil(result.total / (options?.limit || 10)),
                hasMore: result.hasMore
            }
        };
    } catch (error) {
        console.error("getVirtualProductsByOwner error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch products by owner",
            data: {
                documents: [],
                total: 0,
                totalPages: 0,
                hasMore: false
            }
        };
    }
}
