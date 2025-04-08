"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, CATEGORIES_COLLECTION_ID, DATABASE_ID, PRODUCTS_BUCKET_ID, SUB_CATEGORIES_COLLECTION_ID } from "@/lib/env-config";
import { CategoryById, SubCategorySchema, UpdateSubCategoryActionSchema } from "@/lib/schemas/products-schems";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
});

export const createSubCategory = action
    .use(authMiddleware)
    .schema(SubCategorySchema)
    .action(async ({ parsedInput: {
        icon,
        parentCategoryIds,
        subCategoryName
    }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const uploadedIcon = await storage.createFile(
                PRODUCTS_BUCKET_ID,
                ID.unique(),
                icon
            );
            await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedIcon.$id);
            const newCategory = await databases.createDocument(
                DATABASE_ID,
                SUB_CATEGORIES_COLLECTION_ID,
                ID.unique(),
                {
                    subCategoryName,
                    iconFileId: uploadedIcon.$id,
                    parentCategoryIds,
                    iconUrl: `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedIcon.$id}/view?project=${APPWRITE_PROJECT_ID}`
                }
            );
            await rollback.trackDocument(CATEGORIES_COLLECTION_ID, newCategory.$id);

            revalidatePath("/admin/subcategories")
            return { success: `Category has been created successfully` };
        } catch (error) {
            console.log("createSubCategory error: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create sub-category" };
        }
    });

export const updateSubCategory = action
    .use(authMiddleware)
    .schema(UpdateSubCategoryActionSchema)
    .action(async ({ parsedInput: {
        oldFileId,
        subCategoryId,
        ...values
    }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const updatedFields = { ...values };
            if (values?.icon instanceof File) {
                if (oldFileId) {
                    await storage.deleteFile(PRODUCTS_BUCKET_ID, oldFileId);
                }
                const uploadedIcon = await storage.createFile(
                    PRODUCTS_BUCKET_ID,
                    ID.unique(),
                    values.icon
                );
                await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedIcon.$id);
                updatedFields.iconUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedIcon.$id}/view?project=${APPWRITE_PROJECT_ID}`
            }
            if (Object.keys(updatedFields).length > 0) {
                const updatedDocument = await databases.updateDocument(
                    DATABASE_ID,
                    SUB_CATEGORIES_COLLECTION_ID,
                    subCategoryId,
                    updatedFields
                );

                return { success: `Sub-category ${updatedDocument?.categoryName} has been updated successfully` };
            } else {
                return { success: "No changes detected." };
            }
        } catch (error) {
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to update sub-category" };
        }
    })

export const getSubcategoriesByParentId = async (categoryId: string) => {
    try {
        const { databases } = await createSessionClient();
        const subcategories = await databases.listDocuments(
            DATABASE_ID,
            SUB_CATEGORIES_COLLECTION_ID,
            [
                Query.contains("parentCategoryIds", [categoryId])
            ]
        );
        return subcategories
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to fetch category",
            documents: [],
            total: 0
        };
    }
}

export const getAllSubcategories = async () => {
    try {
        const { databases } = await createSessionClient();
        const subcategories = await databases.listDocuments(
            DATABASE_ID,
            SUB_CATEGORIES_COLLECTION_ID
        );
        return subcategories
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to fetch category",
            documents: [],
            total: 0
        };
    }
}

export const deleteSubcategoryById = action
    .use(authMiddleware)
    .schema(CategoryById)
    .action(async ({ parsedInput: { categoryId }, ctx }) => {
        const { databases } = ctx;
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                SUB_CATEGORIES_COLLECTION_ID,
                categoryId
            );
        } catch (error) {
            console.log("deleteSubcategoryById error: ", error)
            return { error: error instanceof Error ? error.message : "Failed to delete sub category" };
        }
    })