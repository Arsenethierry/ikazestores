"use server";

import { ID, Query } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, STORE_BUCKET_ID, VIRTUAL_STORE_ID } from "../env-config";
import { CreateVirtualStoreParams } from "../types";
import { AppwriteRollback } from "./rollback";
import { updateUserLabels } from "./user-labels";
import { UserRole } from "../constants";

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
                ownerId: storeData.ownerId,
                bannerIds: bannerImagesUploaded.map(file => file.id),
                bannerUrls: bannerImagesUploaded.map(file => file.url),
                storeLogoId: storeLogoUploaded.$id,
                storeLogoIdUrl: `${APPWRITE_ENDPOINT}/storage/buckets/${STORE_BUCKET_ID}/files/${storeLogoUploaded.$id}/view?project=${APPWRITE_PROJECT_ID}`,
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

export const getAllVirtualStoresByOwnerId = async (ownerId: string) => {
    try {
        const { databases } = await createSessionClient();
        
        const stores = await databases.listDocuments(
            DATABASE_ID,
            VIRTUAL_STORE_ID,
            [
                Query.equal("ownerId", ownerId)
            ]
        );

        return stores;
    } catch (error) {
        console.log("getAllVirtualStoresByOwnerId: ", error);
        return null;
    }
}