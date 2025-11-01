import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  createDocumentPermissions,
  createSessionClient,
} from "../appwrite";
import {
  BaseModel,
  PaginationResult,
  QueryFilter,
  QueryOptions,
} from "../core/database";
import {
  DATABASE_ID,
  ORDERS_COLLECTION_ID,
  REVIEW_REPLIES_COLLECTION_ID,
  REVIEW_VOTES_COLLECTION_ID,
  VIRTUAL_STORE_REVIEWS_COLLECTION_ID,
} from "../env-config";
import {
  Orders,
  ReviewReply,
  ReviewVote,
  VirtualstoreReviews,
  VirtualStoreReviewStatus,
  VoteType,
} from "../types/appwrite-types";
import { getAuthState } from "../user-permission";
import { OrderStatus } from "../constants";
import {
  CreateStoreReviewData,
  UpdateStoreReviewData,
} from "../schemas/stores-schema";

interface ReviewEligibility {
  canReview: boolean;
  reason?: string;
  existingReviewId?: string;
  isUpdate: boolean;
  orderCount: number;
  lastOrderDate?: string;
}

interface StoreRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  averageCustomerServiceRating: number;
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
        return {
          canReview: false,
          reason: "Authentication required",
          isUpdate: false,
          orderCount: 0,
        };
      }
      // Check if user already reviewed this store
      const existingReview = await this.findOne([
        { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
        { field: "userId", operator: "equal", value: user.$id },
      ]);

      const { databases } = await createSessionClient();
      const deliveredOrders = await databases.listDocuments<Orders>(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.equal("customerId", user.$id),
          Query.equal("virtualStoreId", virtualStoreId),
          Query.equal("orderStatus", OrderStatus.DELIVERED),
          Query.orderDesc("deliveredAt"),
        ]
      );

      if (deliveredOrders.total === 0) {
        return {
          canReview: false,
          reason:
            "You must complete at least one order from this store before reviewing",
          isUpdate: false,
          orderCount: 0,
        };
      }

      const mostRecentOrder = deliveredOrders.documents[0];
      const deliveryDate = new Date(
        mostRecentOrder.deliveredAt || mostRecentOrder.$updatedAt
      );
      const daysSinceDelivery = Math.floor(
        (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceDelivery > 90) {
        return {
          canReview: false,
          reason:
            "Review window has expired. You can only review within 90 days of your last delivery",
          isUpdate: !!existingReview,
          orderCount: deliveredOrders.total,
          existingReviewId: existingReview?.$id,
        };
      }

      return {
        canReview: true,
        isUpdate: !!existingReview,
        existingReviewId: existingReview?.$id,
        orderCount: deliveredOrders.total,
        lastOrderDate:
          mostRecentOrder.deliveredAt || mostRecentOrder.$updatedAt,
      };
    } catch (error) {
      console.error("checkStoreReviewEligibility error:", error);
      return {
        canReview: false,
        reason: "Unable to verify eligibility",
        isUpdate: false,
        orderCount: 0,
      };
    }
  }

  async createStoreReview(
    data: CreateStoreReviewData
  ): Promise<VirtualstoreReviews | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      // Verify eligibility
      const eligibility = await this.checkStoreReviewEligibility(
        data.virtualStoreId
      );

      if (!eligibility.canReview) {
        return { error: eligibility.reason || "Cannot review this store" };
      }

      if (eligibility.isUpdate && eligibility.existingReviewId) {
        return {
          error:
            "You have already reviewed this store. Use update instead of create.",
        };
      }

      const { databases } = await createAdminClient();
      const documentPermissions = createDocumentPermissions({
        userId: user.$id,
      });

      const reviewData = {
        virtualStoreId: data.virtualStoreId,
        userId: user.$id,
        userName: user.name || user.email?.split("@")[0] || "Anonymous",
        overallRating: data.overallRating,
        title: data.title || null,
        comment: data.comment || null,
        customerServiceRating: data.customerServiceRating || null,
        isVerifiedCustomer: true,
        orderCount: eligibility.orderCount,
        virtualStoreReviewStatus: "pending" as const,
        moderatedBy: null,
        moderatedAt: null,
      };

      const newReview = await databases.createDocument(
        DATABASE_ID,
        VIRTUAL_STORE_REVIEWS_COLLECTION_ID,
        ID.unique(),
        reviewData,
        documentPermissions
      );

      // Invalidate store rating cache
      this.invalidateCache([
        `storeRating:${data.virtualStoreId}`,
        `storeReviews:${data.virtualStoreId}`,
      ]);

      return newReview as VirtualstoreReviews;
    } catch (error) {
      console.error("createStoreReview error:", error);
      return { error: "Failed to create review" };
    }
  }

  async updateStoreReview(
    reviewId: string,
    data: UpdateStoreReviewData
  ): Promise<VirtualstoreReviews | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const existingReview = await this.findById(reviewId, {});
      if (!existingReview) {
        return { error: "Review not found" };
      }

      if (existingReview.userId !== user.$id) {
        return { error: "Unauthorized to update this review" };
      }

      const eligibility = await this.checkStoreReviewEligibility(
        existingReview.virtualStoreId
      );

      if (!eligibility.canReview) {
        return { error: eligibility.reason || "Cannot update review" };
      }

      const updateData: Partial<VirtualstoreReviews> = {
        orderCount: eligibility.orderCount,
        virtualStoreReviewStatus: "pending" as VirtualStoreReviewStatus, // Reset to pending after update
      };

      if (data.overallRating !== undefined) {
        updateData.overallRating = data.overallRating;
      }
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (data.comment !== undefined) {
        updateData.comment = data.comment;
      }
      if (data.customerServiceRating !== undefined) {
        updateData.customerServiceRating = data.customerServiceRating;
      }

      const updatedReview = await this.update(reviewId, updateData);

      this.invalidateCache([
        `storeRating:${existingReview.virtualStoreId}`,
        `storeReviews:${existingReview.virtualStoreId}`,
      ]);

      return updatedReview;
    } catch (error) {
      console.error("updateStoreReview error:", error);
      return { error: "Failed to update review" };
    }
  }

  async getStoreReviews(
    virtualStoreId: string,
    options: QueryOptions & {
      rating?: number;
      sortBy?: "newest" | "oldest" | "rating_high" | "rating_low";
      verifiedOnly?: boolean;
    } = {}
  ): Promise<PaginationResult<VirtualstoreReviews>> {
    const filters: QueryFilter[] = [
      { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
      {
        field: "virtualStoreReviewStatus",
        operator: "equal",
        value: "approved",
      },
    ];

    if (options.rating) {
      filters.push({
        field: "overallRating",
        operator: "equal",
        value: options.rating,
      });
    }

    if (options.verifiedOnly) {
      filters.push({
        field: "isVerifiedCustomer",
        operator: "equal",
        value: true,
      });
    }

    let orderBy = "$createdAt";
    let orderType: "asc" | "desc" = "desc";

    switch (options.sortBy) {
      case "oldest":
        orderBy = "$createdAt";
        orderType = "asc";
        break;
      case "rating_high":
        orderBy = "overallRating";
        orderType = "desc";
        break;
      case "rating_low":
        orderBy = "overallRating";
        orderType = "asc";
        break;
      default:
        orderBy = "$createdAt";
        orderType = "desc";
    }

    return this.findMany({
      ...options,
      filters,
      orderBy,
      orderType,
    });
  }

  async getStoreRatingStats(
    virtualStoreId: string
  ): Promise<StoreRatingStats | VirtualstoreReviews> {
    try {
      const cacheKey = `storeRating:${virtualStoreId}`;
      const cached = this.getFromCache(cacheKey);

      if (cached) return cached;

      const { databases } = await createSessionClient();

      // Get all approved reviews
      const approvedReviews =
        await databases.listDocuments<VirtualstoreReviews>(
          DATABASE_ID,
          VIRTUAL_STORE_REVIEWS_COLLECTION_ID,
          [
            Query.equal("virtualStoreId", virtualStoreId),
            Query.equal("virtualStoreReviewStatus", "approved"),
            Query.limit(1000), // Adjust as needed
          ]
        );

      const totalReviews = approvedReviews.total;

      if (totalReviews === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          averageCustomerServiceRating: 0,
        };
      }

      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalRating = 0;
      let totalServiceRating = 0;
      let serviceRatingCount = 0;

      approvedReviews.documents.forEach((review) => {
        totalRating += review.overallRating;
        ratingDistribution[
          review.overallRating as keyof typeof ratingDistribution
        ]++;

        if (review.customerServiceRating) {
          totalServiceRating += review.customerServiceRating;
          serviceRatingCount++;
        }
      });

      const stats = {
        averageRating: parseFloat((totalRating / totalReviews).toFixed(2)),
        totalReviews,
        ratingDistribution,
        averageCustomerServiceRating:
          serviceRatingCount > 0
            ? parseFloat((totalServiceRating / serviceRatingCount).toFixed(2))
            : 0,
      };

      this.setCache(cacheKey, stats as any, { ttl: 300 });

      return stats;
    } catch (error) {
      console.error("getStoreRatingStats error:", error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        averageCustomerServiceRating: 0,
      };
    }
  }

  async getUserStoreReview(
    virtualStoreId: string,
    userId: string
  ): Promise<VirtualstoreReviews | null> {
    try {
      return await this.findOne([
        { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
        { field: "userId", operator: "equal", value: userId },
      ]);
    } catch (error) {
      console.error("getUserStoreReview error:", error);
      return null;
    }
  }

  async moderateReview(
    reviewId: string,
    status: "approved" | "rejected",
    moderatorId: string
  ): Promise<VirtualstoreReviews | { error: string }> {
    try {
      const review = await this.findById(reviewId, {});
      if (!review) {
        return { error: "Review not found" };
      }

      const updatedReview = await this.update(reviewId, {
        virtualStoreReviewStatus: status,
        moderatedBy: moderatorId,
        moderatedAt: new Date().toISOString(),
      });

      // Invalidate cache
      this.invalidateCache([
        `storeRating:${review.virtualStoreId}`,
        `storeReviews:${review.virtualStoreId}`,
      ]);

      return updatedReview;
    } catch (error) {
      console.error("moderateReview error:", error);
      return { error: "Failed to moderate review" };
    }
  }

  async addReviewReply(
    reviewId: string,
    comment: string,
    userId: string,
    userName: string,
    userType: "store_owner" | "customer"
  ): Promise<ReviewReply | { error: string }> {
    try {
      const { databases } = await createAdminClient();
      const documentPermissions = createDocumentPermissions({ userId });

      const replyData = {
        reviewId,
        reviewType: "store_review" as const,
        replyingUserId: userId,
        userName,
        userType,
        comment,
        helpfulVotes: 0,
        unhelpfulVotes: 0,
        status: "approved" as const,
        moderatedBy: null,
        moderatedAt: null,
      };

      const reply = await databases.createDocument(
        DATABASE_ID,
        REVIEW_REPLIES_COLLECTION_ID,
        ID.unique(),
        replyData,
        documentPermissions
      );

      return reply as ReviewReply;
    } catch (error) {
      console.error("addReviewReply error:", error);
      return { error: "Failed to add reply" };
    }
  }

  async getReviewReplies(
    reviewId: string
  ): Promise<PaginationResult<ReviewReply>> {
    try {
      const { databases } = await createSessionClient();

      const replies = await databases.listDocuments<ReviewReply>(
        DATABASE_ID,
        REVIEW_REPLIES_COLLECTION_ID,
        [
          Query.equal("reviewId", reviewId),
          Query.equal("reviewType", "store_review"),
          Query.equal("status", "approved"),
          Query.orderAsc("$createdAt"),
        ]
      );

      return {
        documents: replies.documents,
        total: replies.total,
        limit: 100,
        offset: 0,
        hasMore: false,
      };
    } catch (error) {
      console.error("getReviewReplies error:", error);
      return {
        documents: [],
        total: 0,
        limit: 100,
        offset: 0,
        hasMore: false,
      };
    }
  }

  async voteOnReview(
    reviewId: string,
    voteType: VoteType
  ): Promise<{ success?: string; error?: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const { databases } = await createAdminClient();

      const existingVotes = await databases.listDocuments<ReviewVote>(
        DATABASE_ID,
        REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal("reviewId", reviewId),
          Query.equal("reviewType", "store_review"),
          Query.equal("userId", user.$id),
        ]
      );

      if (existingVotes.total > 0) {
        const existingVote = existingVotes.documents[0];
        if (existingVote.voteType === voteType) {
          // Remove vote
          await databases.deleteDocument(
            DATABASE_ID,
            REVIEW_VOTES_COLLECTION_ID,
            existingVote.$id
          );
          return { success: "Vote removed" };
        } else {
          // Update vote
          await databases.updateDocument(
            DATABASE_ID,
            REVIEW_VOTES_COLLECTION_ID,
            existingVote.$id,
            { voteType }
          );
          return { success: "Vote updated" };
        }
      }

      const documentPermissions = createDocumentPermissions({
        userId: user.$id,
      });

      await databases.createDocument(
        DATABASE_ID,
        REVIEW_VOTES_COLLECTION_ID,
        ID.unique(),
        {
          reviewId,
          reviewType: "store_review",
          userId: user.$id,
          voteType,
        },
        documentPermissions
      );

      return { success: "Vote recorded" };
    } catch (error) {
      console.error("voteOnReview error:", error);
      return { error: "Failed to record vote" };
    }
  }
}
