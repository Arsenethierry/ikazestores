import { ID, Permission, Role } from "node-appwrite";
import { BaseModel, QueryFilter } from "../core/database";
import { DATABASE_ID, PHYSICAL_STORE_ID, STORE_BUCKET_ID } from "../env-config";
import { CreatePhysicalStoreTypes, PhysicalStoreTypes, UpdateVirtualStoreTypes } from "../types";
import { AppwriteRollback } from "../actions/rollback";
import { createAdminClient, createSessionClient } from "../appwrite";
import { getUserLocale } from "../actions/auth.action";
import { UserRole } from "../constants";
import { updateUserLabels } from "../actions/user-labels";
import { getAuthState } from "../user-permission";
import { StoreStorageService } from "./storage-models";

export interface PhysicalStoreFilters {
    owner?: string;
    country?: string;
    currency?: string;
    storeName?: string;
    latitude?: { min?: number; max?: number };
    longitude?: { min?: number; max?: number };
}

export class PhysicalStoreModel extends BaseModel<PhysicalStoreTypes> {
    private storageService: StoreStorageService;

    constructor() {
        super(PHYSICAL_STORE_ID);
        this.storageService = new StoreStorageService();
    }

    async findByOwner(ownerId: string) {
        const filters: QueryFilter[] = [
            { field: "owner", operator: "equal", value: ownerId }
        ];

        return this.findMany({
            filters,
            orderBy: "$createdAt",
            orderType: "desc",
        });
    }

    async findByCountry(country: string, options: { limit?: number; offset?: number } = {}) {
        const filters: QueryFilter[] = [
            { field: "country", operator: "equal", value: country }
        ];

        return this.findMany({
            filters,
            limit: options.limit,
            offset: options.offset,
            orderBy: "$createdAt",
            orderType: "desc"
        });
    }

    async searchByName(searchTerm: string, options: { limit?: number; offset?: number } = {}) {
        const filters: QueryFilter[] = [
            { field: "storeName", operator: "contains", value: searchTerm }
        ];

        return this.findMany({
            filters,
            limit: options.limit,
            offset: options.offset,
            orderBy: "storeName",
            orderType: "asc"
        });
    }

    async findNearBy(
        latitude: number,
        longitude: number,
        radiusKm: number = 10,
        options: { limit?: number; offset?: number } = {}
    ) {
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

        const filters: QueryFilter[] = [
            { field: "latitude", operator: "greaterThanEqual", value: latitude - latDelta },
            { field: "latitude", operator: "lessThanEqual", value: latitude + latDelta },
            { field: "longitude", operator: "greaterThanEqual", value: longitude - lngDelta },
            { field: "longitude", operator: "lessThanEqual", value: longitude + lngDelta }
        ];

        return this.findMany({
            filters,
            limit: options.limit,
            offset: options.offset,
            orderBy: "$createdAt",
            orderType: "desc"
        });
    }

    async findByFilters(filterOptions: PhysicalStoreFilters, options: { limit?: number; offset?: number } = {}) {
        const filters: QueryFilter[] = [];

        if (filterOptions.owner) {
            filters.push({ field: "owner", operator: "equal", value: filterOptions.owner });
        }

        if (filterOptions.country) {
            filters.push({ field: "country", operator: "equal", value: filterOptions.country });
        }

        if (filterOptions.currency) {
            filters.push({ field: "currency", operator: "equal", value: filterOptions.currency });
        }

        if (filterOptions.storeName) {
            filters.push({ field: "storeName", operator: "contains", value: filterOptions.storeName });
        }

        if (filterOptions.latitude?.min !== undefined) {
            filters.push({ field: "latitude", operator: "greaterThanEqual", value: filterOptions.latitude.min });
        }

        if (filterOptions.latitude?.max !== undefined) {
            filters.push({ field: "latitude", operator: "lessThanEqual", value: filterOptions.latitude.max });
        }

        if (filterOptions.longitude?.min !== undefined) {
            filters.push({ field: "longitude", operator: "greaterThanEqual", value: filterOptions.longitude.min });
        }

        if (filterOptions.longitude?.max !== undefined) {
            filters.push({ field: "longitude", operator: "lessThanEqual", value: filterOptions.longitude.max });
        }

        return this.findMany({
            filters,
            limit: options.limit,
            offset: options.offset,
            orderBy: "$createdAt",
            orderType: "desc"
        });
    }

    async createPhysicalStore(data: CreatePhysicalStoreTypes): Promise<PhysicalStoreTypes> {
        const { storage, teams } = await createSessionClient();
        const { databases } = await createAdminClient();
        const rollback = new AppwriteRollback(storage, databases, teams);

        try {
            const {
                storeLogo,
                storeName,
                address,
                description,
                latitude,
                longitude,
                storeBio,
                country,
                currency
            } = data;

            const { user } = await getAuthState();

            if (!user) {
                throw new Error("Authentication required")
            }

            const storeId = ID.unique();

            let storeLogoData: { fileId?: string; url?: string } = {};
            if (storeLogo) {
                const logoResult = await this.storageService.uploadFile(storeLogo);
                await rollback.trackFile(STORE_BUCKET_ID, logoResult.$id);

                storeLogoData = {
                    fileId: logoResult.$id,
                    url: await this.storageService.getFileUrl(logoResult.$id, 'view'),
                };
            }
            const newStoreTeam = await teams.create(
                storeId,
                storeName + "Team"
            );
            await rollback.trackTeam(newStoreTeam.$id);

            const storeData = {
                storeName,
                description,
                bio: storeBio,
                owner: user.$id,
                currency,
                latitude,
                longitude,
                address,
                country,
                storeLogoId: storeLogoData.fileId,
                storeLogoUrl: storeLogoData.url,
                createdFrom: (await getUserLocale())?.country
            };

            const newPhysicalStore = await databases.createDocument<PhysicalStoreTypes>(
                DATABASE_ID,
                PHYSICAL_STORE_ID,
                storeId,
                storeData,
                [
                    Permission.delete(Role.team(newStoreTeam.$id, "owner")),
                    Permission.delete(Role.label(UserRole.SYS_ADMIN)),
                    Permission.update(Role.team(newStoreTeam.$id, "owner")),
                    Permission.update(Role.team(newStoreTeam.$id, "admin")),
                    Permission.read(Role.any())
                ]
            );
            await rollback.trackDocument(PHYSICAL_STORE_ID, newPhysicalStore.$id);
            await updateUserLabels(user.$id, [UserRole.PHYSICAL_STORE_OWNER]);

            this.invalidateCache(['findMany', 'findByOwner', 'findBySubdomain']);

            return newPhysicalStore
        } catch (error) {
            console.log("create physical store error: ", error);
            await rollback.rollback();
            throw error instanceof Error ? error : new Error("Failed to create physical store");
        }
    }

    async deletePhysicalStore(physicalStoreId: string, bannerIds?: string[]) {
        try {
            if (bannerIds) {
                await this.storageService.deleteMultipleFiles(bannerIds);
            }
            await this.delete(physicalStoreId)
        } catch (error) {
            throw error instanceof Error ? error : new Error("Failed to delete physical store");
        }
    }

    async updatePhysicalStore(
        { storeId, storeLogo, oldFileId, ...values }: Partial<UpdateVirtualStoreTypes>
    ) {
        const updatedFields = { ...values };
        try {
            const { user } = await getAuthState();
            if (!user) {
                throw new Error("Authentication required");
            }

            if (!storeId) {
                throw new Error("StoreId is required");
            }

            if (storeLogo instanceof File) {
                if (oldFileId) {
                    await this.storageService.deleteFile(oldFileId)
                }

                const storeLogoUploaded = await this.storageService.uploadFile(storeLogo);
                updatedFields.storeLogoUrl = await this.storageService.getFileUrl(storeLogoUploaded.$id, 'view');
                updatedFields.storeLogoId = storeLogoUploaded.$id;
            }

            if (Object.keys(updatedFields).length > 0) {
                const updatedDocument = await this.update(storeId, updatedFields);
                return {
                    success: `Store with id: ${updatedDocument.$id} has been updated successfully`,
                    data: updatedDocument
                };
            } else {
                return { success: "No changes detected." };
            }
        } catch (error) {
            console.log("updatePhysicalStore error: ", error)
            throw error
        }
    }
}