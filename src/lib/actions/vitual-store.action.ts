"use server";

import { ID, InputFile } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, STORE_BUCKET_ID, VIRTUAL_STORE_ID } from "../env-config";
import { CreateVirtualStoreParams } from "../types";
import { AppwriteRollback } from "./rollback";


export const createVirtualStoreAction = async (formData: CreateVirtualStoreParams) => {
    const { storeBanner, ...storeData } = formData;
    const { databases, storage } = await createSessionClient();
    const rollback = new AppwriteRollback(storage, databases);
    try {

        const fileDetails = await Promise.all(
            storeBanner?.map(async (banner) => {
                const inputFile = InputFile.fromBlob(
                    banner.get("blobFile") as Blob,
                    banner.get("filename") as string
                );
                const file = await storage.createFile(
                    STORE_BUCKET_ID,
                    ID.unique(),
                    inputFile
                );
                await rollback.trackFile(STORE_BUCKET_ID, file.$id)
                return {
                    id: file.$id,
                    name: file.name,
                    url: `${APPWRITE_ENDPOINT}/storage/buckets/${STORE_BUCKET_ID}/files/${file.$id}/view?project=${APPWRITE_PROJECT_ID}`
                };
            }) || []
        );

        const newVirtualStore = await databases.createDocument(
            DATABASE_ID,
            VIRTUAL_STORE_ID,
            ID.unique(),
            {
                storeName: storeData.storeName,
                ownerId: storeData.ownerId,
                bannerIds: fileDetails.map(file => file.id),
                bannerUrls: fileDetails.map(file => file.url)
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

export const getImagePreview = async () => {
    try {
        const { storage } = await createSessionClient();

        const imagePreview = await storage.getFilePreview(
            STORE_BUCKET_ID,
            "67a73b260016ae2fb675"
        )
        return imagePreview
    } catch (error) {
        throw error
    }
}

export const deleteVirtualStore = async (VirtualStoreId: string) => {
    try {
        const { databases } = await createSessionClient();
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