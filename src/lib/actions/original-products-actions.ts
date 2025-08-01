"use server";

import { revalidatePath } from "next/cache";
import { OriginalProductsModel } from "@/lib/models/original-products-model";
import { ColorVariantUpdateSchema, CreateColorVariantData, CreateProductSchema, DeleteProductSchema, UpdateColorVariantData, UpdateProductSchema } from "../schemas/products-schems";
import { ProductModel } from "../models/ProductModel";
import { getAuthState } from "../user-permission";
import { OriginalProductTypes } from "../types";
import { ColorVariantsModel } from "../models/ColorVariantsModel";

const originalProductsModel = new ProductModel();
const colorVariantsModel = new ColorVariantsModel();

export async function createOriginalProduct(data: CreateProductSchema) {
    try {
        const validatedData = CreateProductSchema.parse(data);

        const result = await originalProductsModel.createProduct(validatedData);

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
    data: UpdateProductSchema
) {
    try {
        const validatedData = UpdateProductSchema.parse(data);

        const result = await originalProductsModel.updateProduct(productId, validatedData);

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

export async function bulkUpdateProductStatus(
    productIds: string[],
    status: "active" | "draft" | "archived"
) {
    try {
        const { isPhysicalStoreOwner, user, isSystemAdmin } = await getAuthState();

        if (!isPhysicalStoreOwner || !user) {
            return { error: "Access denied: Only store owners & admins can update product status" };
        }

        const products = await Promise.all(
            productIds.map(id => originalProductsModel.findProductById(id))
        );

        const updatePromises = productIds.map(id =>
            originalProductsModel.updateProduct(id, { status })
        );

        const results = await Promise.all(updatePromises);
        const failures = results.filter(result => 'error' in result);

        if (failures.length > 0) {
            return { error: `Failed to update ${failures.length} product(s)` };
        }

        if (failures.length > 0) {
            return { error: `Failed to update ${failures.length} product(s)` };
        }

        const storeIds = [...new Set(products.map(p => p?.physicalStoreId).filter(Boolean))];
        storeIds.forEach(storeId => {
            revalidatePath(`/admin/stores/${storeId}/products`);
            revalidatePath(`/admin/stores/${storeId}`);
        });

        return { success: `Successfully updated ${productIds.length} product(s) to ${status}` };
    } catch (error) {
        console.error("bulkUpdateProductStatus error:", error);
        return { error: "Failed to bulk update product status" };
    }
}

export async function updateColorVariant(
    colorVariantId: string,
    data: UpdateColorVariantData
) {
    try {
        const validatedData = ColorVariantUpdateSchema.parse(data);
        const result = await colorVariantsModel.updateColorVariant(colorVariantId, validatedData);

        if ('error' in result) {
            return { error: result.error };
        }

        revalidatePath('/admin/stores/[storeId]/products');
        revalidatePath(`/admin/stores/[storeId]/products/${result.productId}`);

        return {
            success: `Color variant "${result.colorName}" updated successfully!`,
            data: result
        };
    } catch (error) {
        console.error("updateColorVariant action error: ", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Failed to update color variant" };
    }
}

export async function deleteColorVariant(colorVariantId: string) {
    try {
        const result = await colorVariantsModel.deleteColorVariant(colorVariantId);

        if ('error' in result) {
            return { error: result.error };
        }

        revalidatePath('/admin/stores/[storeId]/products');

        return {
            success: result.success || "Color variant deleted successfully!"
        };
    } catch (error) {
        console.error("deleteColorVariant action error: ", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Failed to delete color variant" };
    }
}

export async function toggleProductFeatured(productId: string) {
    try {
        const { isPhysicalStoreOwner, user, isSystemAdmin, isSystemAgent } = await getAuthState();
        if (!isPhysicalStoreOwner || !user) {
            return { error: "Access denied: Only store owners can feature products" };
        }

        const existingProduct = await originalProductsModel.findProductById(productId);
        if (!existingProduct) {
            return { error: "Access denied" };
        }

        const result = await originalProductsModel.updateProduct(productId, {
            featured: !existingProduct.featured
        });

        if ('error' in result) {
            return { error: result.error };
        }

        revalidatePath(`/admin/stores/${existingProduct.physicalStoreId}/products`);
        revalidatePath(`/admin/stores/${existingProduct.physicalStoreId}`);
        revalidatePath('/marketplace');

        return {
            success: `Product ${existingProduct.featured ? 'unfeatured' : 'featured'} successfully`,
            data: result as OriginalProductTypes
        };
    } catch (error) {
        console.error("toggleProductFeatured error:", error);
        return { error: "Failed to toggle product featured status" };
    }
}

export async function getProductAnalytics(
    storeId: string,
    options: {
        dateRange?: { from: Date; to: Date };
        includeVariants?: boolean;
    } = {}
) {
    try {
        const { isPhysicalStoreOwner } = await getAuthState();
        if (!isPhysicalStoreOwner) {
            return { error: "Access denied: Cannot access this store's analytics" };
        }

        const allProducts = await originalProductsModel.findByPhysicalStore(storeId, {
            limit: 1000
        });

        const products = allProducts.documents;
        const activeProducts = products.filter(p => p.status === 'active').length;
        const draftProducts = products.filter(p => p.status === 'draft').length;
        const featuredProducts = products.filter(p => p.featured).length;
        const dropshippingEnabled = products.filter(p => p.isDropshippingEnabled).length;

        const totalValue = products.reduce((sum, product) => sum + product.basePrice, 0);
        const averagePrice = products.length > 0 ? totalValue / products.length : 0;

        const categoryCount: { [key: string]: number } = {};
        products.forEach(product => {
            categoryCount[product.categoryId] = (categoryCount[product.categoryId] || 0) + 1;
        });

        const topCategories = Object.entries(categoryCount)
            .map(([categoryId, count]) => ({ categoryId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const recentProducts = products
            .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
            .slice(0, 10);

        return {
            success: "Analytics retrieved successfully",
            data: {
                totalProducts: products.length,
                activeProducts,
                draftProducts,
                featuredProducts,
                dropshippingEnabled,
                totalValue,
                averagePrice,
                topCategories,
                recentProducts
            }
        };
    } catch (error) {
        console.error("getProductAnalytics error:", error);
        return { error: "Failed to retrieve product analytics" };
    }
}

export async function deleteOriginalProducts(productIds: string | string[]) {
    try {

        const validatedData = DeleteProductSchema.parse({ productIds });

        const idsArray = Array.isArray(validatedData.productIds)
            ? validatedData.productIds
            : [validatedData.productIds];

        const result = await originalProductsModel.deleteProducts(idsArray);

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
        const product = await originalProductsModel.findProductById(productId);

        if (!product) {
            return { error: "Product not found" };
        }

        return { data: product };
    } catch (error) {
        console.error("getOriginalProductById action error: ", error);
        return { error: "Failed to fetch product" };
    }
}

export async function getProductWithColors(productId: string) {
    try {
        const result = await originalProductsModel.findProductWithColors(productId);

        return {
            success: "Product data retrieved successfully",
            data: result
        };
    } catch (error) {
        console.error("getProductWithColors action error: ", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "Failed to retrieve product data" };
    }
}

export async function getStoreOriginalProducts(storeId: string) {
    try {
        const result = await originalProductsModel.findByPhysicalStore(storeId);

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
        status?: "active" | "inactive" | "draft" | 'all';
        minPrice?: number;
        maxPrice?: number;
    } = {}
) {
    try {
        const { limit = 10, page = 1, ...filters } = options;
        const offset = (page - 1) * limit;

        const queryFilters: any[] = [];

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
        const result = await originalProductsModel.findNearbyProducts(southWest, northEast);

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

        const filters: any[] = [];
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

        const filters: any[] = [];
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

        const filters: any[] = [];
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

        const filters: any[] = [];
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

export async function getOriginalProductsByStatus(
    status: "active" | "draft" | "archived",
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) {
    try {
        const { limit = 10, page = 1, storeId } = options;
        const offset = (page - 1) * limit;

        const filters: any[] = [];
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