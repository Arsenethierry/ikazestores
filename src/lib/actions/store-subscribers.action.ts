"use server";

import { createSafeActionClient } from "next-safe-action";
import { StoreSubscribersModel } from "../models/store-subscribers-model";
import { revalidatePath, revalidateTag } from "next/cache";
import { authMiddleware } from "./middlewares";
import z from "zod";

const storeSubscribersModel = new StoreSubscribersModel();

const action = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Store subscriber action error:", error);
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

export const subscribeToStoreAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      storeId: z.string().min(1, "Store ID is required"),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { storeId } = parsedInput;
    const { user } = ctx;

    try {
      const subscription = await storeSubscribersModel.subscribeUserToStore(
        storeId,
        user.$id,
        user.email
      );

      revalidateTag(`store-${storeId}-subscribers`);
      revalidatePath("/explore");
      revalidatePath(`/store/${storeId}`);

      return {
        success: true,
        data: subscription,
        message: "Successfully subscribed to store",
      };
    } catch (error) {
      console.error("Error subscribing to store:", error);
      return {
        error: error instanceof Error ? error.message: "Error subscribing to store",
      };
    }
  });

export const unsubscribeFromStoreAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      storeId: z.string().min(1),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { storeId } = parsedInput;
    const { user } = ctx;

    try {
      const result = await storeSubscribersModel.unsubscribeUserFromStore(
        storeId,
        user.$id
      );

      if (!result) {
        return {
          success: false,
          error: "Subscription not found",
        };
      }

      revalidateTag(`store-${storeId}-subscribers`);
      revalidatePath("/explore");
      revalidatePath(`/store/${storeId}`);
      revalidatePath("/profile");

      return {
        success: true,
        message: "Successfully unsubscribed from store",
      };
    } catch (error) {
      console.error("Error unsubscribing from store:", error);
      throw error;
    }
  });

export const updateSubscriptionPreferencesAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      storeId: z.string().min(1),
      preferences: z.object({
        marketing: z.boolean().optional(),
        orderUpdates: z.boolean().optional(),
        newProducts: z.boolean().optional(),
        promotions: z.boolean().optional(),
      }),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { storeId, preferences } = parsedInput;
    const { user } = ctx;

    try {
      const result = await storeSubscribersModel.updatePreferences(
        storeId,
        user.$id,
        preferences
      );

      if (!result) {
        return {
          success: false,
          error: "Subscription not found",
        };
      }

      revalidatePath(`/store/${storeId}`);
      revalidatePath("/profile");

      return {
        success: true,
        message: "Preferences updated successfully",
        data: result,
      };
    } catch (error) {
      console.error("Error updating subscription preferences:", error);
      throw error;
    }
  });

export const getUserSubscriptionsAction = action
  .use(authMiddleware)
  .action(async ({ ctx }) => {
    const { user } = ctx;

    try {
      const subscriptions = await storeSubscribersModel.getUserSubscriptions(
        user.$id
      );

      return {
        success: true,
        data: subscriptions,
      };
    } catch (error) {
      console.error("Error getting user subscriptions:", error);
      throw error;
    }
  });

export async function checkUserSubscription(storeId: string, userId: string) {
  try {
    const isSubscribed = await storeSubscribersModel.isUserSubscribed(
      storeId,
      userId
    );
    return { isSubscribed };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { isSubscribed: false };
  }
}

export async function getStoreSubscribersWithPagination(
  storeId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "all" | "active" | "inactive";
  }
) {
  try {
    const page = params.page || 1;
    const limit = params.limit || 25;
    const offset = (page - 1) * limit;

    const activeOnly =
      params.status === "active"
        ? true
        : params.status === "inactive"
        ? false
        : undefined;

    const result = await storeSubscribersModel.getStoreSubscribers(storeId, {
      limit,
      offset,
      activeOnly,
    });

    let filteredDocuments = result.documents;
    let filteredTotal = result.total;

    if (params.search && params.search.trim()) {
      const searchLower = params.search.toLowerCase().trim();
      filteredDocuments = result.documents.filter((sub) =>
        sub.email.toLowerCase().includes(searchLower)
      );
      filteredTotal = filteredDocuments.length;
    }

    return {
      success: true,
      data: {
        subscribers: filteredDocuments,
        total: filteredTotal,
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
        hasMore: result.hasMore,
      },
    };
  } catch (error) {
    console.error("Error getting paginated subscribers:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch subscribers",
      data: {
        subscribers: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 0,
        hasMore: false,
      },
    };
  }
}

export async function getStoreSubscriberStats(storeId: string) {
  try {
    const allSubscribers = await storeSubscribersModel.getStoreSubscribers(
      storeId,
      {
        limit: 10000, // High limit to get all for stats
        activeOnly: false,
      }
    );

    const total = allSubscribers.total;
    const active = allSubscribers.documents.filter((s) => s.isActive).length;
    const engagementRate =
      total > 0 ? ((active / total) * 100).toFixed(1) : "0";

    return {
      success: true,
      data: {
        total,
        active,
        engagementRate,
      },
    };
  } catch (error) {
    console.error("Error getting subscriber stats:", error);
    return {
      success: false,
      data: {
        total: 0,
        active: 0,
        engagementRate: "0",
      },
    };
  }
}
