"use server";

import { ID, Query } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, STORE_BUCKET_ID, VIRTUAL_STORE_ID } from "../env-config";
import { CreateVirtualStoreParams } from "../types";
import { AppwriteRollback } from "./rollback";
import { updateUserLabels } from "./user-labels";
import { UserRole } from "../constants";
import { createSafeActionClient } from "next-safe-action";
import { authMiddleware } from "./middlewares";
import { updateVirtualStoreFormSchema } from "../schemas";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    }
})

export const createVirtualStoreAction = async (formData: CreateVirtualStoreParams) => {
    const { storeBanner, storeLogo, ...storeData } = formData;
    const { databases, storage } = await createSessionClient();
    const rollback = new AppwriteRollback(storage, databases);
    try {

        const bannerImagesUploaded = await Promise.all(
            storeBanner?.map(async (file) => {
                const fileId = ID.unique();

                const uploadedFile = await storage.createFile(
                    STORE_BUCKET_ID,
                    fileId,
                    file
                );
                await rollback.trackFile(STORE_BUCKET_ID, uploadedFile.$id);
                return {
                    id: uploadedFile.$id,
                    name: uploadedFile.name,
                    url: `${APPWRITE_ENDPOINT}/storage/buckets/${STORE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT_ID}`
                };
            }) || []
        );

        const storeLogoUploaded = await storage.createFile(
            STORE_BUCKET_ID,
            ID.unique(),
            storeLogo!
        );

        await rollback.trackFile(STORE_BUCKET_ID, storeLogoUploaded.$id);

        await updateUserLabels(storeData.ownerId, [UserRole.VIRTUAL_STORE_OWNER])

        const newVirtualStore = await databases.createDocument(
            DATABASE_ID,
            VIRTUAL_STORE_ID,
            ID.unique(),
            {
                storeName: storeData.storeName,
                owner: storeData.ownerId,
                bannerIds: bannerImagesUploaded.map(file => file.id),
                bannerUrls: bannerImagesUploaded.map(file => file.url),
                storeLogoId: storeLogoUploaded.$id,
                storeLogoUrl: `${APPWRITE_ENDPOINT}/storage/buckets/${STORE_BUCKET_ID}/files/${storeLogoUploaded.$id}/view?project=${APPWRITE_PROJECT_ID}`,
                storeType: 'virtualStore',
                subDomain: storeData.subDomain
            }
        );
        await rollback.trackDocument(VIRTUAL_STORE_ID, newVirtualStore.$id);

        return newVirtualStore
    } catch (error) {
        console.error("Error creating virtual store, rolling back:", error);
        await rollback.rollback();
        throw error;
    }
}

export const getAllVirtualStores = async () => {
    try {
        const { databases } = await createSessionClient();
        const allVirtualStores = await databases.listDocuments(
            DATABASE_ID,
            VIRTUAL_STORE_ID
        );

        return allVirtualStores
    } catch (error) {
        throw error
    }
}

export const deleteVirtualStore = async (VirtualStoreId: string, bannerIds: string[]) => {
    try {
        const { databases, storage } = await createSessionClient();
        await Promise.all(
            bannerIds.map(async bannerId => {
                await storage.deleteFile(
                    STORE_BUCKET_ID,
                    bannerId
                )
            })
        )
        await databases.deleteDocument(
            DATABASE_ID,
            VIRTUAL_STORE_ID,
            VirtualStoreId
        );
    } catch (error) {
        console.log(`error deleting virtual store: ${error}`)
        throw error
    }
}

export const getVirtualStoreByDomain = async (domain: string) => {
    try {
        const { databases } = await createSessionClient();
        const stores = await databases.listDocuments(
            DATABASE_ID,
            VIRTUAL_STORE_ID,
            [Query.equal("subDomain", domain)]
        );

        return stores
    } catch (error) {
        throw error
    }
}

export const getVirtualStoreById = async (storeId: string) => {
    try {
        const { databases } = await createSessionClient();
        const store = await databases.getDocument(
            DATABASE_ID,
            VIRTUAL_STORE_ID,
            storeId
        )

        return store
    } catch (error) {
        throw error
    }
}

export const getAllVirtualStoresByOwnerId = async (ownerId: string) => {
    try {
        const { databases } = await createSessionClient();

        const stores = await databases.listDocuments(
            DATABASE_ID,
            VIRTUAL_STORE_ID,
            [
                Query.equal("owner", ownerId)
            ]
        );

        return stores;
    } catch (error) {
        console.log("getAllVirtualStoresByOwnerId: ", error);
        return null;
    }
}

export const updateVirtualStore = action
    .use(authMiddleware)
    .schema(updateVirtualStoreFormSchema)
    .action(async ({ parsedInput: { storeId, storeBanner, storeLogo, oldFileId, ...values }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const updatedFields = { ...values };

            if (storeBanner) {
                const newBannerImagesUploaded = await Promise.all(
                    storeBanner.map(async (file) => {
                        if (file instanceof File) {
                            const fileId = ID.unique();
                            const uploadedFile = await storage.createFile(STORE_BUCKET_ID, fileId, file);
                            await rollback.trackFile(STORE_BUCKET_ID, uploadedFile.$id);
                            return {
                                id: uploadedFile.$id,
                                url: `${APPWRITE_ENDPOINT}/storage/buckets/${STORE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT_ID}`
                            };
                        } else if (typeof file === 'string') {
                            const pathname = new URL(file).pathname;
                            const parts = pathname.split("/files/");
                            if (parts.length > 1) {
                                const fileId = parts[1].split("/")[0];
                                return {
                                    id: fileId,
                                    url: `${APPWRITE_ENDPOINT}/storage/buckets/${STORE_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`
                                };
                            }
                        }
                    })
                );

                updatedFields.bannerUrls = newBannerImagesUploaded.map(file => file?.url).filter((url): url is string => Boolean(url));
                updatedFields.bannerIds = newBannerImagesUploaded.map(file => file?.id).filter((id): id is string => Boolean(id));
            }

            if (storeLogo instanceof File) {

                if (oldFileId) {
                    await storage.deleteFile(STORE_BUCKET_ID, oldFileId);
                }
                const storeLogoUploaded = await storage.createFile(STORE_BUCKET_ID, ID.unique(), storeLogo);
                await rollback.trackFile(STORE_BUCKET_ID, storeLogoUploaded.$id);
                updatedFields.storeLogoUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${STORE_BUCKET_ID}/files/${storeLogoUploaded.$id}/view?project=${APPWRITE_PROJECT_ID}`;
                updatedFields.storeLogoId = storeLogoUploaded.$id;
            }

            if (Object.keys(updatedFields).length > 0) {
                const updatedDocument = await databases.updateDocument(
                    DATABASE_ID,
                    VIRTUAL_STORE_ID,
                    storeId,
                    updatedFields
                );

                return { success: `Store with id: ${updatedDocument.$id} has been updated successfully` };
            } else {
                return { success: "No changes detected." };
            }
        } catch (error) {
            console.log("createNewProduct eror: ", error);
            return { error: error instanceof Error ? error.message : "Failed to update product" };
        }
    })