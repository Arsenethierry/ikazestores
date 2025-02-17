"use server";

import { ID } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, PHYSICAL_STORE_ID, STORE_BUCKET_ID } from "../env-config";
import { CreatePhysicalStoreParams } from "../types";
import { AppwriteRollback } from "./rollback";

export const createPhysicalStoreAction = async (formData: CreatePhysicalStoreParams) => {
    const { storeBanner, ...storeData } = formData;
    const { databases, storage } = await createSessionClient();
    const rollback = new AppwriteRollback(storage, databases);

    try {

        const fileDetails = await Promise.all(
            storeBanner?.map(async (file) => {
                const fileId = ID.unique();

                const uploadedFile = await storage.createFile(
                    STORE_BUCKET_ID,
                    fileId,
                    file
                );
                await rollback.trackFile(STORE_BUCKET_ID, uploadedFile.$id)
                return {
                    id: uploadedFile.$id,
                    name: uploadedFile.name,
                    url: `${APPWRITE_ENDPOINT}/storage/buckets/${STORE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${APPWRITE_PROJECT_ID}`
                };
            }) || []
        );

        const newPhysicalStore = await databases.createDocument(
            DATABASE_ID,
            PHYSICAL_STORE_ID,
            ID.unique(),
            {
                storeName: storeData.storeName,
                ownerId: storeData.ownerId,
                bannerIds: fileDetails.map(file => file.id),
                bannerUrls: fileDetails.map(file => file.url),
                storeType: 'physicalStore'
            }
        );
        await rollback.trackDocument(PHYSICAL_STORE_ID, newPhysicalStore.$id)

        return newPhysicalStore
    } catch (error) {
        console.error("Error creating physical store, rolling back:", error);
        await rollback.rollback();
        throw error;
    }
}

export const getAllPshyicalStores = async () => {
    try {
        const { databases } = await createSessionClient();
        const allPhysicalStores = await databases.listDocuments(
            DATABASE_ID,
            PHYSICAL_STORE_ID
        );

        return allPhysicalStores
    } catch (error) {
        throw error
    }
}

export const deletePhysicalStore = async (physicalStoreId: string, bannerIds: string[]) => {
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
            PHYSICAL_STORE_ID,
            physicalStoreId
        );
    } catch (error) {
        console.log(`error deleting physical store: ${error}`)
        throw error
    }
}