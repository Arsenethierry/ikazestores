"use server";

import { revalidatePath } from "next/cache";
import { PaginationResult, QueryFilter, QueryOptions } from "../core/database";
import { AffiliateProductModel } from "../models/AffliateProductModel";
import { StoreSubscribersModel } from "../models/store-subscribers-model";
import { VirtualStore } from "../models/virtual-store";
import { StoreReviewModel } from "../models/VirtualStoreReviewModel";
import { VirtualStoreTypes } from "../types";

const virtualStoreModel = new VirtualStore();
const storeSubscribersModel = new StoreSubscribersModel();
const storeReviewModel = new StoreReviewModel();
const affiliateProductModel = new AffiliateProductModel();

export interface EnhancedVirtualStore extends VirtualStoreTypes {
  subscriberCount?: number;
  averageRating?: number;
  totalReviews?: number;
  productCount?: number;
}

export interface StoreFilters {
  search?: string;
  rating?: number;
  sortBy?: "newest" | "popular" | "rating" | "name";
  page?: number;
  limit?: number;
}

export async function getExploreStores(
  filters: StoreFilters = {}
): Promise<PaginationResult<EnhancedVirtualStore>> {
  try {
    const { search, rating, sortBy = "newest", page = 1, limit = 25 } = filters;

    const offset = (page - 1) * limit;
    const queryFilters: QueryFilter[] = [];

    let orderBy = "$createdAt";
    let orderType: "asc" | "desc" = "desc";

    switch (sortBy) {
      case "newest":
        orderBy = "$createdAt";
        orderType = "desc";
        break;
      case "name":
        orderBy = "storeName";
        orderType = "asc";
        break;
      case "popular":
      case "rating":
        orderBy = "$createdAt";
        orderType = "desc";
        break;
    }

    const queryOptions: QueryOptions = {
      filters: queryFilters,
      orderBy,
      orderType,
      limit: sortBy === "popular" || sortBy === "rating" ? 100 : limit,
      offset: sortBy === "popular" || sortBy === "rating" ? 0 : offset,
    };

    let storesResult: PaginationResult<VirtualStoreTypes>;

    if (search && search.trim()) {
      storesResult = await virtualStoreModel.searchStores(search, queryOptions);
    } else {
      storesResult = await virtualStoreModel.findMany(queryOptions);
    }

    const enhancedStores = await Promise.all(
      storesResult.documents.map(async (store) => {
        const subscriberCount = await storeSubscribersModel.getSubscriberCount(
          store.$id
        );

        const ratingStats = await storeReviewModel.getStoreRatingStats(
          store.$id
        );

        const productImports = await affiliateProductModel.findActiveImports(
          store.$id,
          { limit: 1 }
        );

        return {
          ...store,
          subscriberCount,
          productCount: productImports.total,
          averageRating:
            typeof ratingStats === "object" && "averageRating" in ratingStats
              ? ratingStats.averageRating
              : 0,
          totalReviews:
            typeof ratingStats === "object" && "totalReviews" in ratingStats
              ? ratingStats.totalReviews
              : 0,
        };
      })
    );

    let filteredStores = enhancedStores;
    if (rating) {
      filteredStores = enhancedStores.filter(
        (store) => Math.round(store.averageRating || 0) >= rating
      );
    }

    if (sortBy === "rating") {
      filteredStores.sort(
        (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
      );
    } else if (sortBy === "popular") {
      filteredStores.sort(
        (a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0)
      );
    }

    if (sortBy === "popular" || sortBy === "rating") {
      const start = offset;
      const end = offset + limit;
      filteredStores = filteredStores.slice(start, end);
    }

    return {
      documents: filteredStores,
      total: rating ? filteredStores.length : storesResult.total,
      limit,
      offset,
      hasMore:
        offset + limit < (rating ? filteredStores.length : storesResult.total),
    };
  } catch (error) {
    console.error("Error getting explore stores:", error);
    return {
      documents: [],
      total: 0,
      limit: filters.limit || 25,
      offset: ((filters.page || 1) - 1) * (filters.limit || 25),
      hasMore: false,
    };
  }
}

export async function getStoreStatistics(): Promise<{
  totalStores: number;
}> {
  try {
    const storesCount = await virtualStoreModel.findMany({ limit: 1 });

    return {
      totalStores: storesCount.total,
    };
  } catch (error) {
    console.error("Error getting store statistics:", error);
    return {
      totalStores: 0,
    };
  }
}

export async function revalidateExploreStores() {
  revalidatePath("/explore-stores");
}
