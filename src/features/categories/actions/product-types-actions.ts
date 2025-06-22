"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, PRODUCT_TYPES_COLLECTION_ID, PRODUCT_VARIANTS_COLLECTION_ID, VARIANT_COMBINATIONS_COLLECTION_ID } from "@/lib/env-config";
import { ProductTypeSchema, UpdateProductTypeSchema } from "@/lib/schemas/product-variants-schema";
import { ProductType, VariantTemplate } from "@/lib/types";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message;
    },
});

export const createProductType = action
    .use(authMiddleware)
    .schema(ProductTypeSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { databases } = ctx;
        try {
            const existingSlug = await databases.listDocuments(
                DATABASE_ID,
                PRODUCT_TYPES_COLLECTION_ID,
                [
                    Query.equal("slug", parsedInput.slug),
                    ...(parsedInput.storeId
                        ? [Query.equal("storeId", parsedInput.storeId)]
                        : [Query.isNull("storeId")]
                    )
                ]
            );

            if (existingSlug.total > 0) {
                return { error: "A product type with this slug already exists" };
            }

            const newProductType = await databases.createDocument(
                DATABASE_ID,
                PRODUCT_TYPES_COLLECTION_ID,
                ID.unique(),
                {
                    name: parsedInput.name,
                    slug: parsedInput.slug,
                    description: parsedInput.description || "",
                    categoryId: parsedInput.categoryId,
                    storeId: parsedInput.storeId || null,
                    createdBy: parsedInput.createdBy,
                    isActive: true
                }
            );

            revalidatePath('/admin/product-types');
            if (parsedInput.storeId) {
                revalidatePath(`/admin/stores/${parsedInput.storeId}/product-types`);
            }

            return { success: `Product type "${newProductType.name}" has been created successfully` };
        } catch (error) {
            console.error("createProductType error:", error);
            return { error: error instanceof Error ? error.message : "Failed to create product type" };
        }
    });

export const getProductTypes = async ({
    categoryId
}: {
    categoryId?: string;
} = {}) => {
    try {
        const { databases } = await createSessionClient();
        const queries = [] as string[];

        if (categoryId) {
            queries.push(Query.equal("categoryId", categoryId));
        }

        const productTypes = await databases.listDocuments<ProductType>(
            DATABASE_ID,
            PRODUCT_TYPES_COLLECTION_ID,
            queries
        );

        return productTypes;
    } catch (error) {
        console.error("getAllProductTypes error:", error);
        return {
            documents: [],
            total: 0
        };
    }
}

export const updateProductType = action
    .use(authMiddleware)
    .schema(UpdateProductTypeSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const { productTypeId, ...updateData } = parsedInput;

            const cleanedUpdateData = Object.fromEntries(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Object.entries(updateData).filter(([_, value]) => value !== undefined)
            );

            if (Object.keys(cleanedUpdateData).length === 0) {
                return { success: "No changes detected" };
            }

            const updatedProductType = await databases.updateDocument(
                DATABASE_ID,
                PRODUCT_TYPES_COLLECTION_ID,
                productTypeId,
                cleanedUpdateData
            );

            revalidatePath('/admin/product-types');
            revalidatePath('/admin/stores/[storeId]/product-types');

            return { success: `Product type "${updatedProductType.name}" has been updated successfully` };
        } catch (error) {
            console.error("updateProductType error:", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to update product type" };
        }
    });

export const deleteProductType = action
    .use(authMiddleware)
    .schema(z.object({ productTypeId: z.string() }))
    .action(async ({ parsedInput: { productTypeId }, ctx }) => {
        const { databases, user } = ctx;

        try {
            const productType = await databases.getDocument(
                DATABASE_ID,
                PRODUCT_TYPES_COLLECTION_ID,
                productTypeId
            );

            if (!productType) {
                return { error: "Product type not found" };
            }

            if (productType.createdBy !== user.$id) {
                return { error: "You don't have permission to delete this product type" };
            }
            await databases.deleteDocument(
                DATABASE_ID,
                PRODUCT_TYPES_COLLECTION_ID,
                productType.$id
            );

            revalidatePath('/admin/stores/[storeId]/product-types');
            return { success: "Product type deleted successfully" };
        } catch (error) {
            console.error("deleteProductType error:", error);
            return { error: error instanceof Error ? error.message : "Failed to delete product type" };
        }
    });

export const getProductVariants = async (productId: string) => {
    try {
        const { databases } = await createSessionClient();
        const productVariants = await databases.listDocuments(
            DATABASE_ID,
            PRODUCT_VARIANTS_COLLECTION_ID,
            [Query.equal("productId", productId)]
        );

        const variantCombinations = await databases.listDocuments(
            DATABASE_ID,
            VARIANT_COMBINATIONS_COLLECTION_ID,
            [Query.equal("productId", productId)]
        );

        const templateIds = [...new Set(productVariants.documents.map(v => v.variantTemplateId))];
        const templates = templateIds.length > 0
            ? await databases.listDocuments(
                DATABASE_ID,
                "VARIANT_TEMPLATES_COLLECTION_ID",
                [Query.equal("$id", templateIds)]
            )
            : { documents: [] };

        return {
            variants: productVariants.documents,
            combinations: variantCombinations.documents,
            templates: templates.documents
        };
    } catch (error) {
        console.error("getProductVariants error:", error);
        return {
            variants: [],
            combinations: [],
            templates: []
        };
    }
}

export const getProductTypeById = async ({ productTypeId, storeId }: { productTypeId: string, storeId?: string }) => {
    try {
        const { databases } = await createSessionClient();
        const productType = await databases.getDocument<ProductType>(
            DATABASE_ID,
            PRODUCT_TYPES_COLLECTION_ID,
            productTypeId
        );
        if (productType.storeId && productType.storeId !== storeId) {
            return null;
        }
        return productType;
    } catch (error) {
        console.error("Error fetching product type:", error);
        return null;
    }
};


export const getAvailableVariantTemplatesForProductType = async ({
    productTypeId,
    categoryId,
    storeId = null,
    includeInactive = false,
    includeGlobal = true
}: {
    productTypeId?: string;
    categoryId?: string;
    storeId?: string | null;
    includeInactive?: boolean;
    includeGlobal?: boolean;
} = {}) => {
    try {
        const { databases } = await createSessionClient();
        const queries = [];

        if (!includeInactive) {
            queries.push(Query.equal("isActive", true));
        }

        if (storeId) {
            if (includeGlobal) {
                queries.push(Query.or([
                    Query.isNull("storeId"),
                    Query.equal("storeId", storeId)
                ]));
            } else {
                queries.push(Query.equal("storeId", storeId));
            }
        } else {
            queries.push(Query.isNull("storeId"));
        }

        const allTemplates = await databases.listDocuments<VariantTemplate>(
            DATABASE_ID,
            "VARIANT_TEMPLATES_COLLECTION_ID",
            [
                ...queries,
                Query.orderAsc("name")
            ]
        );

        let availableTemplates = allTemplates.documents;

        if (categoryId) {
            availableTemplates = availableTemplates.filter(template => {
                if (!template.categoryIds || template.categoryIds.length === 0) {
                    return true;
                }
                return template.categoryIds.includes(categoryId);
            });
        }

        if (productTypeId) {
            availableTemplates = availableTemplates.filter(template => {
                if (!template.productTypeIds || template.productTypeIds.length === 0) {
                    return true;
                }
                return template.productTypeIds.includes(productTypeId);
            });
        }

        const templatesWithOptions = await Promise.all(
            availableTemplates.map(async (template) => {
                const options = await databases.listDocuments(
                    DATABASE_ID,
                    "VARIANT_OPTIONS_COLLECTION_ID",
                    [
                        Query.equal("variantTemplateId", template.$id),
                        Query.orderAsc("sortOrder"),
                        Query.orderAsc("label")
                    ]
                );

                return {
                    ...template,
                    options: options.documents
                };
            })
        );

        templatesWithOptions.sort((a, b) => {
            if (a.isRequired !== b.isRequired) {
                return a.isRequired ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        return {
            documents: templatesWithOptions,
            total: templatesWithOptions.length,
            context: {
                productTypeId,
                categoryId,
                storeId,
                includeInactive,
                includeGlobal
            }
        };
    } catch (error) {
        console.error("getAvailableVariantTemplatesForProductType error:", error);
        return {
            documents: [],
            total: 0
        };
    }
}