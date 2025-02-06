"use server";

import { ID } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { DATABASE_ID, PHYSICAL_STORE_ID } from "../env-config";
import { CreatePhysicalStoreParams } from "../types";

export const createPhysicalStoreAction = async (storeData: CreatePhysicalStoreParams) => {
    try {
        const { databases } = await createSessionClient();
        const newPhysicalStore = await databases.createDocument(
            DATABASE_ID,
            PHYSICAL_STORE_ID,
            ID.unique(),
            { 
                storeName: storeData.storeName,
                ownerId: storeData.ownerId,
             }
        );

        return newPhysicalStore
    } catch (error) {
        console.error(error);
        throw error;
    }
}