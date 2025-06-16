/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, PRODUCT_TYPES_COLLECTION_ID, VARIANT_COMBINATIONS_COLLECTION_ID, VARIANT_OPTIONS_COLLECTION_ID, VARIANT_TEMPLATES_COLLECTION_ID } from "@/lib/env-config";
import { ProductType, VariantOptions, VariantTemplate } from "@/lib/types";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { Query } from "node-appwrite";
import { z } from "zod";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message;
    },
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
            options: variantOptionsResponse.documents,
            productType
        };
    } catch (error) {
        console.error("getVariantTemplateDetails error:", error);
        return null;
    }
};

