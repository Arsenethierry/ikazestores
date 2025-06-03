"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, PRODUCTS_BUCKET_ID, VARIANT_GROUPS_COLLECTION_ID, VARIANT_OPTIONS_COLLECTION_ID, VARIANT_TEMPLATES_COLLECTION_ID } from "@/lib/env-config";
import { VariantGroupSchema, VariantTemplateSchema } from "@/lib/schemas/product-variants-schema";
import { VariantTemplate } from "@/lib/types";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message;
    },
});

export const createVariantTemplate = action
    .use(authMiddleware)
    .schema(VariantTemplateSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const templateId = ID.unique();
            const { options, ...templateData } = parsedInput;
            const newTemplate = await databases.createDocument(
                DATABASE_ID,
                VARIANT_TEMPLATES_COLLECTION_ID,
                templateId,
                {
                    name: templateData.name,
                    description: templateData.description,
                    type: templateData.type,
                    isRequired: templateData.isRequired,
                    defaultValue: templateData.defaultValue,
                    productTypes: [templateData.productType],
                    productTypeId: templateData.productType,
                    createdBy: templateData.createdBy
                }
            );

            await rollback.trackDocument(VARIANT_TEMPLATES_COLLECTION_ID, templateId);

            if (options && options.length > 0) {
                for (const option of options) {
                    let imageUrl = null;

                    if (option.image instanceof File) {
                        const uploadedImage = await storage.createFile(
                            PRODUCTS_BUCKET_ID,
                            ID.unique(),
                            option.image
                        )
                        await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);
                        imageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`;
                    }

                    await databases.createDocument(
                        DATABASE_ID,
                        VARIANT_OPTIONS_COLLECTION_ID,
                        ID.unique(),
                        {
                            variantTemplateId: newTemplate.$id,
                            variant: newTemplate.$id,
                            value: option.value,
                            label: option.label,
                            additionalPrice: option.additionalPrice ?? 0,
                            imageUrl,
                        }
                    );
                }
            }

            revalidatePath("/admin/stores/[storeId]/variants");
            return {
                success: `Variant template ${newTemplate.name} has been created successfully`,
            };
        } catch (error) {
            console.error("createVariantTemplate error:", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create variant template" };
        }
    });

export const getVariantTemplatesByProductType = async (productType: string, storeId?: string) => {
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

        const variantTemplates = await databases.listDocuments<VariantTemplate>(
            DATABASE_ID,
            VARIANT_TEMPLATES_COLLECTION_ID,
            // queries
            [Query.equal("productTypeId", productType)]
        );

        return variantTemplates;
    } catch (error) {
        console.error("getVariantTemplatesByProductType error:", error);
        return {
            documents: [],
            total: 0
        };
    }
};

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

export const updateVariantTemplate = action
    .use(authMiddleware)
    .schema(VariantTemplateSchema.extend({ templateId: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const { templateId, options, ...templateData } = parsedInput;
            const updatedTemplate = await databases.updateDocument(
                DATABASE_ID,
                VARIANT_TEMPLATES_COLLECTION_ID,
                templateId,
                {
                    name: templateData.name,
                    description: templateData.description,
                    type: templateData.type,
                    isRequired: templateData.isRequired,
                    defaultValue: templateData.defaultValue,
                    priceModifier: templateData.priceModifier || 0
                }
            );
            if (options) {
                // Get existing options
                const existingOptions = await databases.listDocuments(
                    DATABASE_ID,
                    VARIANT_OPTIONS_COLLECTION_ID,
                    [Query.equal("variantTemplateId", templateId)]
                );

                // Delete options that are no longer in the updated list
                const existingOptionsMap = new Map(
                    existingOptions.documents.map(doc => [doc.value, doc])
                );

                // Create or update options
                for (const option of options) {
                    let imageUrl = existingOptionsMap.get(option.value)?.imageUrl || null;

                    // Update image if a new one is provided
                    if (option.image instanceof File) {
                        const imageId = ID.unique();
                        const uploadedImage = await storage.createFile(
                            PRODUCTS_BUCKET_ID,
                            imageId,
                            option.image
                        );
                        await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);

                        imageUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
                    }

                    // If option exists, update it; otherwise create a new one
                    if (existingOptionsMap.has(option.value)) {
                        const existingOption = existingOptionsMap.get(option.value);

                        if (existingOption)
                            await databases.updateDocument(
                                DATABASE_ID,
                                VARIANT_OPTIONS_COLLECTION_ID,
                                existingOption.$id,
                                {
                                    label: option.label || option.value,
                                    additionalPrice: option.additionalPrice || 0,
                                    imageUrl: imageUrl || existingOption.imageUrl,
                                    sortOrder: option.sortOrder || existingOption.sortOrder || 0
                                }
                            );

                        // Remove from map to track which ones to delete
                        existingOptionsMap.delete(option.value);
                    } else {
                        // Create new option
                        await databases.createDocument(
                            DATABASE_ID,
                            VARIANT_OPTIONS_COLLECTION_ID,
                            ID.unique(),
                            {
                                variantTemplateId: templateId,
                                value: option.value,
                                label: option.label || option.value,
                                additionalPrice: option.additionalPrice || 0,
                                imageUrl,
                                sortOrder: option.sortOrder || 0
                            }
                        );
                    }
                }

                // Delete options that weren't updated or created
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for (const [_, option] of existingOptionsMap) {
                    await databases.deleteDocument(
                        DATABASE_ID,
                        VARIANT_OPTIONS_COLLECTION_ID,
                        option.$id
                    );
                }
            }

            revalidatePath(`/admin/stores/${templateData.storeId}/variants`);
            return { success: `Variant template ${updatedTemplate.name} has been updated successfully` };
        } catch (error) {
            console.error("updateVariantTemplate error:", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to update variant template" };
        }
    })

export const deleteVariantTemplate = action
    .use(authMiddleware)
    .schema(z.object({ templateId: z.string() }))
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const { templateId } = parsedInput;

            const existingOptions = await databases.listDocuments(
                DATABASE_ID,
                VARIANT_OPTIONS_COLLECTION_ID,
                [Query.equal("variantTemplateId", templateId)]
            );

            for (const option of existingOptions.documents) {
                if (option.imageUrl) {
                    const urlParts = option.imageUrl.split('/');
                    const fileId = urlParts[urlParts.length - 2]; // Get file ID from URL structure

                    try {
                        await storage.deleteFile(PRODUCTS_BUCKET_ID, fileId);
                    } catch (error) {
                        console.warn(`Could not delete image file ${fileId}:`, error);
                    }
                }

                await databases.deleteDocument(
                    DATABASE_ID,
                    VARIANT_OPTIONS_COLLECTION_ID,
                    option.$id
                );
            }

            await databases.deleteDocument(
                DATABASE_ID,
                VARIANT_TEMPLATES_COLLECTION_ID,
                templateId
            );

            revalidatePath("/admin/stores/[storeId]/variants");
            return {
                success: "Variant template has been deleted successfully"
            };
        } catch (error) {
            console.error("deleteVariantTemplate error:", error);
            await rollback.rollback();
            return {
                error: error instanceof Error ? error.message : "Failed to delete variant template"
            };
        }
    });