"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, PRODUCTS_BUCKET_ID, VARIANT_OPTIONS_COLLECTION_ID, VARIANT_TEMPLATES_COLLECTION_ID } from "@/lib/env-config";
import { VariantTemplateSchema } from "@/lib/schemas/product-variants-schema";
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
            const template = await databases.createDocument(
                DATABASE_ID,
                VARIANT_TEMPLATES_COLLECTION_ID,
                templateId,
                {
                    name: parsedInput.name,
                    description: parsedInput.description,
                    inputType: parsedInput.type,
                    isRequired: parsedInput.isRequired,
                    defaultValue: parsedInput.defaultValue,
                    storeId: parsedInput.storeId || null,
                    createdBy: parsedInput.createdBy,
                    isActive: true,
                    productTypeId: parsedInput.productTypeId || null
                }
            );
            await rollback.trackDocument(VARIANT_TEMPLATES_COLLECTION_ID, templateId);

            if (parsedInput.options) {
                for (const option of parsedInput.options) {
                    let imageUrl = null;

                    if (option.image instanceof File) {
                        const uploadedImage = await storage.createFile(
                            PRODUCTS_BUCKET_ID,
                            ID.unique(),
                            option.image
                        );
                        await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);
                        imageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`;
                    }

                    await databases.createDocument(
                        DATABASE_ID,
                        VARIANT_OPTIONS_COLLECTION_ID,
                        ID.unique(),
                        {
                            variantTemplateId: templateId,
                            variant: templateId,
                            name: option.label || option.value,
                            value: option.value,
                            additionalPrice: option.additionalPrice || 0,
                            colorCode: option.hex || null,
                            imageUrl,
                            sortOrder: option.sortOrder || 0,
                            isActive: option.isActive ?? true,
                            storeId: parsedInput.storeId || null
                        }
                    );
                }
            }
            revalidatePath('/admin/categories/variant-templates');
            if (parsedInput.storeId) {
                revalidatePath(`/admin/categories/stores/${parsedInput.storeId}/variants`);
            }

            return { success: `Variant template ${template.name} created successfully` };
        } catch (error) {
            console.error("createVariantTemplate error:", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create variant template" };
        }
    });

export const getVariantTemplates = async ({
    storeId,
}: {
    storeId?: string;
} = {}) => {
    try {

        const { databases } = await createSessionClient();

        const queries = [Query.equal("isActive", true)];

        if (storeId) {
            queries.push(Query.or([
                Query.equal("storeId", storeId),
                Query.isNull("storeId")
            ]));
        }

        const templates = await databases.listDocuments(
            DATABASE_ID,
            VARIANT_TEMPLATES_COLLECTION_ID,
            queries
        );

        const templatesWithOptions = await Promise.all(
            templates.documents.map(async (template) => {
                const options = await databases.listDocuments(
                    DATABASE_ID,
                    VARIANT_OPTIONS_COLLECTION_ID,
                    [
                        Query.equal("variantTemplateId", template.$id),
                        Query.orderAsc("sortOrder")
                    ]
                );

                return {
                    ...template,
                    options: options.documents
                };
            })
        );

        return {
            documents: templatesWithOptions,
            total: templates.total
        };
    } catch (error) {
        console.error("getVariantTemplatesByProductType error:", error);
        return {
            documents: [],
            total: 0
        };
    }
};


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
                    inputType: templateData.type,
                    isRequired: templateData.isRequired,
                    defaultValue: templateData.defaultValue
                }
            );

            if (options) {
                const existingOptions = await databases.listDocuments(
                    DATABASE_ID,
                    VARIANT_OPTIONS_COLLECTION_ID,
                    [Query.equal("variantTemplateId", templateId)]
                );

                const existingOptionsMap = new Map(
                    existingOptions.documents.map(doc => [doc.value, doc])
                );

                for (const option of options) {
                    let imageUrl = existingOptionsMap.get(option.value)?.imageUrl || null;

                    if (option.image instanceof File) {
                        const imageId = ID.unique();
                        const uploadedImage = await storage.createFile(
                            PRODUCTS_BUCKET_ID,
                            imageId,
                            option.image
                        );
                        await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);
                        imageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedImage.$id}/view?project=${APPWRITE_PROJECT_ID}`;
                    }

                    if (existingOptionsMap.has(option.value)) {
                        const existingOption = existingOptionsMap.get(option.value);
                        if (existingOption) {
                            await databases.updateDocument(
                                DATABASE_ID,
                                VARIANT_OPTIONS_COLLECTION_ID,
                                existingOption.$id,
                                {
                                    name: option.label || option.value,
                                    additionalPrice: option.additionalPrice || 0,
                                    colorCode: option.hex || null,
                                    imageUrl: imageUrl || existingOption.imageUrl,
                                    sortOrder: option.sortOrder || existingOption.sortOrder || 0,
                                    isActive: option.isActive ?? true
                                }
                            );
                        }
                        existingOptionsMap.delete(option.value);
                    } else {
                        const optionId = ID.unique();
                        await databases.createDocument(
                            DATABASE_ID,
                            VARIANT_OPTIONS_COLLECTION_ID,
                            optionId,
                            {
                                variantTemplateId: templateId,
                                variant: templateId,
                                name: option.label || option.value,
                                value: option.value,
                                additionalPrice: option.additionalPrice || 0,
                                colorCode: option.hex || null,
                                imageUrl,
                                sortOrder: option.sortOrder || 0,
                                isActive: option.isActive ?? true,
                                storeId: templateData.storeId || null
                            }
                        );
                        await rollback.trackDocument(VARIANT_OPTIONS_COLLECTION_ID, optionId);
                    }
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for (const [_, option] of existingOptionsMap) {
                    await databases.deleteDocument(
                        DATABASE_ID,
                        VARIANT_OPTIONS_COLLECTION_ID,
                        option.$id
                    );
                }
            }

            revalidatePath(`/admin/categories/product-types/${templateData.productTypeId}`);
            if (templateData.storeId) {
                revalidatePath(`/admin/stores/${templateData.storeId}/variants`);
            }

            return { success: `Variant template "${updatedTemplate.name}" has been updated successfully` };
        } catch (error) {
            console.error("updateVariantTemplate error:", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to update variant template" };
        }
    });

export const deleteVariantTemplate = action
    .use(authMiddleware)
    .schema(z.object({
        templateId: z.string(),
        storeId: z.string().optional(),
        productTypeId: z.string().optional()
    }))
    .action(async ({ parsedInput, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const { templateId, storeId, productTypeId } = parsedInput;

            const existingOptions = await databases.listDocuments(
                DATABASE_ID,
                VARIANT_OPTIONS_COLLECTION_ID,
                [Query.equal("variantTemplateId", templateId)]
            );

            for (const option of existingOptions.documents) {
                if (option.imageUrl) {
                    const urlParts = option.imageUrl.split('/');
                    const fileId = urlParts[urlParts.length - 2];

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

            if (productTypeId) {
                revalidatePath(`/admin/categories/product-types/${productTypeId}`);
            }
            revalidatePath("/admin/categories/variant-templates");
            if (storeId) {
                revalidatePath(`/admin/stores/${storeId}/variants`);
            }

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

export const getVariantTemplatesForStore = async (storeId?: string | null, productTypeId?: string) => {
    try {
        const { databases } = await createSessionClient();

        const queries = [
            Query.equal("isActive", true),
            ...(productTypeId && productTypeId.length > 0 ? [Query.equal("productTypeId", productTypeId)] : [])
        ];

        const variantTemplates = await databases.listDocuments<VariantTemplate>(
            DATABASE_ID,
            VARIANT_TEMPLATES_COLLECTION_ID,
            queries
        );

        return variantTemplates;
    } catch (error) {
        console.error("getVariantTemplatesForStore error:", error);
        return {
            documents: [],
            total: 0
        };
    }
}