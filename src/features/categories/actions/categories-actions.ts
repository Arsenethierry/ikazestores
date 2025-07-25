"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, CATEGORIES_COLLECTION_ID, DATABASE_ID, PRODUCTS_BUCKET_ID } from "@/lib/env-config";
import { CategoryById, CategorySchema, UpdateCategoryActionSchema } from "@/lib/schemas/products-schems";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const createNewCategory = action
    .use(authMiddleware)
    .schema(CategorySchema)
    .action(async ({ parsedInput: {
        categoryName,
        slug,
        icon,
        storeId,
        createdBy,
        parentCategoryId = null,
        isActive = true,
        sortOrder = 0
    }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const slugQuery = [
                Query.equal("slug", slug),
                ...(storeId ? [Query.equal("storeId", storeId)] : [Query.isNull("storeId")])
            ];

            if (parentCategoryId) {
                slugQuery.push(Query.equal("parentCategoryId", parentCategoryId));
            } else {
                slugQuery.push(Query.isNull("parentCategoryId"));
            }

            const existingCategory = await databases.listDocuments(
                DATABASE_ID,
                CATEGORIES_COLLECTION_ID,
                slugQuery
            );

            if (existingCategory.total > 0) {
                return { error: "A category with this slug already exists" };
            }

            if (parentCategoryId) {
                const parentCategory = await databases.getDocument(
                    DATABASE_ID,
                    CATEGORIES_COLLECTION_ID,
                    parentCategoryId
                );

                if (!parentCategory) {
                    return { error: "Parent category not found" };
                }

                if (storeId && parentCategory.storeId && parentCategory.storeId !== storeId) {
                    return { error: "Parent category must belong to the same store or be global" };
                }
            }

            let uploadedIcon;
            if (icon) {
                uploadedIcon = await storage.createFile(
                    PRODUCTS_BUCKET_ID,
                    ID.unique(),
                    icon
                );
                await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedIcon.$id);
            }

            const newCategory = await databases.createDocument(
                DATABASE_ID,
                CATEGORIES_COLLECTION_ID,
                ID.unique(),
                {
                    categoryName,
                    slug,
                    iconFileId: uploadedIcon?.$id ?? '',
                    storeId,
                    createdBy,
                    parentCategoryId,
                    isActive,
                    sortOrder,
                    iconUrl: `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedIcon?.$id}/view?project=${APPWRITE_PROJECT_ID}`,
                }
            );
            await rollback.trackDocument(CATEGORIES_COLLECTION_ID, newCategory.$id);

            revalidatePath('/admin/categories');
            if (storeId) {
                revalidatePath(`/admin/stores/${storeId}/categories`);
            }

            return { success: `Category "${categoryName}" has been created successfully` };
        } catch (error) {
            console.log("createNewCategory error: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create category" };
        }
    });

export const getCategoriesWithInheritance = async (storeId?: string | null) => {
    try {
        const { databases } = await createSessionClient();
        let queries;

        if (storeId) {
            queries = [
                Query.or([
                    Query.isNull("storeId"),
                    Query.equal("storeId", storeId)
                ])
            ];
        } else {
            queries = [
                Query.isNull("storeId")
            ];
        }

        const categories = await databases.listDocuments(
            DATABASE_ID,
            CATEGORIES_COLLECTION_ID,
            [
                ...queries,
                Query.equal("isActive", true),
                Query.orderAsc("sortOrder"),
                Query.orderAsc("categoryName")
            ]
        );

        const categoriesMap = new Map();
        const rootCategories: any[] = [];

        categories.documents.forEach(category => {
            categoriesMap.set(category.$id, { ...category, children: [] });
            if (!category.parentCategoryId) {
                rootCategories.push(category);
            }
        });

        categories.documents.forEach(category => {
            if (category.parentCategoryId && categoriesMap.has(category.parentCategoryId)) {
                const parent = categoriesMap.get(category.parentCategoryId);
                parent.children.push(categoriesMap.get(category.$id));
            }
        });

        return {
            documents: rootCategories.map(cat => categoriesMap.get(cat.$id)),
            total: categories.total,
            categoriesMap
        };
    } catch (error) {
        console.error("getCategoriesWithInheritance error:", error);
        return {
            error: error instanceof Error ? error.message : "Failed to fetch categories",
            documents: [],
            total: 0
        };
    }
}

export const updateCategory = action
    .use(authMiddleware)
    .schema(UpdateCategoryActionSchema)
    .action(async ({ parsedInput: {
        oldFileId,
        categoryId,
        ...values
    }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);
        try {
            if (values.slug) {
                const existingCategory = await databases.listDocuments(
                    DATABASE_ID,
                    CATEGORIES_COLLECTION_ID,
                    [
                        Query.equal("slug", values.slug),
                        Query.notEqual("$id", categoryId)
                    ]
                );

                if (existingCategory.total > 0) {
                    return { error: "A category with this slug already exists" };
                }
            }

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
                // updatedFields.iconUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedIcon.$id}/view?project=${APPWRITE_PROJECT_ID}`
            }
            if (Object.keys(updatedFields).length > 0) {
                const updatedDocument = await databases.updateDocument(
                    DATABASE_ID,
                    CATEGORIES_COLLECTION_ID,
                    categoryId,
                    updatedFields
                );

                return { success: `Category ${updatedDocument?.categoryName} has been updated successfully` };
            } else {
                return { success: "No changes detected." };
            }
        } catch (error) {
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to update category" };
        }
    })

export const deleteCategoryById = action
    .use(authMiddleware)
    .schema(CategoryById)
    .action(async ({ parsedInput: { categoryId }, ctx }) => {
        const { databases, storage } = ctx;
        try {
            const category = await getCategoryById(categoryId);
            if (!category) {
                return { error: "Category not found" };
            }

            await databases.deleteDocument(
                DATABASE_ID,
                CATEGORIES_COLLECTION_ID,
                category.$id
            );
            revalidatePath('/admin/stores/[storeId]/categories', 'page')
            revalidatePath("/admin/categories");
            if (category.iconFileId) {
                try {
                    await storage.deleteFile(PRODUCTS_BUCKET_ID, category.iconFileId);
                } catch (fileError) {
                    console.warn("Failed to delete icon file:", fileError);
                    return { success: "category deleted successfully" }
                }
            }
            return { success: "category deleted successfully" }
        } catch (error) {
            return { error: error instanceof Error ? error.message : "Failed to delete category" };
        }
    });

export const getCategoryById = async (categoryId: string) => {
    try {
        const { databases } = await createSessionClient();
        const category = await databases.getDocument(
            DATABASE_ID,
            CATEGORIES_COLLECTION_ID,
            categoryId
        );
        return category;
    } catch (error) {
        console.log("getCategoryById: ", error)
        return null
    }
}

export const getCategoryBySlug = async (slug: string, storeId?: string | null) => {
    try {
        const { databases } = await createSessionClient();
        const query = [
            Query.equal("slug", slug),
            ...(storeId ? [Query.equal("storeId", storeId)] : [Query.isNull("storeId")])
        ];

        const categories = await databases.listDocuments(
            DATABASE_ID,
            CATEGORIES_COLLECTION_ID,
            query
        );

        return categories.documents[0] || null;
    } catch (error) {
        console.log("getCategoryBySlug: ", error)
        return null
    }
}

export const getGeneralCategories = async () => {
    try {
        const { databases } = await createSessionClient();
        const categories = await databases.listDocuments(
            DATABASE_ID,
            CATEGORIES_COLLECTION_ID,
            [
                Query.isNull("storeId")
            ]
        );
        return categories;
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to fetch category",
            documents: [],
            total: 0
        };
    }
}

export const getAllCategoriesByStoreId = async ({ storeId }: { storeId: string }) => {
    try {
        const { databases } = await createSessionClient();
        const categories = await databases.listDocuments(
            DATABASE_ID,
            CATEGORIES_COLLECTION_ID,
            [
                Query.or([
                    Query.equal("storeId", storeId),
                    Query.isNull("storeId")
                ])
            ]
        );
        return categories;
    } catch (error) {
        console.warn(error)
        return {
            documents: [],
            total: 0
        };
    }
}