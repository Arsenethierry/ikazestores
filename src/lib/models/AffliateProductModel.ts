import { ID, Query } from "node-appwrite";
import { createDocumentPermissions, createSessionClient } from "../appwrite";
import { BaseModel, PaginationResult, QueryFilter, QueryOptions } from "../core/database";
import { AFFILIATE_COMBINATION_PRICING_COLLECTION_ID, AFFILIATE_PRODUCT_IMPORTS_COLLECTION_ID, DATABASE_ID, PRODUCTS_COLLECTION_ID, VARIANT_COMBINATIONS_COLLECTION_ID } from "../env-config";
import { AffiliateCombinationPricing, AffiliateProductImports, ProductCombinations, Products } from "../types/appwrite/appwrite";
import { CreateAffiliateImportSchema, UpdateAffiliateImportSchema } from "../schemas/products-schems";
import { getAuthState } from "../user-permission";

export interface VirtualStoreProduct extends Products {
    finalPrice: number;
    commission: number;
    affiliateImportId: string;
}

export interface VirtualStoreCombination extends ProductCombinations {
    finalPrice: number;
    commission: number;
}
export class AffiliateProductModel extends BaseModel<AffiliateProductImports> {
    constructor() {
        super(AFFILIATE_PRODUCT_IMPORTS_COLLECTION_ID)
    }

    async findByVirtualStore(
        virtualStoreId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<AffiliateProductImports>> {
        const filters: QueryFilter[] = [
            { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        })
    }

    async findByProductId(
        productId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<AffiliateProductImports>> {
        const filters: QueryFilter[] = [
            { field: "productId", operator: "equal", value: productId },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async findActiveImports(
        virtualStoreId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<AffiliateProductImports>> {
        const filters: QueryFilter[] = [
            { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
            { field: "isActive", operator: "equal", value: true },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async getVirtualStoreProducts(
        virtualStoreId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualStoreProduct>> {
        try {
            const { databases } = await createSessionClient();

            const imports = await this.findActiveImports(virtualStoreId, options);
            if (imports.documents.length === 0) {
                return {
                    documents: [],
                    total: 0,
                    limit: options.limit || 25,
                    offset: options.offset || 0,
                    hasMore: false
                };
            }

            const productIds = imports.documents.map(imp => imp.productId);
            const productFilters: string[] = [
                Query.equal('$id', productIds),
                Query.equal('status', 'active'),
                Query.equal('isDropshippingEnabled', true)
            ];

            if (options.filters) {
                for (const filter of options.filters) {
                    switch (filter.operator) {
                        case "equal":
                            productFilters.push(Query.equal(filter.field, filter.value));
                            break;
                        case "contains":
                            productFilters.push(Query.search(filter.field, filter.value));
                            break;
                        case "greaterThanEqual":
                            productFilters.push(Query.greaterThanEqual(filter.field, filter.value));
                            break;
                        case "lessThanEqual":
                            productFilters.push(Query.lessThanEqual(filter.field, filter.value));
                            break;
                    }
                }
            }

            if (options.limit) productFilters.push(Query.limit(options.limit));
            if (options.offset) productFilters.push(Query.offset(options.offset));
            if (options.orderBy) {
                const orderMethod = options.orderType === 'desc' ? Query.orderDesc : Query.orderAsc;
                productFilters.push(orderMethod(options.orderBy))
            }

            const productsResponse = await databases.listDocuments<Products>(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                productFilters
            );

            const virtualStoreProducts: VirtualStoreProduct[] = productsResponse.documents.map(product => {
                const import_ = imports.documents.find(imp => imp.productId === product.$id);
                const finalPrice = product.basePrice + (import_?.commission || 0);

                return {
                    ...product,
                    finalPrice,
                    commission: import_?.commission || 0,
                    affiliateImportId: import_?.$id || '',
                };
            });

            return {
                documents: virtualStoreProducts,
                total: productsResponse.total,
                limit: options.limit || 25,
                offset: options.offset || 0,
                hasMore: (options.offset || 0) + virtualStoreProducts.length < productsResponse.total
            };
        } catch (error) {
            console.error('getVirtualStoreProducts error:', error);
            return {
                documents: [],
                total: 0,
                limit: options.limit || 25,
                offset: options.offset || 0,
                hasMore: false,
            }
        }
    }

    async getProductCombinationsWithPricing(
        productId: string,
        virtualStoreId?: string
    ): Promise<VirtualStoreCombination[]> {
        try {
            const { databases } = await createSessionClient();

            const combinations = await databases.listDocuments<ProductCombinations>(
                DATABASE_ID,
                VARIANT_COMBINATIONS_COLLECTION_ID,
                [
                    Query.equal('productId', productId),
                    Query.equal('isActive', true)
                ]
            );

            if (!virtualStoreId) {
                return combinations.documents.map(combination => ({
                    ...combination,
                    finalPrice: combination.basePrice,
                    commission: 0
                }));
            }

            const affiliateImport = await this.findOne([
                { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
                { field: "productId", operator: "equal", value: productId }
            ]);

            if (!affiliateImport) {
                throw new Error('Product not imported by this virtual store');
            }

            const baseCommission = affiliateImport.commission;
            const customPricing = await databases.listDocuments<AffiliateCombinationPricing>(
                DATABASE_ID,
                AFFILIATE_COMBINATION_PRICING_COLLECTION_ID,
                [Query.equal('affiliateImportId', affiliateImport.$id)]
            );

            return combinations.documents.map(combination => {
                const customPrice = customPricing.documents.find(cp => cp.combinationId === combination.$id);
                const commission = customPrice?.customCommission || baseCommission;
                const finalPrice = combination.basePrice + commission;

                return {
                    ...combination,
                    finalPrice,
                    commission
                };
            });

        } catch (error) {
            console.error('getProductCombinationsWithPricing error:', error);
            return [];
        }
    }

    async importProduct(data: CreateAffiliateImportSchema): Promise<AffiliateProductImports | { error: string }> {
        try {
            const { user } = await getAuthState();
            if (!user) {
                return { error: "Authentication required" };
            }

            const { databases } = await createSessionClient();

            const product = await databases.getDocument<Products>(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                data.productId
            );

            if (!product.isDropshippingEnabled) {
                return { error: "This product is not available for dropshipping" };
            }

            const existingImport = await this.findOne([
                { field: "virtualStoreId", operator: "equal", value: data.virtualStoreId },
                { field: "productId", operator: "equal", value: data.productId }
            ]);

            if (existingImport) {
                return { error: "Product already imported to this virtual store" };
            }

            const documentPermissions = createDocumentPermissions({ userId: user.$id });
            const importId = ID.unique();

            const importData = {
                virtualStoreId: data.virtualStoreId,
                productId: data.productId,
                commission: data.commission,
                isActive: true,
                importedAt: new Date().toISOString(),
                lastSyncedAt: new Date().toISOString()
            };

            const newImport = await databases.createDocument(
                DATABASE_ID,
                AFFILIATE_PRODUCT_IMPORTS_COLLECTION_ID,
                importId,
                importData,
                documentPermissions
            );

            if (data.customCombinationPricing?.length) {
                const pricingPromises = data.customCombinationPricing.map(async (pricing) => {
                    const pricingId = ID.unique();
                    await databases.createDocument(
                        DATABASE_ID,
                        AFFILIATE_COMBINATION_PRICING_COLLECTION_ID,
                        pricingId,
                        {
                            affiliateImportId: importId,
                            combinationId: pricing.combinationId,
                            customCommission: pricing.customCommission,
                            isActive: true
                        },
                        documentPermissions
                    );
                });

                await Promise.all(pricingPromises);
            }

            return newImport as AffiliateProductImports
        } catch (error) {
            console.error("importProduct error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to import product" };
        }
    }

    async updateImport(
        importId: string,
        data: UpdateAffiliateImportSchema
    ): Promise<AffiliateProductImports | { error: string }> {
        try {
            const { user } = await getAuthState();
            if (!user) {
                return { error: "Authentication required" };
            }

            const existingImport = await this.findById(importId, {});
            if (!existingImport) {
                return { error: "Import not found" };
            }

            if (data.commission !== undefined) {
                const { databases } = await createSessionClient();
                const product = await databases.getDocument<Products>(
                    DATABASE_ID,
                    PRODUCTS_COLLECTION_ID,
                    existingImport.productId
                );

                if (data.commission < product.basePrice) {
                    return { error: `Commission must be greater than ${product.basePrice}` };
                }
            }

            const updatedImport = await this.update(importId, {
                ...data,
                lastSyncedAt: new Date().toISOString()
            });

            return updatedImport;
        } catch (error) {
            console.error("updateImport error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to update import" };
        }
    }

    async removeImport(importId: string): Promise<{ success?: string; error?: string }> {
        try {
            const { user } = await getAuthState();
            if (!user) {
                return { error: "Authentication required" };
            }

            const { databases } = await createSessionClient();

            const customPricing = await databases.listDocuments(
                DATABASE_ID,
                AFFILIATE_COMBINATION_PRICING_COLLECTION_ID,
                [Query.equal('affiliateImportId', importId)]
            );

            await Promise.all(
                customPricing.documents.map(pricing =>
                    databases.deleteDocument(
                        DATABASE_ID,
                        AFFILIATE_COMBINATION_PRICING_COLLECTION_ID,
                        pricing.$id
                    )
                )
            );

            await this.delete(importId);

            return { success: "Product removed from virtual store successfully" };
        } catch (error) {
            console.error("removeImport error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to remove import" };
        }
    }

    async bulkUpdateCommissions(
        virtualStoreId: string,
        newCommission: number
    ): Promise<{ success?: string; error?: string }> {
        try {
            const { user } = await getAuthState();
            if (!user) {
                return { error: "Authentication required" };
            }

            const imports = await this.findActiveImports(virtualStoreId);

            const updatePromises = imports.documents.map(import_ =>
                this.update(import_.$id, {
                    commission: newCommission,
                    lastSyncedAt: new Date().toISOString()
                })
            );

            await Promise.all(updatePromises);

            return { success: `Updated commission rates for ${imports.documents.length} products` };
        } catch (error) {
            console.error("bulkUpdateCommissionRates error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to update commission rates" };
        }
    }

    async checkSyncStatus(virtualStoreId: string): Promise<AffiliateProductImports[]> {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const outdatedImports = await this.findMany({
                filters: [
                    { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
                    { field: "lastSyncedAt", operator: "lessThan", value: oneDayAgo }
                ]
            });

            return outdatedImports.documents;
        } catch (error) {
            console.error("checkSyncStatus error: ", error);
            return [];
        }
    }

    async searchVirtualStoreProducts(
        virtualStoreId: string,
        searchTerm: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualStoreProduct>> {
        const searchFilters: QueryFilter[] = [
            { field: "name", operator: "contains", value: searchTerm },
            ...(options.filters || [])
        ];

        return this.getVirtualStoreProducts(virtualStoreId, {
            ...options,
            filters: searchFilters
        });
    }

    async getVirtualStoreProductsByCategory(
        virtualStoreId: string,
        categoryId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualStoreProduct>> {
        const categoryFilters: QueryFilter[] = [
            { field: "categoryId", operator: "equal", value: categoryId },
            ...(options.filters || [])
        ];

        return this.getVirtualStoreProducts(virtualStoreId, {
            ...options,
            filters: categoryFilters
        });
    }

    async getVirtualStoreProductsByPriceRange(
        virtualStoreId: string,
        minPrice: number,
        maxPrice: number,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualStoreProduct>> {
        // Note: Price filtering for virtual stores needs to be done after calculating final prices
        // This is a simplified version - for better performance, consider implementing server-side calculation

        const products = await this.getVirtualStoreProducts(virtualStoreId, options);

        const filteredProducts = products.documents.filter(product =>
            product.finalPrice >= minPrice && product.finalPrice <= maxPrice
        );

        return {
            documents: filteredProducts,
            total: filteredProducts.length,
            limit: options.limit || 25,
            offset: options.offset || 0,
            hasMore: false // Simplified for this implementation
        };
    }

    async getFeaturedVirtualStoreProducts(
        virtualStoreId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualStoreProduct>> {
        const featuredFilters: QueryFilter[] = [
            { field: "featured", operator: "equal", value: true },
            ...(options.filters || [])
        ];

        return this.getVirtualStoreProducts(virtualStoreId, {
            ...options,
            filters: featuredFilters,
            orderBy: "$createdAt",
            orderType: "desc"
        });
    }

    async getImportAnalytics(virtualStoreId: string): Promise<{
        totalImports: number;
        activeImports: number;
        totalRevenuePotential: number;
        avgCommission: number;
        topCategories: { categoryId: string; count: number }[];
    }> {
        try {
            const allImports = await this.findByVirtualStore(virtualStoreId);
            const activeImports = allImports.documents.filter(imp => imp.isActive);

            const totalImports = allImports.total;
            const activeCount = activeImports.length;

            const avgCommission = activeImports.length > 0
                ? activeImports.reduce((sum, imp) => sum + imp.commission, 0) / activeImports.length
                : 0;

            const { databases } = await createSessionClient();
            const productIds = activeImports.map(imp => imp.productId);

            let totalRevenuePotential = 0;
            const categoryCount: { [key: string]: number } = {};

            if (productIds.length > 0) {
                const products = await databases.listDocuments<Products>(
                    DATABASE_ID,
                    PRODUCTS_COLLECTION_ID,
                    [Query.equal('$id', productIds)]
                );

                products.documents.forEach(product => {
                    const import_ = activeImports.find(imp => imp.productId === product.$id);
                    if (import_) {
                        const commission = product.basePrice + import_.commission;
                        totalRevenuePotential += commission;

                        categoryCount[product.categoryId] = (categoryCount[product.categoryId] || 0) + 1;
                    }
                });
            }

            const topCategories = Object.entries(categoryCount)
                .map(([categoryId, count]) => ({ categoryId, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            return {
                totalImports,
                activeImports: activeCount,
                totalRevenuePotential,
                avgCommission,
                topCategories
            };
        } catch (error) {
            console.error("getImportAnalytics error: ", error);
            return {
                totalImports: 0,
                activeImports: 0,
                totalRevenuePotential: 0,
                avgCommission: 0,
                topCategories: []
            };
        }
    }
}