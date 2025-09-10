import { ID, Query } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { BaseModel, QueryFilter } from "../core/database";
import {
  DATABASE_ID,
  PRODUCTS_COLLECTION_GROUPS_ID,
  PRODUCTS_COLLECTIONS_COLLECTION_ID,
} from "../env-config";
import { CollectionGroupsTypes } from "../types";
import { ProductCollections } from "../types/appwrite/appwrite";
import { ProductsStorageService } from "./storage-models";
import { AffiliateProductModel } from "./AffliateProductModel";

export class ProductCollection extends BaseModel<ProductCollections> {
  constructor() {
    super(PRODUCTS_COLLECTIONS_COLLECTION_ID);
  }

  private get storageService() {
    return new ProductsStorageService();
  }

  private get affiliateProductModel() {
    return new AffiliateProductModel();
  }

  async findByStoreId(
    storeId: string | null,
    options: { limit?: number; featured?: boolean } = {}
  ) {
    const { limit = 10, featured = false } = options;

    const filters = [];

    if (storeId) {
      filters.push({
        field: "storeId",
        operator: "equal" as const,
        value: storeId,
      });
    } else {
      filters.push({
        field: "storeId",
        operator: "isNull" as const,
      });
    }

    if (featured) {
      filters.push({
        field: "featured",
        operator: "equal" as const,
        value: true,
      });
    }

    const result = await this.findMany({
      filters,
      limit,
      orderBy: "$createdAt",
      orderType: "desc",
    });

    if (result.total === 0 && featured && storeId) {
      const fallbackFilters = [
        {
          field: "storeId",
          operator: "equal" as const,
          value: storeId,
        },
      ];

      const fallbackResult = await this.findMany({
        filters: fallbackFilters,
        limit,
        orderBy: "$createdAt",
        orderType: "desc",
      });

      return {
        collections: fallbackResult.documents,
        total: fallbackResult.total,
      };
    }

    return {
      collections: result.documents,
      total: result.total,
    };
  }

  async getAll(
    options: {
      limit?: number;
      offset?: number;
      search?: string;
      featured?: boolean;
      storeId?: string;
    } = {}
  ) {
    const { featured, search, storeId, ...queryOptions } = options;

    const filters = [];

    if (featured) {
      filters.push({
        field: "featured",
        operator: "equal" as const,
        value: true,
      });
    }

    if (storeId) {
      filters.push({
        field: "storeId",
        operator: "equal" as const,
        value: storeId,
      });
    }

    if (search) {
      filters.push({
        field: "collectionName",
        operator: "contains" as const,
        value: search,
      });
    }

    const result = await this.findMany({
      ...queryOptions,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });

    return {
      collections: result.documents,
      total: result.total,
    };
  }

  async getCollectionWithGroups(collectionId: string) {
    try {
      const collection = await this.findById(collectionId, {
        cache: { ttl: 0 },
      });
      if (!collection) return null;

      const { databases } = await createSessionClient();
      const groups = await databases.listDocuments<CollectionGroupsTypes>(
        DATABASE_ID,
        PRODUCTS_COLLECTION_GROUPS_ID,
        [
          Query.equal("collectionId", collectionId),
          Query.orderAsc("displayOrder"),
        ]
      );

      return {
        ...collection,
        groupsData: groups.documents,
      };
    } catch (error) {
      console.warn("getCollectionWithGroups error:", error);
      return null;
    }
  }

  async getCollectionProducts(
    collectionId: string,
    groupId?: string | null,
    page = 1,
    limit = 10
  ) {
    try {
      const { databases } = await createSessionClient();
      let productsIds: string[] = [];
      if (groupId) {
        const group = await databases.getDocument<CollectionGroupsTypes>(
          DATABASE_ID,
          PRODUCTS_COLLECTION_GROUPS_ID,
          groupId
        );
        productsIds = group.productsIds || [];
      } else {
        const collection = await this.findById(collectionId, {
          cache: { ttl: 0 },
        });
        if (!collection) {
          return { documents: [], total: 0, totalPages: 0 };
        }
        productsIds = collection.productsIds || [];
      }

      if (productsIds.length === 0) {
        return { documents: [], total: 0, totalPages: 0 };
      }

      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, productsIds.length);
      const paginatedProductIds = productsIds.slice(startIndex, endIndex);

      if (paginatedProductIds.length > 0) {
        const filters: QueryFilter[] = [
          { field: "$id", operator: "equal", value: paginatedProductIds },
        ];
        const products = await this.affiliateProductModel.findMany({
          filters,
          limit,
        });

        return {
          documents: products.documents,
          total: productsIds.length,
          totalPages: Math.ceil(productsIds.length / limit),
        };
      }

      return {
        documents: [],
        total: productsIds.length,
        totalPages: Math.ceil(productsIds.length / limit),
      };
    } catch (error) {
      console.log("getCollectionProducts error:", error);
      return null;
    }
  }

  async saveCollectionGroups(collectionId: string, groups: any[]) {
    try {
      const { databases } = await createSessionClient();
      const processedGroupIds = [];

      for (const group of groups) {
        const groupId = group.id;
        let imageUrl = group.groupImage;
        let imageId = null;

        const isNewGroup = groupId.startsWith("temp-");

        if (group.groupImage instanceof File) {
          const uploadedFile = await this.storageService.uploadFile(
            group.groupImage
          );
          imageId = uploadedFile.$id;
          imageUrl = await this.storageService.getFileUrl(uploadedFile.$id);
        }

        if (isNewGroup) {
          const newGroup = await databases.createDocument(
            DATABASE_ID,
            PRODUCTS_COLLECTION_GROUPS_ID,
            ID.unique(),
            {
              groupImageUrl: imageUrl,
              groupImageId: imageId,
              groupName: group.groupName,
              displayOrder: group.displayOrder,
              collectionId: collectionId,
            }
          );
          processedGroupIds.push(newGroup.$id);
        } else {
          await databases.updateDocument(
            DATABASE_ID,
            PRODUCTS_COLLECTION_GROUPS_ID,
            groupId,
            {
              groupName: group.groupName,
              displayOrder: group.displayOrder,
              ...(group.groupImage instanceof File
                ? {
                    groupImageUrl: imageUrl,
                    groupImageId: imageId,
                  }
                : {}),
            }
          );
          processedGroupIds.push(groupId);
        }
      }

      await databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTIONS_COLLECTION_ID,
        collectionId,
        {
          groups: processedGroupIds,
        }
      );

      return { success: true };
    } catch (error) {
      console.log("saveCollectionGroups error: ", error);
      throw error;
    }
  }

  async findByCreatedBy(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      featured?: boolean;
    } = {}
  ) {
    const { featured, ...queryOptions } = options;

    const filters = [
      {
        field: "createdBy",
        operator: "equal" as const,
        value: userId as string | boolean,
      },
    ];

    if (featured !== undefined) {
      filters.push({
        field: "featured",
        operator: "equal" as const,
        value: featured,
      });
    }

    return this.findMany({
      ...queryOptions,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });
  }

  async getFeaturedCollections(storeId?: string, limit: number = 10) {
    const filters = [
      {
        field: "featured",
        operator: "equal" as const,
        value: true as boolean | string,
      },
    ];

    if (storeId) {
      filters.push({
        field: "storeId",
        operator: "equal" as const,
        value: storeId,
      });
    }

    return this.findMany({
      filters,
      limit,
      orderBy: "$createdAt",
      orderType: "desc",
    });
  }

  async addProductToCollection(collectionId: string, productId: string) {
    const collection = await this.findById(collectionId, { cache: { ttl: 0 } });
    if (!collection) {
      throw new Error("Collection not found");
    }

    const currentProductIds = collection.productsIds || [];
    if (currentProductIds.includes(productId)) {
      throw new Error("Product already in collection");
    }

    const updatedProductIds = [...currentProductIds, productId];
    return this.update(collectionId, {
      ...collection,
      productsIds: updatedProductIds,
    } as ProductCollections);
  }

  async removeProductFromCollectionById(
    collectionId: string,
    productId: string
  ) {
    const collection = await this.findById(collectionId, { cache: { ttl: 0 } });
    if (!collection) {
      throw new Error("Collection not found");
    }

    const currentProductIds = collection.productsIds || [];
    const updatedProductIds = currentProductIds.filter(
      (id) => id !== productId
    );

    return this.update(collectionId, {
      ...collection,
      productsIds: updatedProductIds,
    } as ProductCollections);
  }

  async updateCollectionGroup(
    groupId: string,
    data: {
      groupName: string;
      displayOrder: number;
      groupImage?: File | string;
      oldImageId?: string;
    }
  ) {
    try {
      const { databases } = await createSessionClient();
      let imageUrl = data.groupImage;
      let imageId = data.oldImageId;

      if (data.groupImage instanceof File) {
        if (data.oldImageId) {
          await this.storageService.deleteFile(data.oldImageId);
        }
        const uploadedFile = await this.storageService.uploadFile(
          data.groupImage
        );
        imageId = uploadedFile.$id;
        imageUrl = await this.storageService.getFileUrl(
          uploadedFile.$id,
          "view"
        );
      }

      await databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_GROUPS_ID,
        groupId,
        {
          groupName: data.groupName,
          displayOrder: data.displayOrder,
          ...(data.groupImage instanceof File
            ? {
                groupImageUrl: imageUrl,
                groupImageId: imageId,
              }
            : {}),
        }
      );

      return { success: true };
    } catch (error) {
      console.log("updateCollectionGroup error: ", error);
      throw error;
    }
  }

  async addProductsToCollection(
    collectionId: string,
    productsIds: string[],
    groupId?: string | null
  ) {
    try {
      const { databases } = await createSessionClient();

      const collection = await databases.getDocument<ProductCollections>(
        DATABASE_ID,
        PRODUCTS_COLLECTIONS_COLLECTION_ID,
        collectionId
      );

      if (collection.type === "grouped") {
        if (!groupId) {
          throw new Error("Group not selected, group ID is required");
        }

        await databases.updateDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTION_GROUPS_ID,
          groupId,
          {
            productsIds,
          }
        );
      } else if (collection.type === "simple") {
        await databases.updateDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTIONS_COLLECTION_ID,
          collectionId,
          {
            productsIds,
          }
        );
      } else {
        throw new Error("Invalid collection type");
      }

      return { success: true };
    } catch (error) {
      console.log("addProductsToCollection error: ", error);
      throw error;
    }
  }

  async removeProductFromCollection(
    collectionId: string,
    productId: string,
    groupId?: string
  ) {
    try {
      const { databases } = await createSessionClient();

      const collection = await databases.getDocument<ProductCollections>(
        DATABASE_ID,
        PRODUCTS_COLLECTIONS_COLLECTION_ID,
        collectionId
      );

      if (collection.type === "grouped" && groupId) {
        const group = await databases.getDocument<CollectionGroupsTypes>(
          DATABASE_ID,
          PRODUCTS_COLLECTION_GROUPS_ID,
          groupId
        );

        const updatedProductIds = group.productsIds?.filter(
          (id: string) => id !== productId
        );

        await databases.updateDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTION_GROUPS_ID,
          groupId,
          {
            productsIds: updatedProductIds,
          }
        );
      } else if (collection.type === "simple" && collection?.productsIds) {
        const updatedProductIds = collection.productsIds.filter(
          (id: string) => id !== productId
        );

        await databases.updateDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTIONS_COLLECTION_ID,
          collectionId,
          {
            productsIds: updatedProductIds,
          }
        );
      } else {
        throw new Error("Invalid collection type or missing group ID");
      }

      return { success: true };
    } catch (error) {
      console.log("removeProductFromCollection error: ", error);
      throw error;
    }
  }

  async addGroupToCollection(collectionId: string, groupId: string) {
    const collection = await this.findById(collectionId, { cache: { ttl: 0 } });
    if (!collection) {
      throw new Error("Collection not found");
    }
    const currentGroups = collection.groups || [];
    if (currentGroups.includes(groupId)) {
      throw new Error("Group already in collection");
    }
    const updatedGroups = [...currentGroups, groupId];
    return this.update(collectionId, {
      ...collection,
      groups: updatedGroups,
    } as ProductCollections);
  }

  async removeGroupFromCollection(collectionId: string, groupId: string) {
    const collection = await this.findById(collectionId, { cache: { ttl: 0 } });
    if (!collection) {
      throw new Error("Collection not found");
    }

    const currentGroups = collection.groups || [];
    const updatedGroups = currentGroups.filter((id) => id !== groupId);

    return this.update(collectionId, {
      ...collection,
      groups: updatedGroups,
    } as ProductCollections);
  }

  async deleteCollectionGroup(
    collectionId: string,
    groupId: string,
    imageId?: string | null
  ) {
    try {
      const { databases } = await createSessionClient();

      const collection = await databases.getDocument<ProductCollections>(
        DATABASE_ID,
        PRODUCTS_COLLECTIONS_COLLECTION_ID,
        collectionId
      );

      const updatedGroups =
        collection?.groups &&
        collection?.groups.filter((id: string) => id !== groupId);

      await databases.deleteDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_GROUPS_ID,
        groupId
      );

      if (imageId) {
        await this.storageService.deleteFile(imageId);
      }

      await databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTIONS_COLLECTION_ID,
        collectionId,
        {
          groups: updatedGroups,
        }
      );

      return { success: true };
    } catch (error) {
      console.log("deleteCollectionGroup error: ", error);
      throw error;
    }
  }
}
