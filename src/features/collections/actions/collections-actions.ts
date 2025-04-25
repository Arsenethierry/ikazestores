"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, PRODUCTS_BUCKET_ID, PRODUCTS_COLLECTION_GROUPS_ID, PRODUCTS_COLLECTIONS_COLLECTION_ID } from "@/lib/env-config";
import { CollectionSchema, DeleteCollectionGroupSchema, DeleteCollectionSchema, SaveCollectionGroupsSchema, UpdateCollectionGroupSchema } from "@/lib/schemas/products-schems";
import { CollectionGroupsTypes, CollectionTypes } from "@/lib/types";
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


export const getAllCollectionsByStoreId = async ({ storeId, limit = 10, featured = false }: { storeId: string, limit?: number, featured?: boolean }) => {
    try {
        const { databases } = await createSessionClient();
        const queries = [
            Query.or([
                Query.equal("storeId", storeId),
                Query.isNull("storeId")
            ]),
            Query.limit(limit)
        ];
        if (featured) {
            queries.push(Query.equal("featured", true))
        }
        const collections = await databases.listDocuments<CollectionTypes>(
            DATABASE_ID,
            PRODUCTS_COLLECTIONS_COLLECTION_ID,
            queries
        );
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
}