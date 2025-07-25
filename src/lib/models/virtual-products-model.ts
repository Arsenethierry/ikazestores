import { ID, Query } from "node-appwrite";
import { AppwriteRollback } from "../actions/rollback";
import { createAdminClient, createSessionClient } from "../appwrite";
import { BaseModel, PaginationResult, QueryFilter, QueryOptions } from "../core/database";
import { DATABASE_ID, VIRTUAL_COMBINATION_PRICES_COLLECTION_ID, VIRTUAL_PRODUCT_ID } from "../env-config";
import { CreateVirtualProductTypes, SortBy, VirtualProductsSearchParams, VirtualProductTypes } from "../types";
import { getAuthState } from "../user-permission";
import { OriginalProductsModel } from "./original-products-model";
import { ProductsStorageService } from "./storage-models";
import { VirtualStore } from "./virtual-store";

export class VirtualProductsModel extends BaseModel<VirtualProductTypes> {
    private storageService: ProductsStorageService;
    private originalProduct: OriginalProductsModel;
    private virtualStore: VirtualStore;

    constructor() {
        super(VIRTUAL_PRODUCT_ID);
        this.storageService = new ProductsStorageService();
        this.originalProduct = new OriginalProductsModel();
        this.virtualStore = new VirtualStore();
    }

    async findByStoreId(
        storeId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualProductTypes>> {
        const filters: QueryFilter[] = [
            { field: "storeId", operator: "equal", value: storeId },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        })
    }

    async findByCategory(
        category: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualProductTypes>> {
        const filters: QueryFilter[] = [
            { field: "category", operator: "equal", value: category },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async findByPriceRange(
        minPrice: number,
        maxPrice: number,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualProductTypes>> {
        const filters: QueryFilter[] = [
            { field: "price", operator: "greaterThanEqual", value: minPrice },
            { field: "price", operator: "lessThanEqual", value: maxPrice },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async searchProducts(
        searchTerm: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualProductTypes>> {
        const filters: QueryFilter[] = [
            { field: "name", operator: "contains", value: searchTerm },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async findByStatus(
        status: "active" | "inactive" | "draft",
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualProductTypes>> {
        const filters: QueryFilter[] = [
            { field: "status", operator: "equal", value: status },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async findByOwner(
        ownerId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<VirtualProductTypes>> {
        const filters: QueryFilter[] = [
            { field: "createdBy", operator: "equal", value: ownerId },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async checkProductCloneStatus(originalProductId: string, virtualStoreId: string) {
        const filters: QueryFilter[] = [
            { field: 'originalProductId', operator: 'equal', value: originalProductId },
            { field: 'virtualStoreId', operator: 'equal', value: virtualStoreId }
        ];

        const existingClone = await this.findOne(filters);

        return {
            isCloned: existingClone !== null,
            cloneDetails: existingClone || null
        };
    }

    async getVirtualStoreProducts({
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
            const filters: QueryFilter[] = [
                { field: "virtualStoreId", operator: "equal", value: virtualStoreId }
            ];

            if (search) {
                filters.push({ field: "title", operator: "contains", value: search });
            }

            const options: QueryOptions = {
                filters,
                limit,
                offset: (page - 1) * limit,
                orderBy: '$createdAt',
                orderType: 'desc'
            };

            const result = await this.findMany(options);
            let documentsWithStoreData = result.documents;
            if (withStoreData) {
                const virtualStore = await this.virtualStore.findById(virtualStoreId, {});
                documentsWithStoreData = result.documents.map(product => ({
                    ...product,
                    virtualStore
                }))
            }

            return {
                documents: documentsWithStoreData,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            };
        } catch (error) {
            console.log("getVirtualStoreProducts: ", error);
            return null;
        }
    }

    async getAllVirtualProducts({
        limit = 10,
        page = 1,
        search
    }: {
        search?: string;
        page?: number;
        limit?: number
    }) {
        try {
            const filters: QueryFilter[] = [];
            if (search) {
                filters.push({ field: "title", operator: "contains", value: search });
            }

            const options: QueryOptions = {
                filters,
                limit,
                offset: (page - 1) * limit,
                orderBy: '$createdAt',
                orderType: 'desc'
            };

            const result = await this.findMany(options);

            return {
                documents: result.documents,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            };
        } catch (error) {
            console.log("getAllVirtualProducts: ", error);
            return {
                documents: [],
                total: 0,
                totalPages: 0
            };
        }
    }

    async getAllVirtualPropByOriginalProduct(originalProductId: string) {
        try {
            const filters: QueryFilter[] = [
                { field: "originalProductId", operator: "equal", value: originalProductId }
            ];

            const result = await this.findMany({ filters });

            return {
                documents: result.documents,
                total: result.total
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to fetch products",
                total: 0,
                documents: []
            };
        }
    }

    async searchVirtualProducts({ query, limit = 10, currentStoreId }: { query: string, limit: number, currentStoreId?: string }) {
        try {
            const filters: QueryFilter[] = [
                { field: "title", operator: "contains", value: query }
            ];

            if (currentStoreId) {
                filters.push({ field: "virtualStoreId", operator: "equal", value: currentStoreId });
            }

            const result = await this.findMany({
                filters,
                limit
            });

            return {
                documents: result.documents,
                total: result.total
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to search products",
                total: 0,
                documents: []
            };
        }
    }

    async getPaginatedVirtualProducts({ searchParams, storeId }: { searchParams: VirtualProductsSearchParams, storeId?: string }) {
        try {
            const { databases } = await createSessionClient();
            const queries = [Query.limit(5)];

            if (storeId) {
                queries.push(Query.equal("virtualStoreId", storeId));
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
            console.log("getPaginatedVirtualProducts: ", error);
            return {
                total: 0,
                documents: []
            };
        }
    }

    async createVirtualProduct(data: CreateVirtualProductTypes): Promise<VirtualProductTypes | { error: string }> {
        const { storage, teams } = await createSessionClient();
        const { databases } = await createAdminClient();
        const rollback = new AppwriteRollback(storage, databases, teams);

        try {
            const { user } = await getAuthState();

            if (!user) {
                return { error: "You must login first" };
            }

            const isValidPrice = data.sellingPrice > data.purchasePrice;
            if (!isValidPrice) {
                return { error: "Selling price must be greater than purchase price" };
            }

            if (data.combinationPrices && data.combinationPrices.length > 0) {
                const invalidCombinations = data.combinationPrices.filter(
                    combo => combo.finalPrice <= combo.basePrice
                );
                if (invalidCombinations.length > 0) {
                    return { error: "All combination final prices must be greater than base prices" };
                }
            }

            const existingClonedProduct = await this.exists([
                { field: "virtualStoreId", operator: "equal", value: data.storeId },
                { field: "originalProductId", operator: "equal", value: data.originalProductId }
            ]);

            if (existingClonedProduct) {
                return { error: "Product already cloned to this store" };
            }

            const originalProduct = await this.originalProduct.findOriginalProductById(data.originalProductId);
            if (!originalProduct) {
                return { error: "Original product not found" };
            }

            const virtualProduct = await this.create(data, user.$id);
            await rollback.trackDocument(VIRTUAL_PRODUCT_ID, virtualProduct.$id);

            const combinationPriceIds: string[] = [];

            if (data.combinationPrices && data.combinationPrices.length > 0) {
                const combinationPromises = data.combinationPrices.map(async (combo) => {
                    const combinationPrice = await databases.createDocument(
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

                await this.update(
                    virtualProduct.$id,
                    {
                        combinationPricesIds: combinationPriceIds
                    } as Partial<VirtualProductTypes>
                );
            }

            return virtualProduct
        } catch (error) {
            console.error("addNewVirtualProduct error: ", error);
            await rollback.rollback();
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to add product to store" };
        }
    }
}