"use server";

import { Query } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { DATABASE_ID, VIRTUAL_PRODUCT_ID, VIRTUAL_STORE_ID } from "../env-config";
import { createVirtualStoreFormSchema } from "../schemas/stores-schema";
import { VirtualStore } from "../models/virtual-store";
import { CreateVirtualStoreTypes, UpdateVirtualStoreTypes, VirtualProductTypes, VirtualStoreTypes } from "../types";
import { getAuthState } from "../user-permission";
import { revalidatePath } from "next/cache";
import { PaginationResult } from "../core/database";
import { getVirtualStoreProducts } from "./affiliate-product-actions";
import { getUserLocale } from "./auth.action";

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
        let storesResult: PaginationResult<VirtualStoreTypes>;
        const currentUserCountry = await await getUserLocale();

        if (currentUserCountry?.country) {
            storesResult = await virtualStore.findByOperatingCountries([currentUserCountry.country], {
                limit: 5,
                orderBy: "$createdAt",
                orderType: "desc"
            });
            if (storesResult.documents.length === 0) {
                storesResult = await virtualStore.findMany({
                    limit: 25,
                    orderBy: "$createdAt",
                    orderType: "desc"
                });
            }
        } else {
            storesResult = await virtualStore.findMany({
                limit: 25,
                orderBy: "$createdAt",
                orderType: "desc"
            });
        }

        if (!withProducts) {
            return storesResult;
        }

        const storesWithProducts = await Promise.all(
            storesResult.documents.map(async (store) => {
                let vitualProducts: VirtualProductTypes[] = [];

                try {
                    const products = await getVirtualStoreProducts(store.$id, { limit: 5 })
                    vitualProducts = products.documents;
                } catch (productError) {
                    console.error(`Error fetching products for store ${store.$id}:`, productError);
                }

                return {
                    ...store,
                    vitualProducts
                }
            })
        );

        return {
            ...storesResult,
            documents: storesWithProducts
        };
    } catch (error) {
        throw error
    }
}