"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, PRODUCTS_BUCKET_ID, PRODUCTS_COLLECTION_GROUPS_ID, PRODUCTS_COLLECTIONS_COLLECTION_ID, VIRTUAL_PRODUCT_ID } from "@/lib/env-config";
import { AddProductToCollectionSchema, CollectionSchema, DeleteCollectionGroupSchema, DeleteCollectionSchema, RemoveProductFromCollection, SaveCollectionGroupsSchema, UpdateCollectionGroupSchema } from "@/lib/schemas/products-schems";
import { CollectionGroupsTypes, CollectionTypes, VirtualProductTypes } from "@/lib/types";
import { createSafeActionClient } from "next-safe-action";
import { ID, Query } from "node-appwrite";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const createNewCollection = action
    .use(authMiddleware)
    .schema(CollectionSchema)
    .action(async ({ parsedInput: {
        collectionName,
        createdBy,
        featured,
        storeId,
        type,
        bannerImage,
        description
    }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            let bannerUrl = null;
            let bannerId = null;
            if (bannerImage instanceof File) {
                const uploadedFile = await storage.createFile(
                    PRODUCTS_BUCKET_ID,
                    ID.unique(),
                    bannerImage
                );
                bannerId = uploadedFile.$id
                bannerUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT_ID}`
                await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedFile.$id);
            };

            const newProductsCollections = await databases.createDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTIONS_COLLECTION_ID,
                ID.unique(),
                {
                    collectionName,
                    description,
                    type,
                    featured,
                    bannerImageUrl: bannerUrl,
                    bannerImageId: bannerId,
                    storeId,
                    createdBy,
                    groups: []
                }
            );
            await rollback.trackDocument(PRODUCTS_COLLECTIONS_COLLECTION_ID, newProductsCollections.$id);

            return { success: `Collection has been created successfully` };
        } catch (error) {
            console.log("createNewCollection error: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create collection" };
        }
    });

export const saveCollectionGroups = action
    .use(authMiddleware)
    .schema(SaveCollectionGroupsSchema)
    .action(async ({ parsedInput: {
        collectionId,
        groups
    }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            // const existingCollection = await databases.getDocument(
            //     DATABASE_ID,
            //     PRODUCTS_COLLECTIONS_COLLECTION_ID,
            //     collectionId
            // );
            const processedGroupIds = [];

            for (const group of groups) {
                const groupId = group.id;
                let imageUrl = group.groupImage;
                let imageId = null;

                const isNewGroup = groupId.startsWith('temp-');

                if (group.groupImage instanceof File) {
                    const uploadedFile = await storage.createFile(
                        PRODUCTS_BUCKET_ID,
                        ID.unique(),
                        group.groupImage
                    );
                    imageId = uploadedFile.$id;
                    imageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT_ID}`;
                    await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedFile.$id);
                }
                if (isNewGroup) {
                    const newGroup = await databases.createDocument(
                        DATABASE_ID,
                        PRODUCTS_COLLECTION_GROUPS_ID,
                        ID.unique(),
                        {
                            groupImageUrl: imageUrl,
                            groupImageId: imageId,
                            groupName: group.groupName,
                            displayOrder: group.displayOrder,
                            collectionId: collectionId,
                        }
                    );
                    await rollback.trackDocument(PRODUCTS_COLLECTION_GROUPS_ID, newGroup.$id);
                    processedGroupIds.push(newGroup.$id);
                } else {
                    await databases.updateDocument(
                        DATABASE_ID,
                        PRODUCTS_COLLECTION_GROUPS_ID,
                        groupId,
                        {
                            groupName: group.groupName,
                            displayOrder: group.displayOrder,
                            ...(group.groupImage instanceof File ? {
                                groupImageUrl: imageUrl,
                                groupImageId: imageId
                            } : {})
                        }
                    );
                    processedGroupIds.push(groupId);
                }
            }

            await databases.updateDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTIONS_COLLECTION_ID,
                collectionId,
                {
                    groups: processedGroupIds
                }
            );

            return { success: "Collection groups saved successfully" };
        } catch (error) {
            console.log("saveCollectionGroups error: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to save collection groups" };
        }
    });

export const deleteCollection = action
    .use(authMiddleware)
    .schema(DeleteCollectionSchema)
    .action(async ({ parsedInput: {
        bannerImageId,
        collectionId
    }, ctx }) => {
        const { databases, storage } = ctx;
        try {
            if (bannerImageId) {
                await storage.deleteFile(
                    PRODUCTS_BUCKET_ID,
                    bannerImageId
                )
            }
            const groups = await getCollectionGroupsByCollectionId({ collectionId });
            if (groups && groups?.total > 0) {
                await Promise.all(
                    (groups?.documents ?? []).map(async item => {
                        if (item.groupImageId) {
                            await storage.deleteFile(
                                PRODUCTS_BUCKET_ID,
                                item.groupImageId
                            );
                        }
                        await databases.deleteDocument(
                            DATABASE_ID,
                            PRODUCTS_COLLECTION_GROUPS_ID,
                            item.$id
                        );
                    })
                );
            }
            await databases.deleteDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTIONS_COLLECTION_ID,
                collectionId
            );

            return { success: "Collection deleted successfully" };
        } catch (error) {
            console.log("deleteCollection error: ", error);
            return { error: error instanceof Error ? error.message : "Failed to delete collection" };
        }
    })

export const deleteCollectionGroup = action
    .use(authMiddleware)
    .schema(DeleteCollectionGroupSchema)
    .action(async ({ parsedInput: {
        collectionId,
        groupId,
        imageId,
    }, ctx }) => {
        const { databases, storage } = ctx;

        try {
            const collection = await databases.getDocument<CollectionTypes>(
                DATABASE_ID,
                PRODUCTS_COLLECTIONS_COLLECTION_ID,
                collectionId
            );

            const updatedGroups = collection?.groups.filter((id: string) => id !== groupId);

            await databases.deleteDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION_GROUPS_ID,
                groupId
            );
            if (imageId) {
                await storage.deleteFile(
                    PRODUCTS_BUCKET_ID,
                    imageId
                )
            }

            await databases.updateDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTIONS_COLLECTION_ID,
                collectionId,
                {
                    groups: updatedGroups
                }
            );

            return { success: "Collection group deleted successfully" };
        } catch (error) {
            console.log("deleteCollectionGroup error: ", error);
            return { error: error instanceof Error ? error.message : "Failed to delete collection group" };
        }
    })

export const updateCollectionGroup = action
    .use(authMiddleware)
    .schema(UpdateCollectionGroupSchema)
    .action(async ({ parsedInput: {
        displayOrder,
        groupId,
        groupName,
        groupImage,
        oldImageId
    }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            let imageUrl = groupImage;
            let imageId = oldImageId;

            if (groupImage instanceof File) {
                if (oldImageId) {
                    await storage.deleteFile(
                        PRODUCTS_BUCKET_ID,
                        oldImageId
                    )
                }
                const uploadedFile = await storage.createFile(
                    PRODUCTS_BUCKET_ID,
                    ID.unique(),
                    groupImage
                );
                imageId = uploadedFile.$id;
                imageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${PRODUCTS_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT_ID}`;
                await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedFile.$id);
            }

            await databases.updateDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION_GROUPS_ID,
                groupId,
                {
                    groupName,
                    displayOrder,
                    ...(groupImage instanceof File ? {
                        groupImageUrl: imageUrl,
                        groupImageId: imageId
                    } : {})
                }
            );
            return { success: "Collection group updated successfully" };
        } catch (error) {
            console.log("updateCollectionGroup error: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to update collection group" };
        }
    });

export const addProductsToCollection = action
    .use(authMiddleware)
    .schema(AddProductToCollectionSchema)
    .action(async ({ parsedInput: {
        collectionId,
        productsIds,
        groupId
    }, ctx }) => {
        const { databases } = ctx;
        try {
            const collection = await databases.getDocument<CollectionTypes>(
                DATABASE_ID,
                PRODUCTS_COLLECTIONS_COLLECTION_ID,
                collectionId
            );

            if (collection.type === 'grouped') {
                // add products ids to group of collection
                if (!groupId) return { error: 'Group not selected, group ID is required' }
                try {
                    await databases.updateDocument(
                        DATABASE_ID,
                        PRODUCTS_COLLECTION_GROUPS_ID,
                        groupId,
                        {
                            productsIds
                        }
                    );
                    return { success: "Products added to group successfully" };
                } catch (error) {
                    console.log("add product in group error: ", error);
                    return { error: error instanceof Error ? error.message : "Failed to add products to group in collection" };
                }
            } else if (collection.type === 'simple') {
                try {
                    await databases.updateDocument(
                        DATABASE_ID,
                        PRODUCTS_COLLECTIONS_COLLECTION_ID,
                        collectionId,
                        {
                            productsIds
                        }
                    );
                    return { success: "Products added to collection successfully" };
                } catch (error) {
                    console.log("add product in collection error: ", error);
                    return { error: error instanceof Error ? error.message : "Failed to add products to collection" };
                }
            } else {
                return { error: "Something went wrong while grouping products" }
            }
        } catch (error) {
            console.log("addProductsToCollection error: ", error);
            return { error: error instanceof Error ? error.message : "Failed to add product to collection" };
        }
    })

export const removeProductFromCollection = action
    .use(authMiddleware)
    .schema(RemoveProductFromCollection)
    .action(async ({ parsedInput: {
        collectionId,
        productId,
        groupId
    }, ctx }) => {
        const { databases } = ctx;
        try {
            const collection = await databases.getDocument<CollectionTypes>(
                DATABASE_ID,
                PRODUCTS_COLLECTIONS_COLLECTION_ID,
                collectionId
            );
            if (collection.type === 'grouped' && groupId) {
                try {
                    const group = await databases.getDocument<CollectionGroupsTypes>(
                        DATABASE_ID,
                        PRODUCTS_COLLECTION_GROUPS_ID,
                        groupId
                    );

                    const updatedProductIds = group.productsIds?.filter(id => id !== productId);

                    await databases.updateDocument(
                        DATABASE_ID,
                        PRODUCTS_COLLECTION_GROUPS_ID,
                        groupId,
                        {
                            productsIds: updatedProductIds
                        }
                    );

                    return { success: "Product removed from group successfully" };
                } catch (error) {
                    console.log("remove product from group error: ", error);
                    return { error: error instanceof Error ? error.message : "Failed to remove product from group" };
                }
            } else if (collection.type === 'simple' && collection?.productsIds) {
                try {
                    const updatedProductIds = collection.productsIds.filter((id: string) => id !== productId);
                    await databases.updateDocument(
                        DATABASE_ID,
                        PRODUCTS_COLLECTIONS_COLLECTION_ID,
                        collectionId,
                        {
                            productsIds: updatedProductIds
                        }
                    );
                    return { success: "Product removed from collection successfully" };
                } catch (error) {
                    console.log("remove product from collection error: ", error);
                    return { error: error instanceof Error ? error.message : "Failed to remove product from collection" };
                }
            } else {
                return { error: "Invalid collection type or missing group ID" };
            }
        } catch (error) {
            console.log("removeProductFromCollection error: ", error);
            return { error: error instanceof Error ? error.message : "Failed to remove product from collection" };
        }
    })

export const getAllCollectionsByStoreId = async ({ storeId, limit = 10, featured = false }: { storeId?: string, limit?: number, featured?: boolean }) => {
    try {
        const { databases } = await createSessionClient();
        const baseQueries = [Query.limit(limit)];

        if (storeId) {
            baseQueries.push(
                Query.or([Query.equal("storeId", storeId), Query.isNull("storeId")])
            );
        } else {
            baseQueries.push(Query.isNull("storeId"));
        }

        const queries = [...baseQueries];

        if (featured) {
            queries.push(Query.equal("featured", true));
        }

        let collections = await databases.listDocuments<CollectionTypes>(
            DATABASE_ID,
            PRODUCTS_COLLECTIONS_COLLECTION_ID,
            queries
        );
        if (collections.total === 0 && featured) {
            collections = await databases.listDocuments<CollectionTypes>(
                DATABASE_ID,
                PRODUCTS_COLLECTIONS_COLLECTION_ID,
                baseQueries
            );
        }

        return collections;
    } catch (error) {
        console.warn(error)
        return {
            documents: [],
            total: 0
        };
    }
}

export const getCollectionById = async ({ collectionId, withGroups = false }: { collectionId: string, withGroups: boolean }) => {
    try {
        const { databases } = await createSessionClient();
        const collection = await databases.getDocument<CollectionTypes>(
            DATABASE_ID,
            PRODUCTS_COLLECTIONS_COLLECTION_ID,
            collectionId
        );

        if (withGroups) {
            const groups = await getCollectionGroupsByCollectionId({ collectionId });

            return {
                ...collection,
                groupsData: groups ? groups.documents : []
            };
        } else {
            return collection
        }
    } catch (error) {
        console.warn("getCollectionById ", error)
        return null;
    }
}

export const getCollectionGroupsByCollectionId = async ({ collectionId }: { collectionId: string }) => {
    try {
        const { databases } = await createSessionClient();
        const collection = await databases.listDocuments<CollectionGroupsTypes>(
            DATABASE_ID,
            PRODUCTS_COLLECTION_GROUPS_ID,
            [
                Query.equal("collectionId", collectionId),
                Query.orderAsc("displayOrder")
            ]
        );

        return collection;
    } catch (error) {
        console.warn("getCollectionById ", error)
        return null;
    }
};

export const getCollectionProducts = async ({
    collectionId,
    groupId = null,
    page = 1,
    limit = 10
}: {
    collectionId: string;
    groupId?: string | null;
    page?: number;
    limit?: number;
}) => {
    try {
        const { databases } = await createSessionClient();

        let productsIds: string[] = [];

        if (groupId) {
            const group = await databases.getDocument<CollectionGroupsTypes>(
                DATABASE_ID,
                PRODUCTS_COLLECTION_GROUPS_ID,
                groupId
            );
            productsIds = group.productsIds || [];
        } else {
            const collection = await databases.getDocument<CollectionTypes>(
                DATABASE_ID,
                PRODUCTS_COLLECTIONS_COLLECTION_ID,
                collectionId
            );
            productsIds = collection.productsIds || [];
        }

        if (productsIds.length === 0) {
            return {
                documents: [],
                total: 0,
                totalPages: 0
            };
        }

        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, productsIds.length);
        const paginatedProductIds = productsIds.slice(startIndex, endIndex);

        if (paginatedProductIds.length > 0) {
            const products = await databases.listDocuments<VirtualProductTypes>(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                [
                    Query.equal("$id", paginatedProductIds),
                    Query.limit(limit)
                ]
            );

            return {
                documents: products.documents,
                total: productsIds.length,
                totalPages: Math.ceil(productsIds.length / limit)
            };
        } else {
            return {
                documents: [],
                total: productsIds.length,
                totalPages: Math.ceil(productsIds.length / limit)
            };
        }
    } catch (error) {
        console.log("getCollectionProducts: ", error);
        return null;
    }
};