import { ID, Permission, Role } from "node-appwrite";
import {
  BaseModel,
  CacheOptions,
  PaginationResult,
  QueryFilter,
  QueryOptions,
} from "../core/database";
import { DATABASE_ID, STORE_BUCKET_ID, VIRTUAL_STORE_ID } from "../env-config";
import { createAdminClient, createSessionClient } from "../appwrite";
import { AppwriteRollback } from "../actions/rollback";
import { StoreRole, TeamNamesPatterns } from "../constants";
import { getUserLocale } from "../actions/auth.action";
import {
  CreateVirtualStoreTypes,
  UpdateVirtualStoreTypes,
  VirtualStoreTypes,
} from "../types";
import { StoreStorageService } from "./storage-models";
export class VirtualStore extends BaseModel<VirtualStoreTypes> {
  constructor() {
    super(VIRTUAL_STORE_ID);
  }

  private get storageService() {
    return new StoreStorageService();
  }

  async findBySubdomain(
    subdomain: string,
    options: { cache?: CacheOptions } = {}
  ): Promise<VirtualStoreTypes | null> {
    try {
      if (options.cache) {
        const cached = this.getFromCache(`findBySubdomain:${subdomain}`);
        if (cached) return cached;
      }

      const result = await this.findOne([
        { field: "subDomain", operator: "equal", value: subdomain },
      ]);

      if (options.cache && result) {
        this.setCache(`findBySubdomain:${subdomain}`, result, options.cache);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  async findByOwner(
    ownerId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<VirtualStoreTypes>> {
    const filters: QueryFilter[] = [
      { field: "owner", operator: "equal", value: ownerId },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async findByStoreType(
    storeType: "physicalStore" | "virtualStore",
    options: QueryOptions = {}
  ): Promise<PaginationResult<VirtualStoreTypes>> {
    const filters: QueryFilter[] = [
      { field: "storeType", operator: "equal", value: storeType },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async findByOperatingCountry(
    operatingCountry: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<VirtualStoreTypes>> {
    const filters: QueryFilter[] = [
      { field: "storeType", operator: "equal", value: operatingCountry },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async searchStores(
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<VirtualStoreTypes>> {
    const filters: QueryFilter[] = [
      { field: "storeName", operator: "contains", value: searchTerm },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async isSubdomainAvailable(subdomain: string): Promise<boolean> {
    const existingStore = await this.findBySubdomain(subdomain);
    return existingStore === null;
  }

  async addProductToStore(
    storeId: string,
    productId: string
  ): Promise<VirtualStoreTypes> {
    const store = await this.findById(storeId, {});
    if (!store) {
      throw new Error("Store not found");
    }

    const currentProducts = store.virtualProductsIds || [];
    if (currentProducts.includes(productId)) {
      return store;
    }

    const updatedProducts = [...currentProducts, productId];
    return this.update(storeId, { virtualProductsIds: updatedProducts });
  }

  async removeProductFromStore(
    storeId: string,
    productId: string
  ): Promise<VirtualStoreTypes> {
    const store = await this.findById(storeId, {});
    if (!store) {
      throw new Error("Store not found");
    }

    const currentProducts = store.virtualProductsIds || [];
    const updatedProducts = currentProducts.filter((id) => id !== productId);

    return this.update(storeId, { virtualProductsIds: updatedProducts });
  }

  async create(
    data: CreateVirtualStoreTypes,
    userId: string
  ): Promise<VirtualStoreTypes> {
    const { storage, teams } = await createSessionClient();
    const { databases } = await createAdminClient();
    const rollback = new AppwriteRollback(storage, databases, teams);

    try {
      const isAvailable = await this.isSubdomainAvailable(data.storeDomain);

      if (!isAvailable) {
        throw new Error(`Subdomain "${data.storeDomain}" is already taken`);
      }

      const bannerImagesUploaded = await Promise.all(
        data.storeBanner.map(async (file) => {
          const uploadedFile = await this.storageService.uploadFile(file);
          await rollback.trackFile(STORE_BUCKET_ID, uploadedFile.$id);

          return {
            id: uploadedFile.$id,
            name: uploadedFile.name,
            url: await this.storageService.getFileUrl(uploadedFile.$id, "view"),
          };
        }) || []
      );

      const storeLogoUploaded = await this.storageService.uploadFile(
        data.storeLogo
      );
      await rollback.trackFile(STORE_BUCKET_ID, storeLogoUploaded.$id);

      const storeId = ID.unique();
      const storeTeam = await teams.create(
        storeId,
        `${data.storeName} - ${storeId}`,
        [StoreRole.OWNER, StoreRole.ADMIN, StoreRole.STAFF]
      );
      await rollback.trackTeam(storeTeam.$id);

      const userLocale = await getUserLocale();

      const storeData = {
        storeName: data.storeName,
        owner: userId,
        bannerIds: bannerImagesUploaded.map((file) => file.id),
        bannerUrls: bannerImagesUploaded.map((file) => file.url),
        storeLogoId: storeLogoUploaded.$id,
        storeLogoUrl: await this.storageService.getFileUrl(
          storeLogoUploaded.$id,
          "view"
        ),
        storeType: "virtualStore" as const,
        subDomain: data.storeDomain,
        locale: userLocale?.country,
        desccription: data.desccription,
        storeBio: data.storeBio,
        virtualProductsIds: [],
        operatingCountry: data.operatingCountry,
        countryCurrency: data.countryCurrency,
      };

      const newVirtualStore = await databases.createDocument<VirtualStoreTypes>(
        DATABASE_ID,
        VIRTUAL_STORE_ID,
        storeTeam.$id,
        storeData,
        [
          Permission.read(Role.any()),
          Permission.update(Role.team(storeTeam.$id, "virtualStoreOwner")),
          Permission.delete(Role.team(storeTeam.$id, "virtualStoreOwner")),
          Permission.update(Role.team(storeTeam.$id, "admin")),
          Permission.update(Role.team("system_admins", "sysAdmin")),
          Permission.delete(Role.team("system_admins", "sysAdmin")),
        ]
      );
      await rollback.trackDocument(VIRTUAL_STORE_ID, newVirtualStore.$id);

      this.invalidateCache(["findMany", "findByOwner", "findBySubdomain"]);

      return newVirtualStore;
    } catch (error) {
      console.error("Create virtual store error:", error);
      await rollback.rollback();
      throw error instanceof Error
        ? error
        : new Error("Failed to create virtual store");
    }
  }

  async updateVirtualStore(
    storeId: string,
    data: Partial<UpdateVirtualStoreTypes>
  ): Promise<VirtualStoreTypes> {
    const { storage, teams, databases } = await createSessionClient();
    const rollback = new AppwriteRollback(storage, databases, teams);
    try {
      const existingStore = await this.findById(storeId, {});
      if (!existingStore) {
        throw new Error("Store not found");
      }

      const updateData: Partial<VirtualStoreTypes> = {};
      if (data.storeDomain && data.storeDomain !== existingStore.subDomain) {
        const isAvailable = await this.isSubdomainAvailable(data.storeDomain);
        if (!isAvailable) {
          throw new Error(`Subdomain "${data.storeDomain}" is already taken`);
        }
        updateData.subDomain = data.storeDomain;
      }

      if (data.storeBanner && data.storeBanner.length > 0) {
        if (existingStore.bannerIds && existingStore.bannerIds.length > 0) {
          await Promise.all(
            existingStore.bannerIds.map(async (bannerId) => {
              try {
                await this.storageService.deleteFile(bannerId);
              } catch (error) {
                console.warn(
                  `Failed to delete old banner image ${bannerId}:`,
                  error
                );
              }
            })
          );
        }

        const bannerImagesUploaded = await Promise.all(
          data.storeBanner.map(async (file) => {
            const uploadedFile = await this.storageService.uploadFile(file);
            await rollback.trackFile(STORE_BUCKET_ID, uploadedFile.$id);

            return {
              id: uploadedFile.$id,
              name: uploadedFile.name,
              url: await this.storageService.getFileUrl(
                uploadedFile.$id,
                "view"
              ),
            };
          })
        );

        updateData.bannerIds = bannerImagesUploaded.map((file) => file.id);
        updateData.bannerUrls = bannerImagesUploaded.map((file) => file.url);
      }

      if (data.storeLogo instanceof File) {
        if (existingStore.storeLogoId) {
          try {
            await this.storageService.deleteFile(existingStore.storeLogoId);
          } catch (error) {
            console.warn(
              `Failed to delete old store logo ${existingStore.storeLogoId}:`,
              error
            );
          }
        }

        const storeLogoUploaded = await this.storageService.uploadFile(
          data.storeLogo
        );
        await rollback.trackFile(STORE_BUCKET_ID, storeLogoUploaded.$id);

        updateData.storeLogoId = storeLogoUploaded.$id;
        updateData.storeLogoUrl = await this.storageService.getFileUrl(
          storeLogoUploaded.$id,
          "view"
        );
      }

      if (data.storeName) updateData.storeName = data.storeName;
      if (data.desccription !== undefined)
        updateData.desccription = data.desccription;
      if (data.storeBio !== undefined) updateData.storeBio = data.storeBio;

      const updatedStore = await this.update(storeId, updateData);

      this.clearCache();
      this.invalidateCache([
        "findMany",
        "findByOwner",
        "findBySubdomain",
        `findById:${storeId}`,
      ]);

      return updatedStore;
    } catch (error) {
      console.error("Update virtual store error:", error);
      await rollback.rollback();
      throw error instanceof Error
      ? error
        : new Error("Failed to update virtual store");
    }
  }

  async updateTemplate(
    storeId: string,
    templateId: string
  ): Promise<VirtualStoreTypes> {
    try {
      const updated = await this.update(storeId, { templateId });

      this.clearCache();
      this.clearCache();

      return updated;
    } catch (error) {
      console.error("Error updating store template:", error);
      throw error;
    }
  }

  async deleteVirtualStore(storeId: string): Promise<void> {
    const { teams, databases } = await createSessionClient();

    try {
      const store = await this.findById(storeId, {});
      if (!store) {
        throw new Error("Store not found");
      }

      if (store.bannerIds && store.bannerIds.length > 0) {
        await Promise.all(
          store.bannerIds.map(async (bannerId) => {
            try {
              await this.storageService.deleteFile(bannerId);
            } catch (error) {
              console.warn(`Failed to delete banner image ${bannerId}:`, error);
            }
          })
        );
      }

      if (store.storeLogoId) {
        try {
          await this.storageService.deleteFile(store.storeLogoId);
        } catch (error) {
          console.warn(
            `Failed to delete store logo ${store.storeLogoId}:`,
            error
          );
        }
      }

      await databases.deleteDocument(DATABASE_ID, VIRTUAL_STORE_ID, storeId);
      try {
        await teams.delete(storeId);
      } catch (error) {
        console.warn(`Failed to delete team ${storeId}:`, error);
      }
      this.invalidateCache([
        "findMany",
        "findByOwner",
        "findBySubdomain",
        `findById:${storeId}`,
      ]);
    } catch (error) {
      console.error("Delete virtual store error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to delete virtual store");
    }
  }
}
