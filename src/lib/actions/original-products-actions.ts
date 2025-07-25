"use server";

import { revalidatePath } from "next/cache";
import { OriginalProductsModel } from "@/lib/models/original-products-model";
import {
    CreateOriginalProductTypes,
    DeleteProductSchema,
    ProductSchemaProps,
    UpdateOriginalProductTypes,
    UpdateProductSchemaProps
} from "../schemas/products-schems";

const originalProductsModel = new OriginalProductsModel();

export async function createOriginalProduct(data: CreateOriginalProductTypes) {
    try {
        const validatedData = ProductSchemaProps.parse(data);

        const result = await originalProductsModel.createOriginalProduct(validatedData);

        if ('error' in result) {
            return { error: result.error };
        }

        revalidatePath('/admin/stores/[storeId]/products');
        return {
            success: `Product "${result.name}" created successfully!`,
            data: result
        };
    } catch (error) {
        console.error("createOriginalProduct action error: ", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Failed to create product" };
    }
}

export async function updateOriginalProduct(
    productId: string,
    data: UpdateOriginalProductTypes
) {
    try {
        const validatedData = UpdateProductSchemaProps.parse(data);

        const result = await originalProductsModel.updateOriginalProduct(productId, validatedData);

        if ('error' in result) {
            return { error: result.error };
        }

        revalidatePath('/admin/stores/[storeId]/products');
        revalidatePath(`/admin/products/${productId}`);
        return {
            success: `Product "${result.name}" updated successfully!`,
            data: result
        };
    } catch (error) {
        console.error("updateOriginalProduct action error: ", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Failed to update product" };
    }
}

export async function deleteOriginalProducts(productIds: string | string[]) {
    try {
        // Validate the input data
        const validatedData = DeleteProductSchema.parse({ productIds });

        const idsArray = Array.isArray(validatedData.productIds)
            ? validatedData.productIds
            : [validatedData.productIds];

        const result = await originalProductsModel.deleteOriginalProducts(idsArray);

        if (result.error) {
            return { error: result.error };
        }

        revalidatePath('/admin/stores/[storeId]/products');
        return { success: result.success };
    } catch (error) {
        console.error("deleteOriginalProducts action error: ", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Failed to delete product(s)" };
    }
}

export async function getOriginalProductById(productId: string) {
    try {
        const product = await originalProductsModel.findOriginalProductById(productId);

        if (!product) {
            return { error: "Product not found" };
        }

        return { data: product };
    } catch (error) {
        console.error("getOriginalProductById action error: ", error);
        return { error: "Failed to fetch product" };
    }
}

export async function getStoreOriginalProducts(storeId: string) {
    try {
        const result = await originalProductsModel.getStoreProducts(storeId);

        return {
            documents: result.documents,
            total: result.total,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("getStoreOriginalProducts action error: ", error);
        return {
            documents: [],
            total: 0,
            hasMore: false
        };
    }
}

export async function searchOriginalProducts(
    searchTerm: string,
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
        categoryId?: string;
        status?: "active" | "inactive" | "draft" | 'all' ;
        minPrice?: number;
        maxPrice?: number;
    } = {}
) {
    try {
        const { limit = 10, page = 1, ...filters } = options;
        const offset = (page - 1) * limit;

        let queryFilters: any[] = [];

        if (filters.storeId) {
            queryFilters.push({ field: "storeId", operator: "equal", value: filters.storeId });
        }

        if (filters.categoryId) {
            queryFilters.push({ field: "categoryId", operator: "equal", value: filters.categoryId });
        }

        if (filters.status) {
            queryFilters.push({ field: "status", operator: "equal", value: filters.status });
        }

        if (filters.minPrice !== undefined) {
            queryFilters.push({ field: "basePrice", operator: "greaterThanEqual", value: filters.minPrice });
        }

        if (filters.maxPrice !== undefined) {
            queryFilters.push({ field: "basePrice", operator: "lessThanEqual", value: filters.maxPrice });
        }

        const result = await originalProductsModel.searchProducts(searchTerm, {
            limit,
            offset,
            filters: queryFilters,
            orderBy: "$createdAt",
            orderType: "desc"
        });

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("searchOriginalProducts action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getNearbyStoresOriginalProducts(
    southWest: { lat: number, lng: number },
    northEast: { lat: number, lng: number }
) {
    try {
        const result = await originalProductsModel.getNearbyStoreProducts(southWest, northEast);

        return {
            documents: result.documents,
            total: result.total
        };
    } catch (error) {
        console.error("getNearbyStoresOriginalProducts action error: ", error);
        return {
            documents: [],
            total: 0
        };
    }
}

export async function getFeaturedOriginalProducts(options: {
    limit?: number;
    page?: number;
    storeId?: string;
} = {}) {
    try {
        const { limit = 10, page = 1, storeId } = options;
        const offset = (page - 1) * limit;

        let filters: any[] = [];
        if (storeId) {
            filters.push({ field: "storeId", operator: "equal", value: storeId });
        }

        const result = await originalProductsModel.getFeaturedProducts({
            limit,
            offset,
            filters
        });

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("getFeaturedOriginalProducts action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getOriginalProductsByCategory(
    categoryId: string,
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) {
    try {
        const { limit = 10, page = 1, storeId } = options;
        const offset = (page - 1) * limit;

        let filters: any[] = [];
        if (storeId) {
            filters.push({ field: "storeId", operator: "equal", value: storeId });
        }

        const result = await originalProductsModel.findByCategory(categoryId, {
            limit,
            offset,
            filters,
            orderBy: "$createdAt",
            orderType: "desc"
        });

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("getOriginalProductsByCategory action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getOriginalProductsByPriceRange(
    minPrice: number,
    maxPrice: number,
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) {
    try {
        const { limit = 10, page = 1, storeId } = options;
        const offset = (page - 1) * limit;

        let filters: any[] = [];
        if (storeId) {
            filters.push({ field: "storeId", operator: "equal", value: storeId });
        }

        const result = await originalProductsModel.findByPriceRange(minPrice, maxPrice, {
            limit,
            offset,
            filters,
            orderBy: "basePrice",
            orderType: "asc"
        });

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("getOriginalProductsByPriceRange action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getOriginalProductsByTag(
    tag: string,
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) {
    try {
        const { limit = 10, page = 1, storeId } = options;
        const offset = (page - 1) * limit;

        let filters: any[] = [];
        if (storeId) {
            filters.push({ field: "storeId", operator: "equal", value: storeId });
        }

        const result = await originalProductsModel.getProductsByTag(tag, {
            limit,
            offset,
            filters,
            orderBy: "$createdAt",
            orderType: "desc"
        });

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("getOriginalProductsByTag action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getOriginalProductsByOwner(
    ownerId: string,
    options: {
        limit?: number;
        page?: number;
        status?: "active" | "inactive" | "draft";
    } = {}
) {
    try {
        const { limit = 10, page = 1, status } = options;
        const offset = (page - 1) * limit;

        let filters: any[] = [];
        if (status) {
            filters.push({ field: "status", operator: "equal", value: status });
        }

        const result = await originalProductsModel.findByOwner(ownerId, {
            limit,
            offset,
            filters,
            orderBy: "$createdAt",
            orderType: "desc"
        });

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("getOriginalProductsByOwner action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getOriginalProductsByStatus(
    status: "active" | "inactive" | "draft",
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) {
    try {
        const { limit = 10, page = 1, storeId } = options;
        const offset = (page - 1) * limit;

        let filters: any[] = [];
        if (storeId) {
            filters.push({ field: "storeId", operator: "equal", value: storeId });
        }

        const result = await originalProductsModel.findByStatus(status, {
            limit,
            offset,
            filters,
            orderBy: "$createdAt",
            orderType: "desc"
        });

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("getOriginalProductsByStatus action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}