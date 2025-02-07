"use server";

import { ID, InputFile } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, PHYSICAL_STORE_ID, STORE_BUCKET_ID } from "../env-config";
import { CreatePhysicalStoreParams } from "../types";

export const createPhysicalStoreAction = async (formData: CreatePhysicalStoreParams) => {
    const {storeBanner, ...storeData} = formData;
    try {
        const { databases, storage } = await createSessionClient();

        let file;
        if (storeBanner) {
            const inputFile = 
            storeBanner &&
            InputFile.fromBlob(
                storeBanner?.get("blobFile") as Blob,
                storeBanner?.get("fileName") as string
            );

            file = await storage.createFile(STORE_BUCKET_ID, ID.unique(), inputFile);
        }

        const newPhysicalStore = await databases.createDocument(
            DATABASE_ID,
            PHYSICAL_STORE_ID,
            ID.unique(),
            { 
                storeName: storeData.storeName,
                ownerId: storeData.ownerId,
                bannerId: file?.$id ? file?.$id : null,
                bannerUrl: file?.$id
                ? `${APPWRITE_ENDPOINT}/storage/${STORE_BUCKET_ID}/files/${file.$id}/view??project=${APPWRITE_PROJECT_ID}`
                : null
             }
        );

        return newPhysicalStore
    } catch (error) {
        console.error(error);
        throw error;
    }
}