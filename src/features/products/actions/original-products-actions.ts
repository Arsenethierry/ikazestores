/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createSafeActionClient } from "next-safe-action"
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, ORIGINAL_PRODUCT_ID, PRODUCT_VARIANT_OPTIONS_COLLECTION_ID, PRODUCT_VARIANTS_COLLECTION_ID, PRODUCTS_BUCKET_ID, VARIANT_COMBINATION_VALUES_COLLECTION_ID, VARIANT_COMBINATIONS_COLLECTION_ID } from "@/lib/env-config";
import { authMiddleware } from "../../../lib/actions/middlewares";
import { ID, Query } from "node-appwrite";
import { AppwriteRollback } from "@/lib/actions/rollback";
// import { createSessionClient } from "@/lib/appwrite";
import { revalidatePath } from "next/cache";
import { getAllVirtualPropByOriginalProduct } from "./virtual-products-actions";
import {
    DeleteProductSchema,
    // DeleteProductSchema, 
    ProductSchemaProps,
    // UpdateProductSchemaProps
} from "@/lib/schemas/products-schems";
import { OriginalProductTypes } from "@/lib/types";
import { createSessionClient } from "@/lib/appwrite";
import { extractFileIdFromUrl } from "@/lib/utils";
// import { OriginalProductTypes } from "@/lib/types";
// import { VariantCombinationType } from "@/lib/schemas/product-variants-schema";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const createNewProduct = action
    .use(authMiddleware)
    .schema(ProductSchemaProps)
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage, user } = ctx;
        const rollback = new AppwriteRollback(storage, databases);
        try {
            if (parsedInput.hasVariants && parsedInput.productCombinations && parsedInput.productCombinations.length > 0) {
                const invalidCombinations = parsedInput.productCombinations.filter(
                    (combo: any) => combo.price < parsedInput.basePrice
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
            const productData = {
                storeId: parsedInput.storeId,
                name: parsedInput.name,
                description: parsedInput.description,
                shortDescription: parsedInput.shortDescription || "",
                sku: parsedInput.sku,
                basePrice: parsedInput.basePrice,
                status: parsedInput.status,
                featured: parsedInput.featured,
                categoryId: parsedInput.categoryId,
                subcategoryId: parsedInput.subcategoryId,
                productTypeId: parsedInput.productTypeId,
                tags: parsedInput.tags || [],
                weight: 0,
                dimensions: "",
                hasVariants: parsedInput.hasVariants || false,
                variantIds: [],
                combinationIds: [],
                images: imageUrls.map(image => image),
                storeLat: parsedInput.storeLat || 0,
                storeLong: parsedInput.storeLong || 0,
                storeOriginCountry: parsedInput.storeOriginCountry,
                createdBy: user.$id
            };

            const newProduct = await databases.createDocument(
                DATABASE_ID,
                ORIGINAL_PRODUCT_ID,
                productId,
                productData
            );
            await rollback.trackDocument(ORIGINAL_PRODUCT_ID, newProduct.$id);

            const variantIds: string[] = [];
            if (parsedInput.hasVariants && parsedInput.variants && parsedInput.variants.length > 0) {
                const variants = parsedInput.variants.map(async (variant) => {
                    const variantId = ID.unique();
                    variantIds.push(variantId);

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
                            sortOrder: 0
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
                        )
                    });

                    await Promise.all(options)
                });

                await Promise.all(variants)
            }

            const combinationIds: string[] = [];
            if (parsedInput.hasVariants && parsedInput.productCombinations?.length) {
                const combination = parsedInput.productCombinations.map(async (combination) => {
                    const combinationId = ID.unique();
                    combinationIds.push(combinationId);

                    const combinationImageUrls: string[] = [];
                    if (combination.images?.length) {
                        const combImagePromises = combination.images.map(async (image) => {
                            const uploadedImage = await storage.createFile(
                                PRODUCTS_BUCKET_ID,
                                ID.unique(),
                                image
                            );
                            await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);
                            return `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`;
                        });

                        const uploadedCombImageUrls = await Promise.all(combImagePromises);
                        combinationImageUrls.push(...uploadedCombImageUrls);
                    };

                    await databases.createDocument(
                        DATABASE_ID,
                        VARIANT_COMBINATIONS_COLLECTION_ID,
                        combinationId,
                        {
                            productId,
                            variantStrings: combination.variantStrings?.map(variantString => variantString) || [],
                            sku: combination.sku,
                            price: combination.price,
                            stockQuantity: combination.quantity || 0,
                            isActive: true,
                            weight: combination.weight || 0,
                            dimensions: "",
                            images: combinationImageUrls.map(image => image)
                        }
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

                await Promise.all(combination);
            }

            if (variantIds.length > 0 || combinationIds.length > 0) {
                await databases.updateDocument(
                    DATABASE_ID,
                    ORIGINAL_PRODUCT_ID,
                    productId,
                    {
                        variantIds,
                        combinationIds
                    }
                );
            }

            revalidatePath('/admin/stores/[storeId]/products');
            return { success: `Product "${parsedInput.name}" created successfully!` };
        } catch (error) {
            console.log("createNewProduct eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create product" };
        }
    });

export const deleteOriginalProduct = action
    .use(authMiddleware)
    .schema(DeleteProductSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage } = ctx;
        try {
            const productIds = Array.isArray(parsedInput.productIds) ? parsedInput.productIds : [parsedInput.productIds];

            const batchSize = 5;
            for (let i = 0; i < productIds.length; i += batchSize) {
                await Promise.all(
                    productIds.slice(i, i + batchSize).map(async (productId) => {
                        const product = await databases.getDocument<OriginalProductTypes>(
                            DATABASE_ID,
                            ORIGINAL_PRODUCT_ID,
                            productId
                        );

                        await Promise.all(
                            product.generalProductImages.map(async (imageUrl) => {
                                const fileId = extractFileIdFromUrl(imageUrl);
                                if (fileId) {
                                    await storage.deleteFile(PRODUCTS_BUCKET_ID, fileId)
                                }
                            })
                        );

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
                                    )
                                }
                                await databases.deleteDocument(
                                    DATABASE_ID,
                                    VARIANT_COMBINATIONS_COLLECTION_ID,
                                    combination.$id
                                )
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
                            ORIGINAL_PRODUCT_ID,
                            productId
                        )
                    })
                );
            }
            revalidatePath('/admin/stores/[storeId]/products');
            return { success: `${productIds.length} product(s) deleted successfully!` };
        } catch (error) {
            return { error: error instanceof Error ? error.message : "Failed to delete product(s)" };
        }
    })

// export const updateProduct = action
//     .use(authMiddleware)
//     .schema(UpdateProductSchemaProps)
//     .action(async ({ parsedInput, ctx }) => {
//         const { databases, storage } = ctx;
//         const rollback = new AppwriteRollback(storage, databases);
//         const { productId, ...updateData } = parsedInput;

//         try {
//             const existingProduct = await databases.getDocument<OriginalProductTypes>(
//                 DATABASE_ID,
//                 ORIGINAL_PRODUCT_ID,
//                 productId
//             );

//             if (updateData.hasVariants && updateData.productCombinations) {
//                 const invalidCombinations = updateData.productCombinations.filter(
//                     (combo: any) => combo.price < updateData.basePrice
//                 );

//                 if (invalidCombinations.length > 0) {
//                     return {
//                         serverError: "Some variant combinations have prices lower than the base price"
//                     };
//                 }
//             }

//             const newImageUrls: string[] = [...existingProduct.generalProductImages];
//             const imagesToDelete: string[] = [];

//             if (updateData.images) {
//                 for (const image of updateData.images) {
//                     const uploadedImage = await storage.createFile(
//                         PRODUCTS_BUCKET_ID,
//                         ID.unique(),
//                         image
//                     );
//                     await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);

//                     const imageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`;
//                     newImageUrls.push(imageUrl);
//                 }
//             }
//         } catch (error) {

//         }
//     })

// export const generateVariantCombinations = async ({
//     variantInstances,
//     basePrice,
//     trackInventory,
//     autoGenerateSKU = true,
//     skuPrefix = "PROD"
// }: {
//     variantInstances: Array<{
//         variantTemplateId: string;
//         selectedOptions: string[];
//         isEnabled: boolean;
//     }>;
//     basePrice: number;
//     trackInventory: boolean;
//     autoGenerateSKU?: boolean;
//     skuPrefix?: string;
// }) => {
//     try {
//         const combinations: VariantCombinationType[] = [];

//         const generateCombinations = (
//             templates: typeof variantInstances,
//             currentCombination: Record<string, string> = {},
//             index = 0
//         ): void => {
//             if (index >= templates.length) {
//                 const combination = createCombinationFromSelection(
//                     currentCombination,
//                     templates,
//                     basePrice,
//                     trackInventory,
//                     autoGenerateSKU,
//                     skuPrefix
//                 );
//                 combinations.push(combination);
//                 return;
//             }

//             const currentTemplate = templates[index];
//             for (const optionValue of currentTemplate.selectedOptions) {
//                 generateCombinations(
//                     templates,
//                     { ...currentCombination, [currentTemplate.variantTemplateId]: optionValue },
//                     index + 1
//                 );
//             }
//         }

//         const createCombinationFromSelection = (
//             selection: Record<string, string>,
//             templates: any[],
//             basePrice: number,
//             trackInventory: boolean,
//             autoGenerateSKU: boolean,
//             skuPrefix: string
//         ): VariantCombinationType => {
//             let totalAdditionalPrice = 0;
//             const additionalPrices: Record<string, number> = {};
//             const displayParts: string[] = [];
//             const skuParts: string[] = [skuPrefix];

//             for (const [templateId, optionValue] of Object.entries(selection)) {
//                 const template = templates.find(t => t.variantTemplateId === templateId)?.template;
//                 const option = template?.options?.find((opt: VariantOptions) => opt.value === optionValue);

//                 if (option) {
//                     totalAdditionalPrice += option.additionalPrice;
//                     additionalPrices[templateId] = option.additionalPrice;
//                     displayParts.push(option.name);

//                     // Build SKU part
//                     if (autoGenerateSKU) {
//                         const skuPart = option.value.slice(0, 3).toUpperCase();
//                         skuParts.push(skuPart);
//                     }
//                 }
//             }

//             const finalPrice = basePrice + totalAdditionalPrice;
//             const displayName = displayParts.join(' - ');
//             const sku = autoGenerateSKU ? skuParts.join('-') : '';

//             return {
//                 id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//                 variantValues: Object.fromEntries(
//                     Object.entries(selection).map(([templateId, value]) => [templateId, [value]])
//                 ),
//                 basePrice,
//                 finalPrice,
//                 additionalPrices,
//                 sku,
//                 inventoryQuantity: trackInventory ? 0 : 1,
//                 isActive: true,
//                 displayName,
//                 shortDescription: `${displayName} variant`,
//                 availability: trackInventory ? 'out_of_stock' : 'in_stock'
//             };
//         }

//         generateCombinations(variantInstances);

//         return {
//             success: true,
//             combinations,
//             totalCombinations: combinations.length
//         };
//     } catch (error) {
//         console.error("generateVariantCombinations error:", error);
//         return {
//             serverError: error instanceof Error ? error.message : "Failed to generate combinations"
//         };
//     }
// };

// export const getOriginalProducts = action
//     .use(authMiddleware)
//     .use(physicalStoreOwnerMiddleware)
//     .action(async () => {
//         try {
//             const { databases } = await createSessionClient();
//             const products = await databases.listDocuments(
//                 DATABASE_ID,
//                 ORIGINAL_PRODUCT_ID,
//                 [
//                     Query.orderDesc('$updatedAt')
//                     // Query.limit(15)
//                 ]
//             )

//             return { products }
//         } catch (error) {
//             return { error: error instanceof Error ? error.message : "Failed to fetch products" };
//         }
//     })

export const getOriginalProductsWithVirtualProducts = action
    .use(authMiddleware)
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

export async function deleteProductVariants(productId: string) {
    try {
        const { databases } = await createSessionClient()
        const combinations = await databases.listDocuments(
            DATABASE_ID,
            VARIANT_COMBINATIONS_COLLECTION_ID,
            [Query.equal("productId", productId)]
        );

        for (const combination of combinations.documents) {
            const values = await databases.listDocuments(
                DATABASE_ID,
                VARIANT_COMBINATION_VALUES_COLLECTION_ID,
                [Query.equal("combinationId", combination.$id)]
            );

            for (const value of values.documents) {
                await databases.deleteDocument(
                    DATABASE_ID,
                    VARIANT_COMBINATION_VALUES_COLLECTION_ID,
                    value.$id
                );
            }

            await databases.deleteDocument(
                DATABASE_ID,
                VARIANT_COMBINATIONS_COLLECTION_ID,
                combination.$id
            );
        }

        const variants = await databases.listDocuments(
            DATABASE_ID,
            PRODUCT_VARIANTS_COLLECTION_ID,
            [Query.equal("productId", productId)]
        );

        for (const variant of variants.documents) {
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
        }
    } catch (error) {
        console.log(error)
        return null;
    }
}

// export const getProductWithCombinations = async ({ productId }: { productId: string }) => {
//     try {
//         const { databases } = await createSessionClient();
//         const product = await databases.getDocument(
//             DATABASE_ID,
//             ORIGINAL_PRODUCT_ID,
//             productId
//         );
//         let variantCombinations = [];
//         if (product.hasVariants) {
//             const combinationsResponse = await databases.listDocuments(
//                 DATABASE_ID,
//                 VARIANT_COMBINATIONS_COLLECTION_ID,
//                 [
//                     Query.equal('productId', productId),
//                 ]
//             );
//             variantCombinations = combinationsResponse.documents.map(doc => ({
//                 ...doc,
//                 variantValues: JSON.parse(doc.variantValues),
//                 additionalPrices: doc.additionalPrices ? JSON.parse(doc.additionalPrices) : {},
//             }));

//             let variantInstances = [] as any[];
//             if (product.hasVariants) {
//                 const instancesResponse = await databases.listDocuments(
//                     DATABASE_ID,
//                     PRODUCT_VARIANTS_COLLECTION_ID,
//                     [
//                         Query.equal('productId', productId)
//                     ]
//                 );
//                 variantInstances = instancesResponse.documents;
//             }

//             return {
//                 product: {
//                     ...product,
//                     dimensions: product.dimensions ? JSON.parse(product.dimensions) : undefined,
//                     specifications: product.specifications ? JSON.parse(product.specifications) : undefined,
//                     metaFields: product.metaFields ? JSON.parse(product.metaFields) : undefined,
//                 },
//                 variantCombinations,
//                 variantInstances
//             };
//         }
//     } catch (error) {
//         console.error("Error getting stores in bounding box:", error);
//         return { product: null, variantCombinations: null, variantInstances: null }
//     }
// }