/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, PRODUCT_TYPES_COLLECTION_ID, VARIANT_COMBINATIONS_COLLECTION_ID, VARIANT_OPTIONS_COLLECTION_ID, VARIANT_TEMPLATES_COLLECTION_ID } from "@/lib/env-config";
import { GenerateCombinationsSchema } from "@/lib/schemas/product-variants-schema";
import { ProductType, VariantOptions, VariantsCombination, VariantTemplate } from "@/lib/types";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message;
    },
});

export const generateVariantCombinations = action
    .use(authMiddleware)
    .schema(GenerateCombinationsSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { databases } = ctx;

        try {
            const {
                productId,
                variants
            } = parsedInput;

            function generateCombinations(variantOptions: any, currentIndex = 0, currentCombination = {}) {
                if (currentIndex >= variantOptions.length) {
                    return [currentCombination];
                }

                const currentVariant = variantOptions[currentIndex];
                const combinations = [];

                for (const option of currentVariant.options) {
                    const newCombination = {
                        ...currentCombination,
                        [currentVariant.variantId]: option.optionId
                    };

                    const nextCombinations = generateCombinations(
                        variantOptions,
                        currentIndex + 1,
                        newCombination
                    ) as any;

                    combinations.push(...nextCombinations);
                }

                return combinations;
            }

            const existingCombinations = await databases.listDocuments(
                DATABASE_ID,
                VARIANT_COMBINATIONS_COLLECTION_ID,
                [Query.equal("productId", productId)]
            );

            const allCombinations = generateCombinations(variants);

            const results = await Promise.all(allCombinations.map(async (combination) => {
                const combinationKey = Object.entries(combination)
                    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                    .map(([variantId, optionId]) => `${variantId}:${optionId}`)
                    .join('|');

                const existingCombination = existingCombinations.documents.find(doc => {
                    const existingKey = doc.variantOptions
                        .sort((a: any, b: any) => a.variantId.localeCompare(b.variantId))
                        .map((v: any) => `${v.variantId}:${v.optionId}`)
                        .join('|');

                    return existingKey === combinationKey;
                });

                if (existingCombination) {
                    return existingCombination
                }

                const variantOptions = Object.entries(combination).map(([variantId, optionId]) => ({
                    variantId,
                    optionId
                }));

                const combinationDoc = await databases.createDocument(
                    DATABASE_ID,
                    VARIANT_COMBINATIONS_COLLECTION_ID,
                    ID.unique(),
                    {
                        productId,
                        sku: '',
                        price: 0,
                        inventory: 0,
                        isActive: true,
                        variantOptions
                    }
                );

                return combinationDoc
            }));

            revalidatePath(`/admin/stores/[storeId]/products/${productId}`);
            return {
                success: `Generated ${results.length} variant combinations for product`,
                combinations: results
            }
        } catch (error) {
            console.error("generateVariantCombinations error:", error);
            return { error: error instanceof Error ? error.message : "Failed to generate variant combinations" };
        }
    });

export const bulkUpdateVariantCombinations = action
    .use(authMiddleware)
    .schema(z.object({
        combinations: z.array(z.object({
            combinationId: z.string(),
            sku: z.string().optional(),
            price: z.number().optional(),
            compareAtPrice: z.number().optional(),
            inventory: z.number().optional(),
            isActive: z.boolean().optional()
        })),
        productId: z.string()
    }))
    .action(async ({ parsedInput, ctx }) => {
        const { databases } = ctx;

        try {
            const { combinations, productId } = parsedInput;

            await Promise.all(combinations.map(async (combination) => {
                const { combinationId, ...updateData } = combination;

                await databases.updateDocument(
                    DATABASE_ID,
                    VARIANT_COMBINATIONS_COLLECTION_ID,
                    combinationId,
                    updateData
                );
            }));

            revalidatePath(`/admin/stores/[storeId]/products/${productId}`);
            return { success: `Updated ${combinations.length} variant combinations` };
        } catch (error) {
            console.error("bulkUpdateVariantCombinations error:", error);
            return { error: error instanceof Error ? error.message : "Failed to update variant combinations" };
        }
    });

export const getProductVariantCombinations = async (productId: string) => {
    try {
        const { databases } = await createSessionClient();
        const combinations = await databases.listDocuments<VariantsCombination>(
            DATABASE_ID,
            VARIANT_COMBINATIONS_COLLECTION_ID,
            [Query.equal("productId", productId)]
        );

        const variantIds = new Set();
        const optionIds = new Set();

        combinations.documents.forEach(doc => {
            doc.variantOptions.forEach((vo: VariantOptions) => {
                variantIds.add(vo.variantId);
                optionIds.add(vo.optionId);
            });
        });

        const variants = variantIds.size > 0
            ? await databases.listDocuments(
                DATABASE_ID,
                VARIANT_TEMPLATES_COLLECTION_ID,
                [Query.equal("$id", [...variantIds])]
            )
            : { documents: [] };

        const options = optionIds.size > 0
            ? await databases.listDocuments(
                DATABASE_ID,
                VARIANT_OPTIONS_COLLECTION_ID,
                [Query.equal("$id", [...optionIds])]
            )
            : { documents: [] };

        const enhancedCombinations = combinations.documents.map(combination => {
            const enhancedVariantOptions = combination.variantOptions.map(vo => {
                const template = variants.documents.find(v => v.$id === vo.variantId);
                const option = options.documents.find(o => o.$id === vo.optionId);

                return {
                    ...vo,
                    template: template || null,
                    option: option || null
                };
            });

            return {
                ...combination,
                variantOptions: enhancedVariantOptions
            };
        });

        return {
            ...combinations,
            documents: enhancedCombinations
        };
    } catch (error) {
        console.error("getProductVariantCombinations error:", error);
        return {
            documents: [],
            total: 0
        };
    }
}

export const getVariantTemplateDetails = async (templateId: string) => {
    try {
        const { databases } = await createSessionClient();

        const variantTemplate = await databases.getDocument<VariantTemplate>(
            DATABASE_ID,
            VARIANT_TEMPLATES_COLLECTION_ID,
            templateId
        );

        if (!variantTemplate) {
            return null;
        }

        const variantOptionsResponse = await databases.listDocuments<VariantOptions>(
            DATABASE_ID,
            VARIANT_OPTIONS_COLLECTION_ID,
            [Query.equal("variantTemplateId", templateId)]
        );

        let productType: ProductType | null = null;
        if (variantTemplate.productTypeId) {
            try {
                productType = await databases.getDocument<ProductType>(
                    DATABASE_ID,
                    PRODUCT_TYPES_COLLECTION_ID,
                    variantTemplate.productTypeId
                );
            } catch (error) {
                console.error("Error fetching product type:", error);
                // Continue without product type info
            }
        }

        return {
            variantTemplate,
            variantOptions: variantOptionsResponse.documents,
            productType
        };
    } catch (error) {
        console.error("getVariantTemplateDetails error:", error);
        return null;
    }
};

