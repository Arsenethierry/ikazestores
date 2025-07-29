"use server";

import { AffiliateProductModel } from "../models/AffliateProductModel";
import { CreateAffiliateImportSchema, UpdateAffiliateImportSchema } from "../schemas/products-schems";

const affiliateProductModel = new AffiliateProductModel();

export async function importProductToVirtualStore(data: CreateAffiliateImportSchema) {
    try {
        const result = await affiliateProductModel.importProduct(data);
        if ('error' in result) {
            return { error: result.error };
        }

        return {
            success: "Product imported successfully!",
            data: result
        };
    } catch (error) {
        console.error("importProductToVirtualStore action error: ", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Failed to import product" };
    }
}

export async function updateAffiliateImport(
    importId: string,
    data: UpdateAffiliateImportSchema
) {
    try {
        const result = await affiliateProductModel.updateImport(importId, data);

        if ('error' in result) {
            return { error: result.error };
        }

        return {
            success: "Import updated successfully!",
            data: result
        };
    } catch (error) {
        console.error("updateAffiliateImport action error: ", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Failed to update import" };
    }
}

export async function removeProductFromVirtualStore(importId: string) {
    try {
        const result = await affiliateProductModel.removeImport(importId);
        if (result.error) {
            return { error: result.error };
        }
    } catch (error) {
        console.error("bulkUpdateCommissionRates action error: ", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Failed to update commission rates" };
    }
}

export async function checkProductSyncStatus(virtualStoreId: string) {
    try {
        const outdatedImports = await affiliateProductModel.checkSyncStatus(virtualStoreId);

        return {
            data: outdatedImports,
            needsSync: outdatedImports.length > 0
        };
    } catch (error) {
        console.error("checkProductSyncStatus action error: ", error);
        return {
            data: [],
            needsSync: false,
            error: "Failed to check sync status"
        };
    }
}

export async function getAffiliateImportAnalytics(virtualStoreId: string) {
    try {
        const analytics = await affiliateProductModel.getImportAnalytics(virtualStoreId);

        return {
            data: analytics
        };
    } catch (error) {
        console.error("getAffiliateImportAnalytics action error: ", error);
        return {
            data: {
                totalImports: 0,
                activeImports: 0,
                totalRevenuePotential: 0,
                avgCommissionRate: 0,
                topCategories: []
            },
            error: "Failed to fetch analytics"
        };
    }
}


export async function getVirtualStoreProductsByPriceRange(
    virtualStoreId: string,
    minPrice: number,
    maxPrice: number,
    options: {
        limit?: number;
        page?: number;
    } = {}
) {
    try {
        const { limit = 10, page = 1 } = options;
        const offset = (page - 1) * limit;

        const result = await affiliateProductModel.getVirtualStoreProductsByPriceRange(
            virtualStoreId,
            minPrice,
            maxPrice,
            {
                limit,
                offset
            }
        );

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        }
    } catch (error) {
        console.error("getVirtualStoreProductsByPriceRange action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getVirtualStoreProducts(
    virtualStoreId: string,
    options: {
        limit?: number;
        page?: number;
        search?: string;
        categoryId?: string;
        minPrice?: number;
        maxPrice?: number;
    } = {}
) {
    try {
        const { limit = 10, page = 1, search, ...filters } = options;
        const offset = (page - 1) * limit;

        const queryFilters: any[] = [];

        if (filters.categoryId) {
            queryFilters.push({ field: "categoryId", operator: "equal", value: filters.categoryId });
        }

        if (filters.minPrice !== undefined) {
            queryFilters.push({ field: "basePrice", operator: "greaterThanEqual", value: filters.minPrice });
        }

        if (filters.maxPrice !== undefined) {
            queryFilters.push({ field: "basePrice", operator: "lessThanEqual", value: filters.maxPrice });
        }

        let result;
        if (search) {
            result = await affiliateProductModel.searchVirtualStoreProducts(virtualStoreId, search, {
                limit,
                offset,
                filters: queryFilters,
                orderBy: "$createdAt",
                orderType: "desc"
            });
        } else {
            result = await affiliateProductModel.getVirtualStoreProducts(virtualStoreId, {
                limit,
                offset,
                filters: queryFilters,
                orderBy: "$createdAt",
                orderType: "desc"
            });
        }

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("getVirtualStoreProducts action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getVirtualStoreProductsByCategory(
    virtualStoreId: string,
    categoryId: string,
    options: {
        limit?: number;
        page?: number;
    } = {}
) {
    try {
        const { limit = 10, page = 1 } = options;
        const offset = (page - 1) * limit;

        const result = await affiliateProductModel.getVirtualStoreProductsByCategory(
            virtualStoreId,
            categoryId,
            {
                limit,
                offset,
                orderBy: "$createdAt",
                orderType: "desc"
            }
        );

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        };
    } catch (error) {
        console.error("getVirtualStoreProductsByCategory action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getFeaturedVirtualStoreProducts(
    virtualStoreId: string,
    options: {
        limit?: number;
        page?: number;
    } = {}
) {
    try {
        const { limit = 10, page = 1 } = options;
        const offset = (page - 1) * limit;

        const result = await affiliateProductModel.getFeaturedVirtualStoreProducts(
            virtualStoreId,
            {
                limit,
                offset
            }
        );

        return {
            documents: result.documents,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            currentPage: page,
            hasMore: result.hasMore
        }
    } catch (error) {
        console.error("getFeaturedVirtualStoreProducts action error: ", error);
        return {
            documents: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            hasMore: false
        };
    }
}

export async function getProductCombinationsWithPricing(
    productId: string,
    virtualStoreId?: string
) {
    try {
        const combinations = await affiliateProductModel.getProductCombinationsWithPricing(
            productId,
            virtualStoreId
        );

        return {
            data: combinations
        };
    } catch (error) {
        console.error("getProductCombinationsWithPricing action error: ", error);
        return {
            data: [],
            error: "Failed to fetch product combinations"
        };
    }
}

export async function bulkUpdateCommission(
    virtualStoreId: string,
    newRate: number
) {
    try {
        if (newRate < 0 || newRate > 100) {
            return { error: "Commission rate must be between 0 and 100%" };
        }

        const result = await affiliateProductModel.bulkUpdateCommissions(virtualStoreId, newRate);

        if (result.error) {
            return { error: result.error };
        }

        return { success: result.success }
    } catch (error) {
        return { error: `bulkUpdateCommission failed`}
    }
}