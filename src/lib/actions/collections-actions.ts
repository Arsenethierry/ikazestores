"use server";

import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, PRODUCTS_COLLECTION_GROUPS_ID } from "@/lib/env-config";
import { ProductCollection } from "@/lib/models/product-collection";
import {
  AddProductToCollectionSchema,
  CollectionSchema,
  CreateCollectionSchemaType,
  DeleteCollectionGroupSchema,
  RemoveProductFromCollection,
  SaveCollectionGroupsSchema,
  UpdateCollectionGroupSchema,
  UpdateCollectionSchemaType,
} from "../schemas/product-collections";
import { CollectionGroupsTypes } from "@/lib/types";
import { Query } from "node-appwrite";
import { getAuthState } from "../user-permission";
import { revalidatePath } from "next/cache";
import { extractFileIdFromUrl } from "../utils";
import { ProductsStorageService } from "../models/storage-models";

const collectionsService = new ProductCollection();
const storageService = new ProductsStorageService();

export async function createNewCollectionAction(
  formData: CreateCollectionSchemaType
) {
  try {
    const { user: currentUser } = await getAuthState();
    if (!currentUser) {
      return { error: "Unauthorized" };
    }
    const validatedData = CollectionSchema.parse(formData);

    let bannerImageFileId: string | null = null;
    let bannerImageUrl: string | null = null;
    const heroImageFileId: string | null = null;
    const heroImageUrl: string | null = null;

    if (validatedData.bannerImage instanceof File) {
      const uploadedFile = await storageService.uploadFile(
        validatedData.bannerImage
      );
      bannerImageFileId = uploadedFile.$id;
      bannerImageUrl = await storageService.getFileUrl(
        uploadedFile.$id,
        "view"
      );
    }

    const collectionData = {
      collectionName: validatedData.collectionName,
      description: validatedData.description,
      type: validatedData.type,
      featured: validatedData.featured,
      storeId: validatedData.storeId,
      createdBy: currentUser.$id,
      bannerImageFileId,
      bannerImageUrl,
      heroTitle: validatedData.heroTitle,
      heroSubtitle: validatedData.heroSubtitle,
      heroDescription: validatedData.heroDescription,
      heroButtonText: validatedData.heroButtonText,
      heroImageFileId,
      heroImageUrl,
      productsIds: [],
      groups: [],
    };

    const collection = await collectionsService.create(
      collectionData,
      currentUser.$id
    );
    revalidatePath("/dashboard/collections");
    revalidatePath("/");

    return {
      success: true,
      data: collection,
      message: "Collection created successfully",
    };
  } catch (error) {
    console.error("Create collection error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to create collection",
    };
  }
}

export async function updateCollectionAction(data: UpdateCollectionSchemaType) {
  try {
    const { user: currentUser } = await getAuthState();
    if (!currentUser) {
      return { error: "Unauthorized" };
    }
    const { collectionId, ...updateData } = data;
    const existingCollection = await collectionsService.findById(collectionId, {
      cache: { ttl: 0 },
    });
    if (!existingCollection) {
      return { error: "Collection not found" };
    }

    const updatePayload: any = {};

    if (updateData.collectionName)
      updatePayload.collectionName = updateData.collectionName;
    if (updateData.description !== undefined)
      updatePayload.description = updateData.description;
    if (updateData.type) updatePayload.type = updateData.type;
    if (updateData.featured !== undefined)
      updatePayload.featured = updateData.featured;
    if (updateData.heroTitle !== undefined)
      updatePayload.heroTitle = updateData.heroTitle;
    if (updateData.heroSubtitle !== undefined)
      updatePayload.heroSubtitle = updateData.heroSubtitle;
    if (updateData.heroDescription !== undefined)
      updatePayload.heroDescription = updateData.heroDescription;
    if (updateData.heroButtonText !== undefined)
      updatePayload.heroButtonText = updateData.heroButtonText;

    if (updateData.bannerImage instanceof File) {
      if (updateData.oldBannerImageId) {
        await storageService.deleteFile(updateData.oldBannerImageId);
      }

      const uploadedFile = await storageService.uploadFile(
        updateData.bannerImage
      );
      updatePayload.bannerImageFileId = uploadedFile.$id;
      updatePayload.bannerImageUrl = await storageService.getFileUrl(
        uploadedFile.$id,
        "view"
      );
    }

    if (updateData.heroImage instanceof File) {
      const oldHeroImageId = existingCollection.heroImageUrl
        ? extractFileIdFromUrl(existingCollection.heroImageUrl)
        : null;
      if (oldHeroImageId) {
        await storageService.deleteFile(oldHeroImageId);
      }
      const uploadedHeroFile = await storageService.uploadFile(
        updateData.heroImage
      );
      updatePayload.heroImageUrl = await storageService.getFileUrl(
        uploadedHeroFile.$id,
        "view"
      );
    }

    const updatedCollection = await collectionsService.update(
      collectionId,
      updatePayload
    );
    revalidatePath("/dashboard/collections");
    revalidatePath("/");

    return {
      success: true,
      data: updatedCollection,
      message: "Collection updated successfully",
    };
  } catch (error) {
    console.error("Update collection error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to update collection",
    };
  }
}

export async function getAllCollections(
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    featured?: boolean;
    storeId?: string;
  } = {}
) {
  try {
    return await collectionsService.getAll(options);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch collection",
      data: [],
    };
  }
}

export async function deleteCollectionAction(collectionId: string) {
  try {
    const { user: currentUser } = await getAuthState();
    if (!currentUser) {
      return { error: "Unauthorized" };
    }

    const collection = await collectionsService.findById(collectionId, {
      cache: { ttl: 0 },
    });
    if (!collection) {
      return { error: "Collection not found" };
    }

    const filesToDelete = [];
    const oldHeroImageFileId = collection.heroImageUrl
      ? extractFileIdFromUrl(collection.heroImageUrl)
      : null;
    if (collection.bannerImageId) filesToDelete.push(collection.bannerImageId);
    if (oldHeroImageFileId) filesToDelete.push(oldHeroImageFileId);
    if (filesToDelete.length > 0) {
      await storageService.deleteMultipleFiles(filesToDelete);
    }

    await collectionsService.delete(collection.$id);

    revalidatePath("/dashboard/collections");
    revalidatePath("/");

    return {
      success: true,
      message: "Collection deleted successfully",
    };
  } catch (error) {
    console.error("Delete collection error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete collection",
    };
  }
}

export async function saveCollectionGroups(data: {
  collectionId: string;
  groups: Array<{
    id: string;
    groupName: string;
    displayOrder: number;
    groupImage: File | string;
  }>;
}) {
  try {
    const { user: currentUser } = await getAuthState();
    if (!currentUser) {
      return { error: "Unauthorized" };
    }

    const validatedData = SaveCollectionGroupsSchema.parse(data);
    await collectionsService.saveCollectionGroups(
      validatedData.collectionId,
      validatedData.groups
    );

    revalidatePath("/dashboard/collections");

    return { success: "Collection groups saved successfully" };
  } catch (error) {
    console.log("saveCollectionGroups error: ", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to save collection groups",
    };
  }
}

export async function deleteCollectionGroup(data: {
  collectionId: string;
  groupId: string;
  imageId?: string;
}) {
  try {
    const { user: currentUser } = await getAuthState();
    if (!currentUser) {
      return { error: "Unauthorized" };
    }

    const validatedData = DeleteCollectionGroupSchema.parse(data);
    await collectionsService.deleteCollectionGroup(
      validatedData.collectionId,
      validatedData.groupId,
      validatedData.imageId
    );

    revalidatePath("/dashboard/collections");

    return { success: "Collection group deleted successfully" };
  } catch (error) {
    console.log("deleteCollectionGroup error: ", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete collection group",
    };
  }
}

export async function updateCollectionGroup(data: {
  groupId: string;
  groupName: string;
  displayOrder: number;
  groupImage?: File | string;
  oldImageId?: string;
}) {
  try {
    const { user: currentUser } = await getAuthState();
    if (!currentUser) {
      return { error: "Unauthorized" };
    }

    const validatedData = UpdateCollectionGroupSchema.parse(data);
    await collectionsService.updateCollectionGroup(validatedData.groupId, {
      groupName: validatedData.groupName,
      displayOrder: validatedData.displayOrder,
      groupImage: validatedData.groupImage,
      oldImageId: validatedData.oldImageId,
    });

    revalidatePath("/dashboard/collections");

    return { success: "Collection group updated successfully" };
  } catch (error) {
    console.log("updateCollectionGroup error: ", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update collection group",
    };
  }
}

export async function addProductsToCollection(data: {
  collectionId: string;
  productsIds: string[];
  groupId?: string;
}) {
  try {
    const { user: currentUser } = await getAuthState();
    if (!currentUser) {
      return { error: "Unauthorized" };
    }

    const validatedData = AddProductToCollectionSchema.parse(data);
    await collectionsService.addProductsToCollection(
      validatedData.collectionId,
      validatedData.productsIds,
      validatedData.groupId
    );

    revalidatePath("/dashboard/collections");

    return { success: "Products added to collection successfully" };
  } catch (error) {
    console.log("addProductsToCollection error: ", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to add product to collection",
    };
  }
}

export async function removeProductFromCollection(data: {
  collectionId: string;
  productId: string;
  groupId?: string;
}) {
  try {
    const { user: currentUser } = await getAuthState();
    if (!currentUser) {
      return { error: "Unauthorized" };
    }

    const validatedData = RemoveProductFromCollection.parse(data);
    await collectionsService.removeProductFromCollection(
      validatedData.collectionId,
      validatedData.productId,
      validatedData.groupId
    );

    revalidatePath("/dashboard/collections");

    return { success: "Product removed from collection successfully" };
  } catch (error) {
    console.log("removeProductFromCollection error: ", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove product from collection",
    };
  }
}

export const getAllCollectionsByStoreId = async ({
  storeId,
  limit = 10,
  featured = false,
}: {
  storeId: string | null;
  limit?: number;
  featured?: boolean;
}) => {
  try {
    const results = await collectionsService.findByStoreId(storeId, {
      featured,
      limit,
    });

    return {
      documents: results.collections,
      total: results.total,
    };
  } catch (error) {
    console.warn(error);
    return {
      documents: [],
      total: 0,
    };
  }
};

export const getCollectionById = async ({
  collectionId,
  withGroups = false,
}: {
  collectionId: string;
  withGroups: boolean;
}) => {
  try {
    const collection = await collectionsService.findById(collectionId, {});
    if (withGroups) {
      const groups = await collectionsService.getCollectionWithGroups(
        collectionId
      );
      return groups;
    } else {
      return collection;
    }
  } catch (error) {
    console.warn("getCollectionById ", error);
    return null;
  }
};

export const getCollectionGroupsByCollectionId = async ({
  collectionId,
}: {
  collectionId: string;
}) => {
  try {
    const { databases } = await createSessionClient();
    const collection = await databases.listDocuments<CollectionGroupsTypes>(
      DATABASE_ID,
      PRODUCTS_COLLECTION_GROUPS_ID,
      [
        Query.equal("collectionId", collectionId),
        Query.orderAsc("displayOrder"),
      ]
    );

    return collection;
  } catch (error) {
    console.warn("getCollectionById ", error);
    return null;
  }
};

export const getCollectionProducts = async ({
  collectionId,
  groupId = null,
  page = 1,
  limit = 10,
}: {
  collectionId: string;
  groupId?: string | null;
  page?: number;
  limit?: number;
}) => {
  try {
    const productsResults = await collectionsService.getCollectionProducts(
      collectionId,
      groupId,
      page,
      limit
    );

    return productsResults;
  } catch (error) {
    console.log("getCollectionProducts: ", error);
    return null;
  }
};
