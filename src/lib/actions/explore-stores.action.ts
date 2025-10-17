"use server";

import { PaginationResult, QueryFilter, QueryOptions } from "../core/database";
import { AffiliateProductModel } from "../models/AffliateProductModel";
import { StoreSubscribersModel } from "../models/store-subscribers-model";
import { VirtualStore } from "../models/virtual-store";
import { StoreReviewModel } from "../models/VirtualStoreReviewModel";
import { VirtualStoreTypes } from "../types";
import { cache } from "react";

const virtualStoreModel = new VirtualStore();
const storeSubscribersModel = new StoreSubscribersModel();
const storeReviewModel = new StoreReviewModel();
const affiliateProductModel = new AffiliateProductModel();

export interface EnhancedVirtualStore extends VirtualStoreTypes {
  subscriberCount?: number;
  subscribersIds?: string[];
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
): Promise<PaginationResult<VirtualStoreTypes>> {
  try {
    const { search, sortBy = "newest", page = 1, limit = 25 } = filters;

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
        // For popular/rating, we'll sort on client after fetching counts
        orderBy = "$createdAt";
        orderType = "desc";
        break;
    }

    const queryOptions: QueryOptions = {
      filters: queryFilters,
      orderBy,
      orderType,
      limit,
      offset,
    };

    let storesResult: PaginationResult<VirtualStoreTypes>;

    if (search && search.trim()) {
      storesResult = await virtualStoreModel.searchStores(search, queryOptions);
    } else {
      storesResult = await virtualStoreModel.findMany(queryOptions);
    }

    return storesResult;
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

export async function checkStoreSubscription(
  storeId: string,
  userId: string | undefined
): Promise<boolean> {
  if (!userId) return false;

  try {
    return await storeSubscribersModel.isUserSubscribed(storeId, userId);
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}

export async function checkMultipleSubscriptions(
  storeIds: string[],
  userId: string | undefined
): Promise<Record<string, boolean>> {
  if (!userId || storeIds.length === 0) {
    return storeIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
  }

  try {
    // Fetch all user subscriptions in one query
    const subscriptions = await storeSubscribersModel.getUserSubscriptions(
      userId,
      {
        limit: 1000, // Reasonable limit
      }
    );

    const subscribedStoreIds = new Set(
      subscriptions.documents.map((sub) => sub.storeId)
    );

    return storeIds.reduce(
      (acc, storeId) => ({
        ...acc,
        [storeId]: subscribedStoreIds.has(storeId),
      }),
      {}
    );
  } catch (error) {
    console.error("Error checking multiple subscriptions:", error);
    return storeIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
  }
}

export const getStoreSubscriberCount = cache(
  async (storeId: string): Promise<number> => {
    try {
        const subs = await storeSubscribersModel.getStoreSubscribers(storeId);
        return subs.total;
      } catch (error) {
        console.error(`Error getting subscriber count for ${storeId}:`, error);
        return 0;
      }
  }
);

export const getStoreProductCount = cache(
  async (storeId: string): Promise<number> => {
    try {
        const imports = await affiliateProductModel.findActiveImports(storeId, {
          limit: 1,
        });
        return imports.total;
      } catch (error) {
        console.error(`Error getting product count for ${storeId}:`, error);
        return 0;
      }
  }
);

export const getStoreRating = cache(
  async (
    storeId: string
  ): Promise<{ averageRating: number; totalReviews: number }> => {
    try {
      const ratingStats = await storeReviewModel.getStoreRatingStats(storeId);

        return {
          averageRating:
            typeof ratingStats === "object" && "averageRating" in ratingStats
              ? ratingStats.averageRating
              : 0,
          totalReviews:
            typeof ratingStats === "object" && "totalReviews" in ratingStats
              ? ratingStats.totalReviews
              : 0,
        };
    } catch (error) {
      console.error(`Error getting rating for ${storeId}:`, error);
      return { averageRating: 0, totalReviews: 0 };
    }
  }
);

export const getStoreStatistics = cache(async () => {
  try {
    const stores = await virtualStoreModel.findMany({ limit: 1 });
        return {
          totalStores: stores.total,
        };
  } catch (error) {
    console.error("Error getting store statistics:", error);
    return {
      totalStores: 0,
    };
  }
});
