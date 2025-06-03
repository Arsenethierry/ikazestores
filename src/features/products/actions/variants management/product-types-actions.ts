/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, PRODUCT_TYPES_COLLECTION_ID, PRODUCT_VARIANTS_COLLECTION_ID, PRODUCTS_BUCKET_ID, VARIANT_COMBINATIONS_COLLECTION_ID, VARIANT_GROUPS_COLLECTION_ID, VARIANT_TEMPLATES_COLLECTION_ID } from "@/lib/env-config";
import { ProductTypeSchema, ProductVariantSchema, UpdateProductTypeSchema, VariantCombinationSchema, VariantGroupSchema } from "@/lib/schemas/product-variants-schema";
import { ProductType, VariantGroup, VariantTemplate } from "@/lib/types";
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
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);
        try {
            const newProductType = await databases.createDocument(
                DATABASE_ID,
                PRODUCT_TYPES_COLLECTION_ID,
                ID.unique(),
                {
                    name: parsedInput.name,
                    description: parsedInput.description,
                    storeId: parsedInput.storeId,
                    createdBy: parsedInput.createdBy
                }
            );
            await rollback.trackDocument(PRODUCT_TYPES_COLLECTION_ID, newProductType.$id);

            revalidatePath('/admin/stores/[storeId]/product-types');
            return { success: `Product type ${newProductType.name} has been created successfully` };
        } catch (error) {
            console.error("createProductType error:", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create product type" };
        }
    });

export const getAllProductTypes = async (storeId?: string) => {
    try {
        const { databases } = await createSessionClient();
        let queries = [] as string[];

        if (storeId) {
            queries = [
                Query.or([
                    Query.equal("storeId", storeId),
                    Query.isNull("storeId")
                ])
            ];
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
            const updatedFields = { ...updateData };

            const updatedProductType = await databases.updateDocument(
                DATABASE_ID,
                PRODUCT_TYPES_COLLECTION_ID,
                productTypeId,
                updatedFields
            );

            revalidatePath('/admin/stores/[storeId]/product-types');
            return { success: `Product type ${updatedProductType.name} has been updated successfully` };
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

export const createVariantGroup = action
    .use(authMiddleware)
    .schema(VariantGroupSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { databases } = ctx;

        try {
            const newVariantGroup = await databases.createDocument(
                DATABASE_ID,
                VARIANT_GROUPS_COLLECTION_ID,
                ID.unique(),
                parsedInput
            );

            revalidatePath('/admin/stores/[storeId]/variants');
            return { success: `Variant group ${newVariantGroup.name} has been created successfully` };
        } catch (error) {
            console.error("createVariantGroup error:", error);
            return { error: error instanceof Error ? error.message : "Failed to create variant group" };
        }
    });

export const getVariantGroupsByProductType = async (productType: string, storeId?: string) => {
    try {
        const { databases } = await createSessionClient();
        const queries = [
            Query.equal("productType", productType)
        ];

        if (storeId) {
            queries.push(Query.or([
                Query.equal("storeId", storeId),
                Query.isNull("storeId")
            ]));
        } else {
            queries.push(Query.isNull("storeId"));
        }

        const variantGroups = await databases.listDocuments<VariantGroup>(
            DATABASE_ID,
            VARIANT_GROUPS_COLLECTION_ID,
            queries
        );

        const allTemplateIds = variantGroups.documents.reduce((acc: string[], group: VariantGroup) => {
            const templateIds = (group.variants || []).map(variant =>
                typeof variant === 'string' ? variant : variant.$id
            );
            return [...acc, ...templateIds];
        }, []);

        const variantTemplates = allTemplateIds.length > 0
            ? await databases.listDocuments<VariantTemplate>(
                DATABASE_ID,
                VARIANT_TEMPLATES_COLLECTION_ID,
                [Query.equal("$id", allTemplateIds)]
            )
            : { documents: [] };

        const groupsWithTemplates = variantGroups.documents.map(group => {
            const templates = (group.variants || []).map(variant => {
                if (typeof variant === 'string') {
                    return variantTemplates.documents.find(t => t.$id === variant);
                } else {
                    return variant;
                }
            }).filter(Boolean) as VariantTemplate[];

            return {
                ...group,
                templates
            };
        });

        return {
            ...variantGroups,
            documents: groupsWithTemplates
        };
    } catch (error) {
        console.error("getVariantGroupsByProductType error:", error);
        return {
            documents: [],
            total: 0
        };
    }
}

export const addVariantsToProduct = action
    .use(authMiddleware)
    .schema(z.array(ProductVariantSchema))
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const productId = parsedInput[0]?.productId;
            if (!productId) {
                return { error: "Product ID is required" };
            }

            const results = await Promise.all(parsedInput.map(async (variant) => {
                const imageUrls = [] as string[];

                if (variant.images && variant.images.length > 0) {
                    for (const image of variant.images) {
                        if (image instanceof File) {
                            const uploadedImage = await storage.createFile(
                                PRODUCTS_BUCKET_ID,
                                ID.unique(),
                                image
                            );
                            await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);

                            imageUrls.push(`${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`);
                        }
                    }
                }

                const variantDoc = await databases.createDocument(
                    DATABASE_ID,
                    PRODUCT_VARIANTS_COLLECTION_ID,
                    ID.unique(),
                    {
                        ...variant,
                        images: imageUrls,
                    }
                );
                await rollback.trackDocument(PRODUCT_VARIANTS_COLLECTION_ID, variantDoc.$id);

                return variantDoc;
            }));

            revalidatePath(`/admin/stores/[storeId]/products/${productId}`);
            return { success: `Added ${results.length} variants to product` };
        } catch (error) {
            console.error("addVariantsToProduct error:", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to add variants to product" };
        }
    });

export const createVariantCombinations = action
    .use(authMiddleware)
    .schema(z.array(VariantCombinationSchema))
    .action(async ({ parsedInput, ctx }) => {
        const { databases } = ctx;

        try {
            const productId = parsedInput[0]?.productId;
            if (!productId) {
                return { error: "Product ID is required" };
            }

            const existingCombinations = await databases.listDocuments(
                DATABASE_ID,
                VARIANT_COMBINATIONS_COLLECTION_ID,
                [Query.equal("productId", productId)]
            );

            if (existingCombinations.total > 0) {
                await Promise.all(existingCombinations.documents.map(doc =>
                    databases.deleteDocument(
                        DATABASE_ID,
                        VARIANT_COMBINATIONS_COLLECTION_ID,
                        doc.$id
                    )
                ));
            }

            const results = await Promise.all(parsedInput.map(async (combination) => {
                const combinationDoc = await databases.createDocument(
                    DATABASE_ID,
                    VARIANT_COMBINATIONS_COLLECTION_ID,
                    ID.unique(),
                    combination
                );

                return combinationDoc;
            }));

            revalidatePath(`/admin/stores/[storeId]/products/${productId}`);
            return { success: `Created ${results.length} variant combinations for product` };
        } catch (error) {
            console.error("createVariantCombinations error:", error);
            return { error: error instanceof Error ? error.message : "Failed to create variant combinations" };
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
                VARIANT_TEMPLATES_COLLECTION_ID,
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


export const updateVariantGroup = action
    .use(authMiddleware)
    .schema(VariantGroupSchema.extend({ groupId: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const { groupId, ...updateData } = parsedInput;

            const existingGroup = await databases.getDocument(
                DATABASE_ID,
                VARIANT_GROUPS_COLLECTION_ID,
                groupId
            );

            if (existingGroup.storeId && existingGroup.storeId !== updateData.storeId) {
                return { error: "You don't have permission to update this variant group" };
            }

            const updatedGroup = await databases.updateDocument(
                DATABASE_ID,
                VARIANT_GROUPS_COLLECTION_ID,
                groupId,
                {
                    name: updateData.name,
                    description: updateData.description,
                    productType: updateData.productType,
                    variants: updateData.variants,
                    $updatedAt: new Date().toISOString()
                }
            );

            revalidatePath('/admin/stores/[storeId]/variants');
            return { success: `Variant group ${updatedGroup.name} has been updated successfully` };
        } catch (error) {
            console.error("updateVariantGroup error:", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to update variant group" };
        }
    });

export const deleteVariantGroup = action
    .use(authMiddleware)
    .schema(z.object({
        groupId: z.string(),
        storeId: z.string().optional()
    }))
    .action(async ({ parsedInput, ctx }) => {
        const { databases } = ctx;

        try {
            const { groupId, storeId } = parsedInput;

            const existingGroup = await databases.getDocument(
                DATABASE_ID,
                VARIANT_GROUPS_COLLECTION_ID,
                groupId
            );

            if (existingGroup.storeId && existingGroup.storeId !== storeId) {
                return { error: "You don't have permission to delete this variant group" };
            }

            const productsUsingGroup = await databases.listDocuments(
                DATABASE_ID,
                PRODUCT_VARIANTS_COLLECTION_ID,
                [Query.equal("variantGroupId", groupId)]
            );

            if (productsUsingGroup.total > 0) {
                return {
                    error: "This variant group is being used by products and cannot be deleted. Remove it from products first."
                };
            }

            await databases.deleteDocument(
                DATABASE_ID,
                VARIANT_GROUPS_COLLECTION_ID,
                groupId
            );

            if (storeId) {
                revalidatePath(`/admin/stores/${storeId}/variants`);
            }

            return { success: "Variant group deleted successfully" };
        } catch (error) {
            console.error("deleteVariantGroup error:", error);
            return { error: error instanceof Error ? error.message : "Failed to delete variant group" };
        }
    });

export const getAvailableVariantTemplatesForProductType = async (
    productTypeId?: string,
    categoryId?: string,
    storeId?: string
) => {
    try {
        const { databases } = await createSessionClient();
        const queries = [Query.equal("isActive", true)];

        if (storeId) {
            queries.push(Query.or([
                Query.equal("storeId", storeId),
                Query.isNull("storeId")
            ]));
        } else {
            queries.push(Query.isNull("storeId"));
        }

        if (categoryId) {
            queries.push(Query.or([
                Query.contains("categoryIds", categoryId),
                Query.isNull("categoryIds"),
                Query.equal("categoryIds", [])
            ]));
        }

        const templates = await databases.listDocuments<VariantTemplate>(
            DATABASE_ID,
            VARIANT_TEMPLATES_COLLECTION_ID,
            queries
        );

        return templates;
    } catch (error) {
        console.error("getAvailableVariantTemplatesForProductType error:", error);
        return {
            documents: [],
            total: 0
        };
    }
}