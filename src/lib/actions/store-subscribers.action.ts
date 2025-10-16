"use server";

import { createSafeActionClient } from "next-safe-action";
import { StoreSubscribersModel } from "../models/store-subscribers-model";
import { revalidatePath } from "next/cache";
import { authMiddleware } from "./middlewares";
import z from "zod";

const storeSubscribersModel = new StoreSubscribersModel();

const action = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Store subscriber action error:", error);
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

export async function subscribeUserToStore(
  storeId: string,
  userId: string,
  email: string
) {
  try {
    const subscription = await storeSubscribersModel.subscribeUserToStore(
      storeId,
      userId,
      email
    );

    revalidatePath(`/store/${storeId}`);
    revalidatePath(`/admin/stores/${storeId}`);

    return {
      success: true,
      data: subscription,
    };
  } catch (error) {
    console.error("Error subscribing user to store:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to subscribe to store",
    };
  }
}

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

export const getStoreSubscriberCountAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      storeId: z.string().min(1),
    })
  )
  .action(async ({ parsedInput }) => {
    const { storeId } = parsedInput;

    try {
      const count = await storeSubscribersModel.getSubscriberCount(storeId);

      return {
        success: true,
        count,
      };
    } catch (error) {
      console.error("Error getting subscriber count:", error);
      throw error;
    }
  });
