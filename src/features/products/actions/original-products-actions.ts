/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createSafeActionClient } from "next-safe-action"
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, ORIGINAL_PRODUCT_ID, PRODUCT_VARIANTS_COLLECTION_ID, PRODUCTS_BUCKET_ID, VARIANT_COMBINATIONS_COLLECTION_ID, VIRTUAL_PRODUCT_ID } from "@/lib/env-config";
import { authMiddleware, physicalStoreOwnerMiddleware } from "../../../lib/actions/middlewares";
import { ID, Query } from "node-appwrite";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { revalidatePath } from "next/cache";
import { getAllVirtualPropByOriginalProduct } from "./virtual-products-actions";
import { DeleteProductSchema, ProductSchema } from "@/lib/schemas/products-schems";
import { OriginalProductTypes, VariantOptions } from "@/lib/types";
import { VariantCombinationType } from "@/lib/schemas/product-variants-schema";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const createNewProduct = action
    .use(authMiddleware)
    .schema(ProductSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage, user } = ctx;
        const rollback = new AppwriteRollback(storage, databases)
        try {

            if (parsedInput.hasVariants && parsedInput.variantCombinations && parsedInput.variantCombinations.length > 0) {
                const invalidCombinations = parsedInput.variantCombinations.filter(
                    (combo: any) => combo.finalPrice < parsedInput.basePrice
                );

                if (invalidCombinations.length > 0) {
                    return {
                        serverError: "Some variant combinations have prices lower than the base price"
                    };
                }
            }

            const imageUrls: string[] = [];
            if (parsedInput.images && parsedInput.images.length > 0) {
                for (const image of parsedInput.images) {
                    const uploadedImage = await storage.createFile(
                        PRODUCTS_BUCKET_ID,
                        ID.unique(),
                        image
                    );
                    await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);

                    const imageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`;
                    imageUrls.push(imageUrl);
                }
            }

            const productId = ID.unique();
            console.log(parsedInput)
            const productData = {
                title: parsedInput.title,
                description: parsedInput.description,
                createdBy: user.$id,
                store: parsedInput.storeId,
                storeId: parsedInput.storeId,
                isPublished: parsedInput.isActive,
                storeLat: parsedInput.storeLat,
                storeLong: parsedInput.storeLong,
                storeOriginCountry: parsedInput.storeOriginCountry,
                generalProductImages: imageUrls.map(image => image),
                productTypeId: parsedInput.productTypeId,
                categoryId: parsedInput.categoryId,
                // selectedVariants: parsedInput.variantSelections,
                // hasVariants: parsedInput.hasVariants || false,
                // isActive: parsedInput.isActive,
                featured: parsedInput.featured,
                basePrice: parsedInput.basePrice,
                // compareAtPrice: parsedInput.compareAtPrice,
                costPrice: 900,
                trackInventory: true,
                inventoryQuantity: 7,
                // sku: parsedInput.hasVariants ? undefined : parsedInput.sku,
                // lowStockThreshold: parsedInput.lowStockThreshold,
                allowBackorders: parsedInput.allowBackorders,
                // weight: parsedInput.weight,
                // dimensions: parsedInput.dimensions ? JSON.stringify(parsedInput.dimensions) : undefined,
                shippingRequired: parsedInput.shippingRequired,
                minOrderQuantity: parsedInput.minOrderQuantity,
                // maxOrderQuantity: parsedInput.maxOrderQuantity,
                // seoTitle: parsedInput.seoTitle,
                // seoDescription: parsedInput.seoDescription,
                tags: parsedInput.tags,
                // brandId: parsedInput.brandId,
                // warrantyInfo: parsedInput.warrantyInfo,
                // returnPolicy: parsedInput.returnPolicy,
                // specifications: parsedInput.specifications ? JSON.stringify(parsedInput.specifications) : undefined,
                // metaFields: parsedInput.metaFields ? JSON.stringify(parsedInput.metaFields) : undefined,
            };
            const newProduct = await databases.createDocument(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                productId,
                productData
            );
            await rollback.trackDocument(ORIGINAL_PRODUCT_ID, newProduct.$id);

            if (parsedInput.hasVariants && parsedInput.variantSelections) {
                for (const [templateId, selectedOptions] of Object.entries(parsedInput.variantSelections)) {
                    if (selectedOptions.length > 0) {
                        const instanceId = ID.unique();
                        await databases.createDocument(
                            DATABASE_ID,
                            PRODUCT_VARIANTS_COLLECTION_ID,
                            instanceId,
                            {
                                productId,
                                variantTemplateId: templateId,
                                value: "selectedOptions",
                                isEnabled: true,
                                storeId: parsedInput.storeId,
                            }
                        );
                        await rollback.trackDocument(PRODUCT_VARIANTS_COLLECTION_ID, instanceId);
                    }
                }
            }

            if (parsedInput.hasVariants && parsedInput.variantCombinations && parsedInput.variantCombinations.length > 0) {
                for (const combination of parsedInput.variantCombinations) {
                    const combinationId = ID.unique();
                    await databases.createDocument(
                        DATABASE_ID,
                        VARIANT_COMBINATIONS_COLLECTION_ID,
                        combinationId,
                        {
                            productId,
                            // storeId: parsedInput.storeId,
                            variantValues: JSON.stringify(combination.variantValues),
                            basePrice: combination.basePrice,
                            finalPrice: combination.finalPrice,
                            additionalPrices: combination.additionalPrices ? JSON.stringify(combination.additionalPrices) : undefined,
                            sku: combination.sku,
                            inventoryQuantity: parsedInput.trackInventory ? (combination.inventoryQuantity || 0) : undefined,
                            isActive: combination.isActive !== undefined ? combination.isActive : true,
                            // displayName: combination.displayName,
                            // shortDescription: combination.shortDescription,
                            availability: combination.availability || (parsedInput.trackInventory ? 'out_of_stock' : 'in_stock'),
                            createdBy: user.$id,
                        }
                    );
                    await rollback.trackDocument(VARIANT_COMBINATIONS_COLLECTION_ID, combinationId);
                }
            }
            revalidatePath('/admin/stores/[storeId]/products');
            return { success: `Product "${parsedInput.title}" has been created successfully` };
        } catch (error) {
            console.log("createNewProduct eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create product" };
        }
    })

export const generateVariantCombinations = async ({
    variantInstances,
    basePrice,
    trackInventory,
    autoGenerateSKU = true,
    skuPrefix = "PROD"
}: {
    variantInstances: Array<{
        variantTemplateId: string;
        selectedOptions: string[];
        isEnabled: boolean;
    }>;
    basePrice: number;
    trackInventory: boolean;
    autoGenerateSKU?: boolean;
    skuPrefix?: string;
}) => {
    try {
        const combinations: VariantCombinationType[] = [];

        const generateCombinations = (
            templates: typeof variantInstances,
            currentCombination: Record<string, string> = {},
            index = 0
        ): void => {
            if (index >= templates.length) {
                const combination = createCombinationFromSelection(
                    currentCombination,
                    templates,
                    basePrice,
                    trackInventory,
                    autoGenerateSKU,
                    skuPrefix
                );
                combinations.push(combination);
                return;
            }

            const currentTemplate = templates[index];
            for (const optionValue of currentTemplate.selectedOptions) {
                generateCombinations(
                    templates,
                    { ...currentCombination, [currentTemplate.variantTemplateId]: optionValue },
                    index + 1
                );
            }
        }

        const createCombinationFromSelection = (
            selection: Record<string, string>,
            templates: any[],
            basePrice: number,
            trackInventory: boolean,
            autoGenerateSKU: boolean,
            skuPrefix: string
        ): VariantCombinationType => {
            let totalAdditionalPrice = 0;
            const additionalPrices: Record<string, number> = {};
            const displayParts: string[] = [];
            const skuParts: string[] = [skuPrefix];

            for (const [templateId, optionValue] of Object.entries(selection)) {
                const template = templates.find(t => t.variantTemplateId === templateId)?.template;
                const option = template?.options?.find((opt: VariantOptions) => opt.value === optionValue);

                if (option) {
                    totalAdditionalPrice += option.additionalPrice;
                    additionalPrices[templateId] = option.additionalPrice;
                    displayParts.push(option.name);

                    // Build SKU part
                    if (autoGenerateSKU) {
                        const skuPart = option.value.slice(0, 3).toUpperCase();
                        skuParts.push(skuPart);
                    }
                }
            }

            const finalPrice = basePrice + totalAdditionalPrice;
            const displayName = displayParts.join(' - ');
            const sku = autoGenerateSKU ? skuParts.join('-') : '';

            return {
                id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                variantValues: Object.fromEntries(
                    Object.entries(selection).map(([templateId, value]) => [templateId, [value]])
                ),
                basePrice,
                finalPrice,
                additionalPrices,
                sku,
                inventoryQuantity: trackInventory ? 0 : 1,
                isActive: true,
                displayName,
                shortDescription: `${displayName} variant`,
                availability: trackInventory ? 'out_of_stock' : 'in_stock'
            };
        }

        generateCombinations(variantInstances);

        return {
            success: true,
            combinations,
            totalCombinations: combinations.length
        };
    } catch (error) {
        console.error("generateVariantCombinations error:", error);
        return {
            serverError: error instanceof Error ? error.message : "Failed to generate combinations"
        };
    }
};

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
            const products = await databases.listDocuments<OriginalProductTypes>(
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
        const products = await databases.listDocuments<OriginalProductTypes>(
            DATABASE_ID,
            ORIGINAL_PRODUCT_ID,
            [
                Query.equal("storeId", physicalStoreId),
            ]
        );

        return products
    } catch (error) {
        console.log("getStoreOriginalProducts: Failed to fetch products", error)
        return {
            documents: [],
            total: 0
        }
    }
}

export const getNearbyStoresOriginalProducts = async (
    southWest: { lat: number, lng: number },
    northEast: { lat: number, lng: number }
) => {
    try {
        const { databases } = await createSessionClient();
        const nearbyProducts = await databases.listDocuments<OriginalProductTypes>(
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

export const getProductWithCombinations = async ({ productId }: { productId: string }) => {
    try {
        const { databases } = await createSessionClient();
        const product = await databases.getDocument(
            DATABASE_ID,
            ORIGINAL_PRODUCT_ID,
            productId
        );
        let variantCombinations = [];
        if (product.hasVariants) {
            const combinationsResponse = await databases.listDocuments(
                DATABASE_ID,
                VARIANT_COMBINATIONS_COLLECTION_ID,
                [
                    Query.equal('productId', productId),
                ]
            );
            variantCombinations = combinationsResponse.documents.map(doc => ({
                ...doc,
                variantValues: JSON.parse(doc.variantValues),
                additionalPrices: doc.additionalPrices ? JSON.parse(doc.additionalPrices) : {},
            }));

            let variantInstances = [] as any[];
            if (product.hasVariants) {
                const instancesResponse = await databases.listDocuments(
                    DATABASE_ID,
                    PRODUCT_VARIANTS_COLLECTION_ID,
                    [
                        Query.equal('productId', productId)
                    ]
                );
                variantInstances = instancesResponse.documents;
            }

            return {
                product: {
                    ...product,
                    dimensions: product.dimensions ? JSON.parse(product.dimensions) : undefined,
                    specifications: product.specifications ? JSON.parse(product.specifications) : undefined,
                    metaFields: product.metaFields ? JSON.parse(product.metaFields) : undefined,
                },
                variantCombinations,
                variantInstances
            };
        }
    } catch (error) {
        console.error("Error getting stores in bounding box:", error);
        return { product: null, variantCombinations: null, variantInstances: null }
    }
}