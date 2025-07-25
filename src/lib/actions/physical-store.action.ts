"use server";

import { CreatePhysicalStoreTypes, UpdateVirtualStoreTypes } from "../types";
import { createPhysicalStoreFormSchema, updatePhysicalStoreFormSchema } from "../schemas/stores-schema";
import { PhysicalStoreFilters, PhysicalStoreModel } from "../models/physical-store-model";
import { revalidatePath } from "next/cache";

const physicalStore = new PhysicalStoreModel();

export async function createPhysicalStoreAction(formData: CreatePhysicalStoreTypes) {
    try {
        const validationResult = createPhysicalStoreFormSchema.safeParse(formData);
        if (!validationResult.success) {
            return {
                error: "Validation failed",
                details: validationResult.error.flatten().fieldErrors
            }
        };

        const newStore = await physicalStore.createPhysicalStore(validationResult.data as CreatePhysicalStoreTypes);
        return {
            success: "Store created successfully",
            storeId: newStore.$id
        }
    } catch (error) {
        console.error("Create physical store action error:", error);
        return {
            error: error instanceof Error ? error.message : "Failed to create physical store"
        };
    }
}

export const updatePhysicalStoreAction = async (formData: UpdateVirtualStoreTypes) => {
    try {
        const validationResult = updatePhysicalStoreFormSchema.safeParse(formData);
        if (!validationResult.success) {
            return {
                error: "Validation failed",
                details: validationResult.error.flatten().fieldErrors
            }
        };
        const updatedStoreRes = await physicalStore.updatePhysicalStore(validationResult.data as UpdateVirtualStoreTypes);
        revalidatePath('/admin/stores/[storeId]')
        return updatedStoreRes
    } catch (error) {
        console.log("updatePhysicalStore eror: ", error);
        return { error: error instanceof Error ? error.message : "Failed to update store" };
    }
}

export const deletePhysicalStore = async (physicalStoreId: string, bannerIds?: string[]) => {
    try {
        await physicalStore.deletePhysicalStore(physicalStoreId, bannerIds);
        return {
            success: "Store deleted successfully"
        }
    } catch (error) {
        console.log(`error deleting physical store: ${error}`)
        return {
            error: error instanceof Error ? error.message : "Failed to delete physical store"
        }
    }
}

export const getPhysicalStoreById = async (storeId: string) => {
    try {
        if (!storeId || typeof storeId !== 'string') {
            console.log("getPhysicalStoreById error: Store ID is required and must be a string");
            return null;
        }

        const store = await physicalStore.findById(storeId, { cache: { ttl: 0 } });
        if (!store) {
            console.log("getVirtualStoreById error: Store not found");
            return null;
        }

        return store;
    } catch (error) {
        console.log("getPhysicalStoreById: ", error);
        return null;
    }
}

export const getAllPshyicalStoresByOwnerId = async (ownerId: string) => {
    try {
        const stores = await physicalStore.findByOwner(ownerId);
        return stores;
    } catch (error) {
        console.log("getAllPshyicalStoresByOwnerId: ", error);
        return null;
    }
}

export const searchPhysicalByName = async (searchTerm: string, options: { limit?: number; offset?: number } = {}) => {
    try {
        const searchResults = await physicalStore.searchByName(searchTerm, options);
        return searchResults
    } catch (error) {
        console.log(error)
        return {
            documents: [],
            total: 0,
        }
    }
}

export const getNearbyPhysicalStoresAction = async (
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    options?: { limit?: number; offset?: number }
) => {
    try {
        const storesRes = await physicalStore.findNearBy(
            latitude,
            longitude,
            radiusKm,
            options
        );
        return storesRes
    } catch (error) {
        console.log(error)
        return {
            documents: [],
            total: 0,
        }
    }
}


export const getPaginatedPhysicalStores = async (
    filters: PhysicalStoreFilters,
    options?: { limit?: number; offset?: number }
) => {
    try {
        const stores = await physicalStore.findByFilters(filters, options);
        return stores
    } catch (error) {
        console.log(error)
        return {
            documents: [],
            total: 0,
            limit: 0,
            offset: 0,
            hasMore: false
        }
    }
}