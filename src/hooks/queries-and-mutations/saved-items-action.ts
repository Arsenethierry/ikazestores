"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, SAVED_ITEMS_COLLECTION_ID } from "@/lib/env-config";
import { RemoveSavedItemSchema, SaveItemSchema } from "@/lib/schemas/products-schems";
import { SavedItemType } from "@/lib/types";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message;
    },
});

export const saveItem = action
    .use(authMiddleware)
    .schema(SaveItemSchema)
    .action(async ({ parsedInput: { productId }, ctx }) => {
        const { databases } = ctx;
        try {
            const existingSavedItem = await databases.listDocuments(
                DATABASE_ID,
                SAVED_ITEMS_COLLECTION_ID,
                [
                    Query.equal("userId", ctx.user.$id),
                    Query.equal("productId", productId)
                ]
            );

            if (existingSavedItem.total > 0) {
                return { error: "Item already saved" };
            }

            await databases.createDocument(
                DATABASE_ID,
                SAVED_ITEMS_COLLECTION_ID,
                ID.unique(),
                {
                    userId: ctx.user.$id,
                    productId: productId,
                }
            );
            revalidatePath("/saved-items");
            return { success: "Item saved successfully" };
        } catch (error) {
            console.error("saveItem error:", error);
            return { error: error instanceof Error ? error.message : "Failed to save item" };
        }
    });

export const removeSavedItem = action
    .use(authMiddleware)
    .schema(RemoveSavedItemSchema)
    .action(async ({ parsedInput: { savedItemId }, ctx }) => {
        const { databases } = ctx;
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                SAVED_ITEMS_COLLECTION_ID,
                savedItemId
            );

            revalidatePath("/saved-items");
            return { success: "Item removed successfully" };
        } catch (error) {
            console.error("removeSavedItem error:", error);
            return { error: error instanceof Error ? error.message : "Failed to remove saved item" };
        }
    });

export const getUserSavedItems = async (userId: string) => {
    try {
        const { databases } = await createSessionClient();
        const savedItems = await databases.listDocuments<SavedItemType>(
            DATABASE_ID,
            SAVED_ITEMS_COLLECTION_ID,
            [
                Query.equal("userId", userId),
                Query.orderDesc("$createdAt")
            ]
        );

        return savedItems;
    } catch (error) {
        console.error("getUserSavedItems error:", error);
        return {
            documents: [],
            total: 0,
            error: error instanceof Error ? error.message : "Failed to get saved items"
        };
    }
};

export const isItemSaved = async (userId: string, productId: string) => {
    try {
        const { databases } = await createSessionClient();

        const savedItem = await databases.listDocuments(
            DATABASE_ID,
            SAVED_ITEMS_COLLECTION_ID,
            [
                Query.equal("userId", userId),
                Query.equal("productId", productId)
            ]
        );

        return {
            isSaved: savedItem.total > 0,
            savedItemId: savedItem.total > 0 ? savedItem.documents[0].$id : null
        }
    } catch (error) {
        console.error("isItemSaved error:", error);
        return {
            isSaved: false,
            savedItemId: null
        };
    }
}