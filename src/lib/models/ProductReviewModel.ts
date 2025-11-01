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
  ORDER_ITEMS_COLLECTION_ID,
  ORDERS_COLLECTION_ID,
  PRODUCT_REVIEWS_COLLECTION_ID,
  REVIEW_VOTES_COLLECTION_ID,
} from "../env-config";
import { getAuthState } from "../user-permission";
import { OrderStatus } from "../constants";
import { ProductModel } from "./ProductModel";
import {
  VoteType,
  OrderItems,
  Orders,
  ProductReview,
} from "../types/appwrite-types";

export interface CreateProductReviewData {
  productId: string;
  virtualStoreId: string;
  rating: number;
  title: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  orderId?: string;
  images?: File[];
  videos?: File[];
}

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

export class ProductReviewModel extends BaseModel<ProductReview> {
  private originalProduct: ProductModel;

  constructor() {
    super(PRODUCT_REVIEWS_COLLECTION_ID);
    this.originalProduct = new ProductModel();
  }

  async checkReviewEligibility(
    productId: string,
    virtualStoreId: string
  ): Promise<ReviewEligibility> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { canReview: false, reason: "Authentication required" };
      }

      const existingReview = await this.findOne([
        { field: "productId", operator: "equal", value: productId },
        { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
        { field: "userId", operator: "equal", value: user.$id },
      ]);

      if (existingReview) {
        return {
          canReview: false,
          reason: "You have already reviewed this product",
        };
      }

      // Find completed orders with this product
      const eligibleOrder = await this.findEligibleOrder(
        user.$id,
        productId,
        virtualStoreId
      );
      if (!eligibleOrder) {
        return {
          canReview: false,
          reason: "You must purchase and receive this product before reviewing",
        };
      }

      return {
        canReview: true,
        orderDetails: {
          orderId: eligibleOrder.orderId,
          orderNumber: eligibleOrder.orderNumber,
          deliveredAt: eligibleOrder.deliveredAt,
          totalAmount: eligibleOrder.totalAmount,
          currency: eligibleOrder.currency,
        },
      };
    } catch (error) {
      console.error("checkReviewEligibility error:", error);
      return {
        canReview: false,
        reason: "Unable to verify purchase eligibility",
      };
    }
  }

  async getUserReviewableProducts(
    userId: string,
    options: QueryOptions = {}
  ): Promise<{
    success: boolean;
    products: Array<{
      productId: string;
      virtualStoreId: string;
      productName: string;
      productImage?: string;
      orderId: string;
      orderNumber: string;
      deliveredAt: string;
      canReview: boolean;
      alreadyReviewed: boolean;
      reviewId?: string;
    }>;
    error?: string;
  }> {
    try {
      const { databases } = await createSessionClient();

      // Get all delivered orders for this user
      const deliveredOrders = await databases.listDocuments<Orders>(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.equal("customerId", userId),
          Query.equal("status", OrderStatus.DELIVERED),
          Query.orderDesc("$createdAt"),
          Query.limit(options.limit || 50),
        ]
      );

      const reviewableProducts = [];

      for (const order of deliveredOrders.documents) {
        const orderItems = await databases.listDocuments<OrderItems>(
          DATABASE_ID,
          ORDER_ITEMS_COLLECTION_ID,
          [Query.equal("orderId", order.$id)]
        );

        for (const item of orderItems.documents) {
          // Check if already reviewed
          const existingReview = await this.findOne([
            {
              field: "productId",
              operator: "equal",
              value: item.originalProductId,
            },
            {
              field: "virtualStoreId",
              operator: "equal",
              value: item.virtualStoreId,
            },
            { field: "userId", operator: "equal", value: userId },
          ]);

          // Calculate days since delivery for review window
          const deliveryDate = new Date(order.deliveredAt || order.$updatedAt);
          const daysSinceDelivery = Math.floor(
            (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const canStillReview = daysSinceDelivery <= 90; // 90-day review window

          reviewableProducts.push({
            productId: item.originalProductId,
            virtualStoreId: item.virtualStoreId,
            productName: item.productName,
            productImage: item.productImage,
            orderId: order.$id,
            orderNumber: order.orderNumber,
            deliveredAt: order.deliveredAt || order.$updatedAt,
            canReview: canStillReview && !existingReview,
            alreadyReviewed: !!existingReview,
            reviewId: existingReview?.$id,
            daysSinceDelivery,
          });
        }
      }

      return {
        success: true,
        products: reviewableProducts as any,
      };
    } catch (error) {
      console.error("getUserReviewableProducts error:", error);
      return {
        success: false,
        products: [],
        error: "Failed to fetch reviewable products",
      };
    }
  }

  async getProductReviews(
    productId: string,
    options: QueryOptions & {
      storeId?: string;
      rating?: number;
      sortBy?: "newest" | "oldest" | "helpful" | "rating_high" | "rating_low";
      verifiedOnly?: boolean;
      withPhotos?: boolean;
    } = {}
  ): Promise<PaginationResult<ProductReview>> {
    const filters: QueryFilter[] = [
      { field: "productId", operator: "equal", value: productId },
      { field: "status", operator: "equal", value: "approved" },
    ];

    if (options.storeId) {
      filters.push({
        field: "virtualStoreId",
        operator: "equal",
        value: options.storeId,
      });
    }

    if (options.rating) {
      filters.push({
        field: "rating",
        operator: "equal",
        value: options.rating,
      });
    }

    if (options.verifiedOnly) {
      filters.push({
        field: "isVerifiedPurchase",
        operator: "equal",
        value: true,
      });
    }

    if (options.withPhotos) {
      filters.push({ field: "images", operator: "greaterThan", value: [] });
    }

    let orderBy = "$createdAt";
    let orderType: "asc" | "desc" = "desc";

    switch (options.sortBy) {
      case "oldest":
        orderBy = "$createdAt";
        orderType = "asc";
        break;
      case "helpful":
        orderBy = "helpfulVotes";
        orderType = "desc";
        break;
      case "rating_high":
        orderBy = "rating";
        orderType = "desc";
        break;
      case "rating_low":
        orderBy = "rating";
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

  async createReview(
    data: CreateProductReviewData
  ): Promise<ProductReview | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      // Verify review eligibility
      const eligibility = await this.checkReviewEligibility(
        data.productId,
        data.virtualStoreId
      );
      if (!eligibility.canReview) {
        return { error: eligibility.reason || "Cannot review this product" };
      }

      let verifiedOrderId = data.orderId;
      if (data.orderId) {
        const isValidOrder = await this.verifyOrderForReview(
          data.orderId,
          user.$id,
          data.productId,
          data.virtualStoreId
        );
        if (!isValidOrder) {
          return { error: "Invalid order for this product review" };
        }
      } else if (eligibility.orderDetails) {
        verifiedOrderId = eligibility.orderDetails.orderId;
      }

      const { databases } = await createAdminClient();
      const documentPermissions = createDocumentPermissions({
        userId: user.$id,
      });

      // Handle media uploads if any
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];

      // Upload logic would go here...

      const reviewData = {
        productId: data.productId,
        virtualStoreId: data.virtualStoreId,
        physicalStoreId: await this.getPhysicalStoreId(data.productId),
        userId: user.$id,
        userName: user.name || user.email?.split("@")[0] || "Anonymous",
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        pros: data.pros || [],
        cons: data.cons || [],
        isVerifiedPurchase: !!verifiedOrderId,
        orderId: verifiedOrderId,
        helpfulVotes: 0,
        unhelpfulVotes: 0,
        images: imageUrls.map((image) => image),
        videos: videoUrls.map((vid) => vid),
        status: "pending" as const,
        replies: 0,
        viewCount: 0,
        shareCount: 0,
        orderAmount: eligibility.orderDetails?.totalAmount,
        orderCurrency: eligibility.orderDetails?.currency,
        purchaseDate: eligibility.orderDetails?.deliveredAt,
      };

      const newReview: ProductReview = await databases.createDocument(
        DATABASE_ID,
        PRODUCT_REVIEWS_COLLECTION_ID,
        ID.unique(),
        reviewData,
        documentPermissions
      );

      return newReview as ProductReview;
    } catch (error) {
      console.error("createReview error:", error);
      return { error: "Failed to create review" };
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

      const { databases } = await createSessionClient();

      // Check if user already voted
      const existingVote = await databases.listDocuments(
        DATABASE_ID,
        REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal("reviewId", reviewId),
          Query.equal("userId", user.$id),
          Query.equal("reviewType", "product"),
        ]
      );

      if (existingVote.documents.length > 0) {
        const vote = existingVote.documents[0];
        if (vote.voteType === voteType) {
          // Remove vote if same type
          await databases.deleteDocument(
            DATABASE_ID,
            REVIEW_VOTES_COLLECTION_ID,
            vote.$id
          );
          await this.updateVoteCount(reviewId, voteType, -1);
          return { success: "Vote removed" };
        } else {
          // Update vote type
          await databases.updateDocument(
            DATABASE_ID,
            REVIEW_VOTES_COLLECTION_ID,
            vote.$id,
            {
              voteType,
            }
          );
          await this.updateVoteCount(reviewId, vote.voteType, -1);
          await this.updateVoteCount(reviewId, voteType, 1);
          return { success: "Vote updated" };
        }
      }

      // Create new vote
      await databases.createDocument(
        DATABASE_ID,
        REVIEW_VOTES_COLLECTION_ID,
        ID.unique(),
        {
          reviewId,
          reviewType: "product",
          userId: user.$id,
          voteType,
        },
        createDocumentPermissions({ userId: user.$id })
      );

      await this.updateVoteCount(reviewId, voteType, 1);
      return { success: "Vote recorded" };
    } catch (error) {
      console.error("voteOnReview error:", error);
      return { error: "Failed to vote on review" };
    }
  }

  private async updateVoteCount(
    reviewId: string,
    voteType: VoteType,
    increment: number
  ): Promise<void> {
    try {
      const { databases } = await createSessionClient();
      const review = await databases.getDocument(
        DATABASE_ID,
        PRODUCT_REVIEWS_COLLECTION_ID,
        reviewId
      );

      const updateData: any = {};
      if (voteType === VoteType.HELPFUL) {
        updateData.helpfulVotes = Math.max(0, review.helpfulVotes + increment);
      } else {
        updateData.unhelpfulVotes = Math.max(
          0,
          review.unhelpfulVotes + increment
        );
      }

      await databases.updateDocument(
        DATABASE_ID,
        PRODUCT_REVIEWS_COLLECTION_ID,
        reviewId,
        updateData
      );
    } catch (error) {
      console.error("updateVoteCount error:", error);
    }
  }

  private async getPhysicalStoreId(productId: string): Promise<string> {
    try {
      const product = await this.originalProduct.findById(productId, {});
      if (!product) return "";

      return product.physicalStoreId;
    } catch (error) {
      return "";
    }
  }

  private async findEligibleOrder(
    userId: string,
    productId: string,
    virtualStoreId: string
  ): Promise<{
    orderId: string;
    orderNumber: string;
    deliveredAt: string;
    totalAmount: number;
    currency: string;
  } | null> {
    try {
      const { databases } = await createSessionClient();
      const orders = await databases.listDocuments<Orders>(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.equal("customerId", userId),
          Query.equal("virtualStoreId", virtualStoreId),
          Query.equal("status", OrderStatus.DELIVERED),
          Query.orderDesc("$updatedAt"),
        ]
      );

      for (const order of orders.documents) {
        const orderItems = await databases.listDocuments<OrderItems>(
          DATABASE_ID,
          ORDER_ITEMS_COLLECTION_ID,
          [
            Query.equal("orderId", order.$id),
            Query.equal("originalProductId", productId),
          ]
        );

        if (orderItems.documents.length > 0) {
          // Check if delivery was recent enough (within 90 days)
          const deliveryDate = new Date(order.deliveredAt || order.$updatedAt);
          const daysSinceDelivery = Math.floor(
            (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceDelivery <= 90) {
            return {
              orderId: order.$id,
              orderNumber: order.orderNumber,
              deliveredAt: order.deliveredAt || order.$updatedAt,
              totalAmount:
                order.customerTotalAmount || order.baseTotalAmount || 0,
              currency: order.customerCurrency || order.baseCurrency || "USD",
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error("findEligibleOrder error:", error);
      return null;
    }
  }

  private async verifyOrderForReview(
    orderId: string,
    userId: string,
    productId: string,
    virtualStoreId: string
  ): Promise<boolean> {
    try {
      const { databases } = await createSessionClient();

      // Verify order belongs to user and is delivered
      const order = await databases.getDocument(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        orderId
      );

      if (
        order.customerId !== userId ||
        order.virtualStoreId !== virtualStoreId ||
        order.status !== OrderStatus.DELIVERED
      ) {
        return false;
      }

      // Verify order contains the product
      const orderItems = await databases.listDocuments(
        DATABASE_ID,
        ORDER_ITEMS_COLLECTION_ID,
        [
          Query.equal("orderId", orderId),
          Query.equal("originalProductId", productId),
        ]
      );

      return orderItems.documents.length > 0;
    } catch (error) {
      console.error("verifyOrderForReview error:", error);
      return false;
    }
  }
}
