import { ID, Query } from "node-appwrite";
import { AppwriteRollback } from "../actions/rollback";
import { createAdminClient, createDocumentPermissions, createSessionClient } from "../appwrite";
import { BaseModel, PaginationResult, QueryFilter, QueryOptions } from "../core/database";
import { DATABASE_ID, PRODUCT_VARIANT_OPTIONS_COLLECTION_ID, PRODUCT_VARIANTS_COLLECTION_ID, PRODUCTS_BUCKET_ID, PRODUCTS_COLLECTION_ID, VARIANT_COMBINATION_VALUES_COLLECTION_ID, VARIANT_COMBINATIONS_COLLECTION_ID } from "../env-config";
import { CreateProductSchema, ProductCombinationSchema, UpdateProductSchema } from "../schemas/products-schems";
import { Products } from "../types/appwrite/appwrite";
import { getAuthState } from "../user-permission";
import { ProductsStorageService } from "./storage-models";
import { extractFileIdFromUrl } from "../utils";

export class ProductModel extends BaseModel<Products> {
    private storageService: ProductsStorageService;

    constructor() {
        super(PRODUCTS_COLLECTION_ID);
        this.storageService = new ProductsStorageService();
    }

    async findProductById(productId: string): Promise<Products | null> {
        return await this.findById(productId, {});
    }

    async findByPhysicalStore(
        physicalStoreId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<Products>> {
        const filters: QueryFilter[] = [
            { field: "physicalStoreId", operator: "equal", value: physicalStoreId },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async findDropshippingEnabledProducts(
        options: QueryOptions = {}
    ): Promise<PaginationResult<Products>> {
        const filters: QueryFilter[] = [
            { field: "isDropshippingEnabled", operator: "equal", value: true },
            { field: "status", operator: "equal", value: "active" },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async findByCategory(
        categoryId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<Products>> {
        const filters: QueryFilter[] = [
            { field: "categoryId", operator: "equal", value: categoryId },
            { field: "status", operator: "equal", value: "active" },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async findByStatus(
        status: "active" | "draft" | "archived",
        options: QueryOptions = {}
    ): Promise<PaginationResult<Products>> {
        const filters: QueryFilter[] = [
            { field: "status", operator: "equal", value: status },
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
    ): Promise<PaginationResult<Products>> {
        const filters: QueryFilter[] = [
            { field: "name", operator: "contains", value: searchTerm },
            { field: "status", operator: "equal", value: "active" },
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
    ): Promise<PaginationResult<Products>> {
        const filters: QueryFilter[] = [
            { field: "basePrice", operator: "greaterThanEqual", value: minPrice },
            { field: "basePrice", operator: "lessThanEqual", value: maxPrice },
            { field: "status", operator: "equal", value: "active" },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async findNearbyProducts(
        southWest: { lat: number, lng: number },
        northEast: { lat: number, lng: number },
        options: QueryOptions = {}
    ): Promise<PaginationResult<Products>> {
        const filters: QueryFilter[] = [
            { field: "storeLatitude", operator: "greaterThan", value: southWest.lat },
            { field: "storeLatitude", operator: "lessThan", value: northEast.lat },
            { field: "storeLongitude", operator: "greaterThan", value: southWest.lng },
            { field: "storeLongitude", operator: "lessThan", value: northEast.lng },
            { field: "status", operator: "equal", value: "active" },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async getFeaturedProducts(
        options: QueryOptions = {}
    ): Promise<PaginationResult<Products>> {
        const filters: QueryFilter[] = [
            { field: "featured", operator: "equal", value: true },
            { field: "status", operator: "equal", value: "active" },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters,
            orderBy: "$createdAt",
            orderType: "desc"
        });
    }

    async getProductsByTag(
        tag: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<Products>> {
        const filters: QueryFilter[] = [
            { field: "tags", operator: "contains", value: tag },
            { field: "status", operator: "equal", value: "active" },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters
        });
    }

    async createProduct(data: CreateProductSchema): Promise<Products | { error: string }> {
        const { storage } = await createSessionClient();
        const { databases } = await createAdminClient();
        const rollback = await new AppwriteRollback(storage, databases);

        try {
            const { user } = await getAuthState();
            if (!user) {
                return { error: "Authentication required" };
            }

            if (data.hasVariants && data.productCombinations && data.productCombinations.length > 0) {
                const invalidCombinations = data.productCombinations.filter(
                    (combo: ProductCombinationSchema) => combo.basePrice < data.basePrice
                );

                if (invalidCombinations.length > 0) {
                    return { error: "Some variant combinations have prices lower than the base price" };
                }
            }

            const documentPermissions = createDocumentPermissions({ userId: user.$id });
            const imageUrls: string[] = [];

            if (data.images && data.images.length > 0) {
                for (const image of data.images) {
                    const uploadedImage = await this.storageService.uploadFile(image);
                    await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);

                    const imageUrl = await this.storageService.getFileUrl(uploadedImage.$id, 'view');
                    imageUrls.push(imageUrl);
                }
            }

            const productId = ID.unique();
            const productData = {
                physicalStoreId: data.physicalStoreId,
                name: data.name,
                description: data.description,
                shortDescription: data.shortDescription || "",
                sku: data.sku,
                basePrice: data.basePrice,
                currency: data.currency,
                status: data.status,
                featured: data.featured,
                categoryId: data.categoryId,
                subcategoryId: data.subcategoryId,
                productTypeId: data.productTypeId,
                tags: data.tags || [],
                images: imageUrls,
                hasVariants: data.hasVariants || false,
                isDropshippingEnabled: data.isDropshippingEnabled || false,
                minimumCommissionRate: data.minimumCommissionRate || 0,
                createdBy: user.$id,
                storeLatitude: data.storeLatitude || 0,
                storeLongitude: data.storeLongitude || 0,
                storeCountry: data.storeCountry
            };

            const newProduct = await databases.createDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                productId,
                productData,
                documentPermissions
            );

            await rollback.trackDocument(PRODUCTS_COLLECTION_ID, newProduct.$id);

            if (data.hasVariants && data.variants && data.variants.length > 0) {
                const variants = data.variants.map(async (variant) => {
                    const variantId = ID.unique();

                    await databases.createDocument(
                        DATABASE_ID,
                        PRODUCT_VARIANTS_COLLECTION_ID,
                        variantId,
                        {
                            productId,
                            templateId: variant.templateId,
                            name: variant.name,
                            inputType: variant.type,
                            values: JSON.stringify(variant.values),
                            required: variant.required || false,
                            sortOrder: variant.sortOrder || 0
                        }
                    );
                    await rollback.trackDocument(PRODUCT_VARIANTS_COLLECTION_ID, variantId);

                    const options = variant.values.map(async (option) => {
                        const optionId = ID.unique();
                        await databases.createDocument(
                            DATABASE_ID,
                            PRODUCT_VARIANT_OPTIONS_COLLECTION_ID,
                            optionId,
                            {
                                variantId,
                                value: option.value,
                                label: option.label || "",
                                colorCode: option.colorCode || "",
                                additionalPrice: option.additionalPrice || 0,
                                isDefault: option.isDefault || false
                            }
                        );
                        await rollback.trackDocument(PRODUCT_VARIANT_OPTIONS_COLLECTION_ID, optionId);
                    });

                    await Promise.all(options);
                });
                await Promise.all(variants);
            }

            if (data.hasVariants && data.productCombinations?.length) {
                const combinations = data.productCombinations.map(async (combination) => {
                    const combinationId = ID.unique();

                    const combinationImageUrls: string[] = [];
                    if (combination.images?.length) {
                        const combImagePromises = combination.images
                            .filter((img): img is File => img !== undefined)
                            .map(async (image) => {
                                const uploadedImage = await this.storageService.uploadFile(image);
                                await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);
                                return await this.storageService.getFileUrl(uploadedImage.$id, 'view');
                            });

                        const uploadedCombImageUrls = await Promise.all(combImagePromises);
                        combinationImageUrls.push(...uploadedCombImageUrls);
                    }

                    await databases.createDocument(
                        DATABASE_ID,
                        VARIANT_COMBINATIONS_COLLECTION_ID,
                        combinationId,
                        {
                            productId,
                            variantStrings: combination.variantStrings?.map(variantString => variantString) || [],
                            sku: combination.sku,
                            basePrice: combination.basePrice,
                            stockQuantity: combination.quantity || 1,
                            isActive: true,
                            weight: combination.weight || 0,
                            dimensions: combination.dimensions || "",
                            images: combinationImageUrls
                        },
                        documentPermissions
                    );
                    await rollback.trackDocument(VARIANT_COMBINATIONS_COLLECTION_ID, combinationId);

                    const combinationValues = Object.entries(combination.variantValues).map(async ([templateId, value]) => {
                        const valueId = ID.unique();
                        await databases.createDocument(
                            DATABASE_ID,
                            VARIANT_COMBINATION_VALUES_COLLECTION_ID,
                            valueId,
                            {
                                combinationId,
                                variantTemplateId: templateId,
                                value: String(value)
                            }
                        );
                        await rollback.trackDocument(VARIANT_COMBINATION_VALUES_COLLECTION_ID, valueId);
                    });

                    await Promise.all(combinationValues);
                });

                await Promise.all(combinations);
            };

            return newProduct as Products
        } catch (error) {
            console.error("createProduct error: ", error);
            await rollback.rollback();
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to create product" };
        }
    }

    async updateProduct(
        productId: string,
        data: UpdateProductSchema
    ): Promise<Products | { error: string }> {
        try {
            const { user } = await getAuthState();
            if (!user) {
                return { error: "Authentication required" };
            }

            const existingProduct = await this.findById(productId, {});
            if (!existingProduct) {
                return { error: "Product not found" };
            }

            const updatedProduct = await this.update(productId, data);
            return updatedProduct;
        } catch (error) {
            console.error("updateProduct error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to update product" };
        }
    }

    async deleteProducts(productIds: string[]): Promise<{ success?: string; error?: string }> {
        const { databases, storage } = await createSessionClient();

        try {
            const { user } = await getAuthState();
            if (!user) {
                return { error: "Authentication required" };
            }

            const batchSize = 5;
            for (let i = 0; i < productIds.length; i += batchSize) {
                await Promise.all(
                    productIds.slice(i, i + batchSize).map(async (productId) => {
                        const product = await databases.getDocument<Products>(
                            DATABASE_ID,
                            PRODUCTS_COLLECTION_ID,
                            productId
                        );

                        if (product.images && product.images.length > 0) {
                            await Promise.all(
                                product.images.map(async (imageUrl: string) => {
                                    const fileId = extractFileIdFromUrl(imageUrl);
                                    if (fileId) {
                                        await storage.deleteFile(PRODUCTS_BUCKET_ID, fileId);
                                    }
                                })
                            );
                        }

                        const combinations = await databases.listDocuments(
                            DATABASE_ID,
                            VARIANT_COMBINATIONS_COLLECTION_ID,
                            [Query.equal("productId", productId)]
                        );

                        await Promise.all(
                            combinations.documents.map(async (combination) => {
                                const combinationValues = await databases.listDocuments(
                                    DATABASE_ID,
                                    VARIANT_COMBINATION_VALUES_COLLECTION_ID,
                                    [Query.equal("combinationId", combination.$id)]
                                );

                                for (const value of combinationValues.documents) {
                                    await databases.deleteDocument(
                                        DATABASE_ID,
                                        VARIANT_COMBINATION_VALUES_COLLECTION_ID,
                                        value.$id
                                    );
                                }

                                if (combination.images && combination.images.length > 0) {
                                    await Promise.all(
                                        combination.images.map(async (imageUrl: string) => {
                                            const fileId = extractFileIdFromUrl(imageUrl);
                                            if (fileId) {
                                                await storage.deleteFile(PRODUCTS_BUCKET_ID, fileId);
                                            }
                                        })
                                    );
                                }

                                await databases.deleteDocument(
                                    DATABASE_ID,
                                    VARIANT_COMBINATIONS_COLLECTION_ID,
                                    combination.$id
                                );
                            })
                        );

                        const variants = await databases.listDocuments(
                            DATABASE_ID,
                            PRODUCT_VARIANTS_COLLECTION_ID,
                            [Query.equal("productId", productId)]
                        );

                        await Promise.all(
                            variants.documents.map(async (variant) => {
                                const options = await databases.listDocuments(
                                    DATABASE_ID,
                                    PRODUCT_VARIANT_OPTIONS_COLLECTION_ID,
                                    [Query.equal("variantId", variant.$id)]
                                );

                                for (const option of options.documents) {
                                    await databases.deleteDocument(
                                        DATABASE_ID,
                                        PRODUCT_VARIANT_OPTIONS_COLLECTION_ID,
                                        option.$id
                                    );
                                }

                                await databases.deleteDocument(
                                    DATABASE_ID,
                                    PRODUCT_VARIANTS_COLLECTION_ID,
                                    variant.$id
                                );
                            })
                        );

                        await databases.deleteDocument(
                            DATABASE_ID,
                            PRODUCTS_COLLECTION_ID,
                            productId
                        );
                    })
                );
            }

            return { success: `${productIds.length} product(s) deleted successfully!` };
        } catch (error) {
            console.error("deleteProducts error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to delete product(s)" };
        }
    }
}