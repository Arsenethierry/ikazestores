import { BaseModel } from "../core/database";
import { VIRTUAL_STORE_REVIEWS_COLLECTION_ID } from "../env-config";
import { VirtualstoreReviews } from "../types/appwrite/appwrite";
import { getAuthState } from "../user-permission";

interface ReviewEligibility {
  canReview: boolean;
  reason?: string;
  orderDetails?: {
    orderId: string;
    orderNumber: string;
    deliveredAt: string;
    totalAmount: number;
    currency: string;
  };
}

export class StoreReviewModel extends BaseModel<VirtualstoreReviews> {
  constructor() {
    super(VIRTUAL_STORE_REVIEWS_COLLECTION_ID);
  }

  async checkStoreReviewEligibility(
    virtualStoreId: string
  ): Promise<ReviewEligibility> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { canReview: false, reason: "Authentication required" };
      }

      // Check if user already reviewed this store
      const existingReview = await this.findOne([
        { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
        { field: "userId", operator: "equal", value: user.$id },
      ]);

      if (existingReview) {
        return {
          canReview: false,
          reason: "You have already reviewed this store",
        };
      }

      // Check if user has completed orders from this store
      // const eligibleOrder = await this.findEligibleStoreOrder(
      //   user.$id,
      //   virtualStoreId
      // );

      // if (!eligibleOrder) {
      //   return {
      //     canReview: false,
      //     reason:
      //       "You must complete at least one order from this store before reviewing",
      //   };
      // }

      return {
        canReview: true,
        // orderDetails: eligibleOrder,
      };
    } catch (error) {
      console.error("checkStoreReviewEligibility error:", error);
      return {
        canReview: false,
        reason: "Unable to verify purchase eligibility",
      };
    }
  }

  async createStoreReview(
    data: VirtualstoreReviews
  ): Promise<VirtualstoreReviews | { error: string }> {
    
  }
}
