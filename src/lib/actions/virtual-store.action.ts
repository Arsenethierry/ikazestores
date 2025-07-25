"use server";

import { Query } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { DATABASE_ID, VIRTUAL_PRODUCT_ID, VIRTUAL_STORE_ID } from "../env-config";
import { createVirtualStoreFormSchema } from "../schemas/stores-schema";
import { VirtualStore } from "../models/virtual-store";
import { CreateVirtualStoreTypes, UpdateVirtualStoreTypes, VirtualStoreTypes } from "../types";
import { getAuthState } from "../user-permission";
import { revalidatePath } from "next/cache";
import { PaginationResult } from "../core/database";

const virtualStore = new VirtualStore();

export async function createVirtualStoreAction(formData: CreateVirtualStoreTypes) {
    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }
        const validationResult = createVirtualStoreFormSchema.safeParse(formData);
        if (!validationResult.success) {
            return {
                error: "Validation failed",
                details: validationResult.error.flatten().fieldErrors
            }
        };

        const newStore = await virtualStore.create(validationResult.data as CreateVirtualStoreTypes, user.$id);

        revalidatePath("/stores");
        revalidatePath("/dashboard/stores");

        return {
            success: "Store created successfully",
            storeId: newStore.$id
        };
    } catch (error) {
        console.error("Create virtual store action error:", error);
        return {
            error: error instanceof Error ? error.message : "Failed to create virtual store"
        };
    }
}

export async function updateVirtualStore(
    storeId: string,
    formData: Partial<UpdateVirtualStoreTypes>
) {
    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }

        const updatedStore = await virtualStore.updateVirtualStore(
            storeId,
            formData,
        );
        revalidatePath(`/dashboard/stores/${storeId}`);
        
        return {
            success: "Store updated successfully",
            data: updatedStore
        };
    } catch (error) {
        console.error("Update virtual store action error:", error);
        return {
            error: error instanceof Error ? error.message : "Failed to update virtual store"
        };
    }
}

export async function deleteVirtualStore(storeId: string) {
    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }

        await virtualStore.deleteVirtualStore(storeId);

        revalidatePath("/stores");
        revalidatePath("/dashboard/stores");
        revalidatePath(`/dashboard/stores/${storeId}`);
        return {
            success: "Store deleted successfully"
        };
    } catch (error) {
        console.error("Delete virtual store action error:", error);
        return {
            error: error instanceof Error ? error.message : "Failed to delete virtual store"
        };
    }
}

export const getVirtualStoreByDomain = async (domain: string) => {
    try {
        return await virtualStore.findBySubdomain(domain)
    } catch (error) {
        console.error("getVirtualStoreByDomain error:", error);
        throw error
    }
}

export const getVirtualStoreById = async (storeId: string) => {
    try {
        if (!storeId || typeof storeId !== 'string') {
            console.log("getVirtualStoreById error: Store ID is required and must be a string");
            return null;
        }

        const store = await virtualStore.findById(storeId, { cache: { ttl: 0 } });

        if (!store) {
            console.log("getVirtualStoreById error: Store not found");
            return null;
        }

        return store;
    } catch (error) {
        console.log("getVirtualStoreById error: ", error);
        return null;
    }
}

export const getAllVirtualStoresByOwnerId = async (ownerId: string,): Promise<PaginationResult<VirtualStoreTypes> | null> => {
    try {
        if (!ownerId || typeof ownerId !== 'string') {
            console.log("getAllVirtualStoresByOwnerId error: User ID is required and must be a string");
            return null;
        }

        const result = await virtualStore.findByOwner(ownerId, {});

        return result;
    } catch (error) {
        console.log("getAllVirtualStoresByOwnerId: ", error);
        return null;
    }
}

export const getAllVirtualStores = async ({ withProducts }: { withProducts: boolean }) => {
    try {
        const { databases } = await createSessionClient();
        const allVirtualStores = await databases.listDocuments<VirtualStoreTypes>(
            DATABASE_ID,
            VIRTUAL_STORE_ID,
            [
                Query.limit(5)
            ]
        );

        if (!withProducts) {
            return allVirtualStores;
        }

        const storesWithProducts = await Promise.all(
            allVirtualStores.documents.map(async (store) => {
                let vitualProducts: VirtualStoreTypes[] = [];

                if (store.virtualProductsIds && store.virtualProductsIds.length > 0) {
                    try {
                        const products = await databases.listDocuments<VirtualStoreTypes>(
                            DATABASE_ID,
                            VIRTUAL_PRODUCT_ID,
                            [
                                Query.equal('$id', store.virtualProductsIds),
                                Query.equal('virtualStoreId', store.$id)
                            ]
                        );
                        vitualProducts = products.documents;
                    } catch (productError) {
                        console.error(`Error fetching products for store ${store.$id}:`, productError);
                    }
                }

                return {
                    ...store,
                    vitualProducts
                }
            })
        );

        return {
            ...allVirtualStores,
            documents: storesWithProducts
        };
    } catch (error) {
        throw error
    }
}