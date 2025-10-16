import { BaseModel, PaginationResult, QueryOptions } from "../core/database";
import { STORE_SUBSCRIBERS_COLLECTION_ID } from "../env-config";
import { StoreSubscribers } from "../types/appwrite/appwrite";

interface StoreSubscriberPreferences {
  marketing: boolean;
  orderUpdates: boolean;
  newProducts: boolean;
  promotions: boolean;
}

interface StoreSubscriberWithParsedPreferences
  extends Omit<StoreSubscribers, "preferences"> {
  preferences?: StoreSubscriberPreferences;
}

export type { StoreSubscriberWithParsedPreferences, StoreSubscriberPreferences };
export class StoreSubscribersModel extends BaseModel<StoreSubscribers> {
  constructor() {
    super(STORE_SUBSCRIBERS_COLLECTION_ID);
  }

  private parsePreferences(
    preferences?: string | null
  ): StoreSubscriberPreferences {
    if (!preferences) {
      return {
        marketing: true,
        orderUpdates: true,
        newProducts: true,
        promotions: true,
      };
    }

    try {
      return JSON.parse(preferences);
    } catch (error) {
      console.error("Error parsing preferences:", error);
      return {
        marketing: true,
        orderUpdates: true,
        newProducts: true,
        promotions: true,
      };
    }
  }

  private stringifyPreferences(
    preferences: Partial<StoreSubscriberPreferences>
  ): string {
    const defaultPreferences: StoreSubscriberPreferences = {
      marketing: true,
      orderUpdates: true,
      newProducts: true,
      promotions: true,
    };

    const merged = { ...defaultPreferences, ...preferences };
    return JSON.stringify(merged);
  }

  private parseSubscriber(
    subscriber: StoreSubscribers
  ): StoreSubscriberWithParsedPreferences {
    return {
      ...subscriber,
      preferences: this.parsePreferences(subscriber.preferences),
    };
  }

  private parseSubscribers(
    subscribers: StoreSubscribers[]
  ): StoreSubscriberWithParsedPreferences[] {
    return subscribers.map((sub) => this.parseSubscriber(sub));
  }

  async subscribeUserToStore(
    storeId: string,
    userId: string,
    email: string
  ): Promise<StoreSubscriberWithParsedPreferences> {
    try {
      const existing = await this.findOne([
        { field: "storeId", operator: "equal", value: storeId },
        { field: "userId", operator: "equal", value: userId },
      ]);

      if (existing) {
        // Reactivate if inactive
        if (!existing.isActive) {
          const updated = await this.update(existing.$id, { isActive: true });
          return this.parseSubscriber(updated);
        }
        return this.parseSubscriber(existing);
      }

      const subscription = await this.create(
        {
          storeId,
          userId,
          email,
          subscribedAt: new Date().toISOString(),
          isActive: true,
          preferences: this.stringifyPreferences({
            marketing: true,
            orderUpdates: true,
            newProducts: true,
            promotions: true,
          }),
        },
        userId
      );

      return this.parseSubscriber(subscription);
    } catch (error) {
      console.error("Error subscribing user to store:", error);
      throw error;
    }
  }

  async unsubscribeUserFromStore(
    storeId: string,
    userId: string
  ): Promise<StoreSubscriberWithParsedPreferences | null> {
    try {
      const subscription = await this.findOne([
        { field: "storeId", operator: "equal", value: storeId },
        { field: "userId", operator: "equal", value: userId },
      ]);

      if (!subscription) {
        return null;
      }

      const updated = await this.update(subscription.$id, { isActive: false });
      return this.parseSubscriber(updated);
    } catch (error) {
      console.error("Error unsubscribing user from store:", error);
      throw error;
    }
  }

  async getStoreSubscribers(
    storeId: string,
    options?: QueryOptions & { activeOnly?: boolean }
  ): Promise<PaginationResult<StoreSubscriberWithParsedPreferences>> {
    try {
      const filters = [
        {
          field: "storeId",
          operator: "equal" as const,
          value: storeId as string | boolean,
        },
      ];

      if (options?.activeOnly !== false) {
        filters.push({
          field: "isActive",
          operator: "equal" as const,
          value: true,
        });
      }

      const result = await this.findMany({
        ...options,
        filters,
      });

      return {
        ...result,
        documents: this.parseSubscribers(result.documents),
      };
    } catch (error) {
      console.error("Error getting store subscribers:", error);
      throw error;
    }
  }

  async getUserSubscriptions(
    userId: string,
    options?: QueryOptions
  ): Promise<PaginationResult<StoreSubscriberWithParsedPreferences>> {
    try {
      const result = await this.findMany({
        ...options,
        filters: [
          { field: "userId", operator: "equal", value: userId },
          { field: "isActive", operator: "equal", value: true },
        ],
      });

      return {
        ...result,
        documents: this.parseSubscribers(result.documents),
      };
    } catch (error) {
      console.error("Error getting user subscriptions:", error);
      throw error;
    }
  }

  async updatePreferences(
    storeId: string,
    userId: string,
    preferences: Partial<StoreSubscriberPreferences>
  ): Promise<StoreSubscriberWithParsedPreferences | null> {
    try {
      const subscription = await this.findOne([
        { field: "storeId", operator: "equal", value: storeId },
        { field: "userId", operator: "equal", value: userId },
      ]);

      if (!subscription) {
        return null;
      }

      const existingPreferences = this.parsePreferences(
        subscription.preferences
      );

      const updatedPreferences = {
        ...existingPreferences,
        ...preferences,
      };

      const updated = await this.update(subscription.$id, {
        preferences: this.stringifyPreferences(updatedPreferences),
      });

      return this.parseSubscriber(updated);
    } catch (error) {
      console.error("Error updating subscription preferences:", error);
      throw error;
    }
  }

  async isUserSubscribed(storeId: string, userId: string): Promise<boolean> {
    try {
      const subscription = await this.findOne([
        { field: "storeId", operator: "equal", value: storeId },
        { field: "userId", operator: "equal", value: userId },
        { field: "isActive", operator: "equal", value: true },
      ]);

      return !!subscription;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  async getSubscriberCount(storeId: string): Promise<number> {
    try {
      const result = await this.getStoreSubscribers(storeId, {
        limit: 1,
        activeOnly: true,
      });
      return result.total;
    } catch (error) {
      console.error("Error getting subscriber count:", error);
      return 0;
    }
  }
}
