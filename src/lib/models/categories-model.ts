import { getCategoryById } from "@/features/variants management/ecommerce-catalog";
import { BaseModel, CacheOptions, PaginationResult, QueryFilter, QueryOptions } from "../core/database";
import { CATEGORIES_COLLECTION_ID } from "../env-config";
import { Query } from "node-appwrite";
import { ProductsCategories } from "../types/appwrite/appwrite";

export interface CategoryFilters {
    storeId?: string;
    isActive?: boolean;
    categoryName?: string;
    slug?: string;
    createdBy?: string;
}

export interface CategoryCreateData {
    categoryName: string;
    slug: string;
    storeId?: string;
    iconUrl?: string;
    iconFileId?: string;
    isActive?: boolean;
    sortOrder?: number;
}

export interface CategoryUpdateData {
    categoryName?: string;
    slug?: string;
    iconUrl?: string;
    iconFileId?: string;
    isActive?: boolean;
    sortOrder?: number;
}

export interface CategoryQueryOptions extends QueryOptions {
    includeInactive?: boolean;
    cache?: CacheOptions;
}

export class CategoryModel extends BaseModel<ProductsCategories> {
    constructor() {
        super(CATEGORIES_COLLECTION_ID)
    }

    async findById(categoryId: string, options: { cache?: CacheOptions } = {}): Promise<ProductsCategories | null> {
        return super.findById(categoryId, options);
    }

    async createCategory(data: CategoryCreateData, userId: string): Promise<ProductsCategories> {
        const categoriesData = {
            ...data,
            createdBy: userId,
            isActive: data.isActive ?? true,
            sortOrder: data.sortOrder ?? 0
        };

        return this.create(categoriesData, userId);
    }


    async updateCategory(id: string, data: CategoryUpdateData): Promise<ProductsCategories> {
        return this.update(id, data)
    }

    async deleteCategory(id: string): Promise<void> {
        return this.delete(id);
    }

    async findCategories(filters: CategoryFilters = {}, options: CategoryQueryOptions = {}): Promise<PaginationResult<ProductsCategories>> {
        const queryFilters: QueryFilter[] = [];

        if (filters.storeId) {
            queryFilters.push({ field: 'storeId', operator: 'equal', value: filters.storeId });
        }

        if (filters.isActive !== undefined && !options.includeInactive) {
            queryFilters.push({ field: "isActive", operator: "equal", value: filters.isActive });
        } else if (!options.includeInactive) {
            queryFilters.push({ field: "isActive", operator: "equal", value: true });
        }

        if (filters.categoryName) {
            queryFilters.push({ field: "categoryName", operator: "contains", value: filters.categoryName });
        }

        if (filters.slug) {
            queryFilters.push({ field: "slug", operator: "equal", value: filters.slug });
        }

        if (filters.createdBy) {
            queryFilters.push({ field: "createdBy", operator: "equal", value: filters.createdBy });
        }

        const queryOptions: QueryOptions = {
            ...options,
            filters: queryFilters,
            orderBy: options.orderBy,
            orderType: options.orderType || 'asc'
        };

        return this.findMany(queryOptions);
    }

    async getStoreCategories(storeId: string, options: CategoryQueryOptions = {}): Promise<PaginationResult<ProductsCategories>> {
        const result = await this.findCategories(
            { storeId },
            {
                ...options,
                limit: options.limit || 1000,
            }
        );

        return result
    }

    async getActiveCategories(storeId?: string, options: CategoryQueryOptions = {}): Promise<ProductsCategories[]> {
        const filters: CategoryFilters = { isActive: true };
        if (storeId) filters.storeId = storeId;

        const result = await this.findCategories(filters, options);
        return result.documents
    }

    async getCategoryBySlug(slug: string): Promise<ProductsCategories | null> {
        return this.findOne([
            { field: "slug", operator: "equal", value: slug },
        ]);
    }

    async searchCategories(searchTerm: string, storeId?: string, options: CategoryQueryOptions = {}): Promise<PaginationResult<ProductsCategories>> {
        const filters: CategoryFilters = { categoryName: searchTerm };
        if (storeId) filters.storeId = storeId;

        return this.findCategories(filters, options);
    }

    async validateUniqueSlug(slug: string, storeId?: string, excludeId?: string): Promise<boolean> {
        const existing = await this.getCategoryBySlug(slug);

        if (!existing) return true;
        if (excludeId && existing.$id === excludeId) return true;

        return false;
    }
}