"use server";

import { ID, Query } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DATABASE_ID, PHYSICAL_STORE_ID, STORE_BUCKET_ID } from "../env-config";
import { AppwriteRollback } from "./rollback";
import { updateUserLabels } from "./user-labels";
import { UserRole } from "../constants";
import { createSafeActionClient } from "next-safe-action";
import { createPhysicalStoreFormSchema, UpdatePhysicalStoreFormSchema } from "../schemas";
import { authMiddleware } from "./middlewares";
import { getUserLocale } from "./auth.action";
import { PhysicalStoreTypes } from "../types";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    }
})

export const createPhysicalStoreAction = action
    .use(authMiddleware)
    .schema(createPhysicalStoreFormSchema)
    .action(async ({ parsedInput: {
        storeLogo,
        storeName,
        address,
        description,
        latitude,
        longitude,
        storeBio,
        country
    }, ctx }) => {
        const { databases, storage, user } = ctx;
        const rollback = new AppwriteRollback(storage, databases);
        try {

            const storeLogoUploaded = await storage.createFile(
                STORE_BUCKET_ID,
                ID.unique(),
                storeLogo!
            );

            await rollback.trackFile(STORE_BUCKET_ID, storeLogoUploaded.$id);

            await updateUserLabels(user.$id, [UserRole.PHYSICAL_STORE_OWNER])

            const newPhysicalStore = await databases.createDocument(
                DATABASE_ID,
                PHYSICAL_STORE_ID,
                ID.unique(),
                {
                    storeName,
                    description,
                    bio: storeBio,
                    owner: user.$id,
                    storeType: 'physicalStore',
                    latitude,
                    longitude,
                    address,
                    country,
                    storeLogoId: storeLogoUploaded.$id,
                    storeLogoUrl: `${APPWRITE_ENDPOINT}/storage/buckets/${STORE_BUCKET_ID}/files/${storeLogoUploaded.$id}/view?project=${APPWRITE_PROJECT_ID}`,
                    createFrom: (await getUserLocale())?.country
                }
            );

            await rollback.trackDocument(PHYSICAL_STORE_ID, newPhysicalStore.$id);

            return { success: "Store created successfully.", storeId: newPhysicalStore.$id };
        } catch (error) {
            console.log("create physical store error: ", error);
            return { error: error instanceof Error ? error.message : "Failed to create store" };
        }
    })


export const getAllPshyicalStores = async () => {
    try {
        const { databases } = await createSessionClient();
        const allPhysicalStores = await databases.listDocuments(
            DATABASE_ID,
            PHYSICAL_STORE_ID
        );

        return allPhysicalStores
    } catch (error) {
        console.log(error)
        return null;
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
        );
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

export const getPhysicalStoreById = async (storeId: string) => {
    try {
        const { databases } = await createSessionClient();

        const store = await databases.getDocument<PhysicalStoreTypes>(
            DATABASE_ID,
            PHYSICAL_STORE_ID,
            storeId
        );

        return store;
    } catch (error) {
        console.log("getAllPshyicalStoresByOwnerId: ", error);
        return null;
    }
}

export const getAllPshyicalStoresByOwnerId = async (ownerId: string) => {
    try {
        const { databases } = await createSessionClient();

        const stores = await databases.listDocuments(
            DATABASE_ID,
            PHYSICAL_STORE_ID,
            [
                Query.equal("owner", ownerId)
            ]
        );

        return stores;
    } catch (error) {
        console.log("getAllPshyicalStoresByOwnerId: ", error);
        return null;
    }
}

export const updatePhysicalStore = action
    .use(authMiddleware)
    .schema(UpdatePhysicalStoreFormSchema)
    .action(async ({ parsedInput: { storeId, storeLogo, oldFileId, ...values }, ctx }) => {
        const { databases, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases);

        try {
            const updatedFields = { ...values };

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
                    PHYSICAL_STORE_ID,
                    storeId,
                    updatedFields
                );

                return { success: `Store with id: ${updatedDocument.$id} has been updated successfully` };
            } else {
                return { success: "No changes detected." };
            }
        } catch (error) {
            console.log("updatePhysicalStore eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to update store" };
        }
    })