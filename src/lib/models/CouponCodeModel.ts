import { Query } from "node-appwrite";
import { BaseModel } from "../core/database";
import {
  COUPON_CODES_COLLECTION_ID,
  COUPON_USAGE_COLLECTION_ID,
  DATABASE_ID,
} from "../env-config";
import { checkStoreAccess } from "../helpers/store-permission-helper";
import { CouponCodes, CouponUsage } from "../types/appwrite/appwrite";
import { getAuthState } from "../user-permission";
import { createSessionClient } from "../appwrite";

export class CouponCodeModel extends BaseModel<CouponCodes> {
  constructor() {
    super(COUPON_CODES_COLLECTION_ID);
  }

  async createCouponCode(
    code: string,
    discountId: string,
    storeId: string
  ): Promise<CouponCodes | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const hasPermission = await checkStoreAccess(
        user.$id,
        storeId,
        "marketing.discounts.create"
      );

      if (!hasPermission) {
        return { error: "You don't have permission to create coupon codes" };
      }

      const existing = await this.findMany({
        filters: [
          { field: "code", operator: "equal", value: code.toUpperCase() },
        ],
        limit: 1,
      });

      if (existing.documents.length > 0) {
        return { error: "Coupon code already exists" };
      }

      const coupon = await this.create(
        {
          code: code.toUpperCase(),
          discountId,
          storeId,
          isActive: true,
          usageCount: 0,
        },
        user.$id
      );

      return coupon;
    } catch (error) {
      console.error("createCouponCode error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to create coupon code" };
    }
  }

  async getCouponsByDiscount(discountId: string): Promise<CouponCodes[]> {
    try {
      const result = await this.findMany({
        filters: [
          { field: "discountId", operator: "equal", value: discountId },
        ],
        limit: 100,
      });
      return result.documents;
    } catch (error) {
      console.error("getCouponsByDiscount error:", error);
      return [];
    }
  }

  async getCouponByCode(
    code: string,
    storeId: string
  ): Promise<CouponCodes | null> {
    try {
      const result = await this.findMany({
        filters: [
          { field: "code", operator: "equal", value: code.toUpperCase() },
          { field: "storeId", operator: "equal", value: storeId },
          { field: "isActive", operator: "equal", value: true },
        ],
        limit: 1,
      });

      return result.documents[0] || null;
    } catch (error) {
      console.error("getCouponByCode error:", error);
      return null;
    }
  }

  async incrementCouponUsage(couponCodeId: string): Promise<void> {
    try {
      const coupon = await this.findById(couponCodeId, {});
      if (!coupon) return;

      await this.update(couponCodeId, {
        usageCount: (coupon.usageCount || 0) + 1,
      });
    } catch (error) {
      console.error("incrementCouponUsage error:", error);
    }
  }

  async updateCouponStatus(
    couponCodeId: string,
    isActive: boolean,
    storeId: string
  ): Promise<CouponCodes | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const hasPermission = await checkStoreAccess(
        user.$id,
        storeId,
        "marketing.discounts.update"
      );

      if (!hasPermission) {
        return { error: "You don't have permission to update coupon status" };
      }

      const updated = await this.update(couponCodeId, { isActive });
      return updated;
    } catch (error) {
      console.error("updateCouponStatus error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update coupon status" };
    }
  }

  async deleteCoupon(
    couponCodeId: string,
    storeId: string
  ): Promise<{ success?: string; error?: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const hasPermission = await checkStoreAccess(
        user.$id,
        storeId,
        "marketing.discounts.delete"
      );

      if (!hasPermission) {
        return { error: "You don't have permission to delete coupons" };
      }

      await this.deleteCouponUsageByCoupon(couponCodeId);

      await this.delete(couponCodeId);

      return { success: "Coupon deleted successfully" };
    } catch (error) {
      console.error("deleteCoupon error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete coupon" };
    }
  }

  private async deleteCouponUsageByCoupon(couponCodeId: string): Promise<void> {
    try {
      const { databases } = await createSessionClient();

      const usageRecords = await databases.listDocuments(
        DATABASE_ID,
        COUPON_USAGE_COLLECTION_ID,
        [Query.equal("couponCodeId", couponCodeId), Query.limit(1000)]
      );

      const batchSize = 10;
      for (let i = 0; i < usageRecords.documents.length; i += batchSize) {
        await Promise.all(
          usageRecords.documents
            .slice(i, i + batchSize)
            .map((usage) =>
              databases.deleteDocument(
                DATABASE_ID,
                COUPON_USAGE_COLLECTION_ID,
                usage.$id
              )
            )
        );
      }

      console.log(
        `Deleted ${usageRecords.documents.length} usage records for coupon ${couponCodeId}`
      );
    } catch (error) {
      console.error("deleteCouponUsageByCoupon error:", error);
    }
  }
}

export class CouponUsageModel extends BaseModel<CouponUsage> {
  constructor() {
    super(COUPON_USAGE_COLLECTION_ID);
  }

  async recordUsage(
    couponCodeId: string,
    customerId: string,
    discountAmount: number,
    orderId?: string
  ): Promise<CouponUsage | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const usage = await this.create(
        {
          couponCodeId,
          customerId,
          orderId,
          discountAmount,
          usedAt: new Date().toISOString(),
        },
        user.$id
      );

      // Increment coupon usage count
      const couponModel = new CouponCodeModel();
      await couponModel.incrementCouponUsage(couponCodeId);

      return usage;
    } catch (error) {
      console.error("recordUsage error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to record usage" };
    }
  }

  async getCustomerUsageCount(
    couponCodeId: string,
    customerId: string
  ): Promise<number> {
    try {
      const result = await this.findMany({
        filters: [
          { field: "couponCodeId", operator: "equal", value: couponCodeId },
          { field: "customerId", operator: "equal", value: customerId },
        ],
        limit: 1000,
      });

      return result.total;
    } catch (error) {
      console.error("getCustomerUsageCount error:", error);
      return 0;
    }
  }

  async getCustomerUsageHistory(
    customerId: string,
    limit: number = 50
  ): Promise<CouponUsage[]> {
    try {
      const result = await this.findMany({
        filters: [
          { field: "customerId", operator: "equal", value: customerId },
        ],
        limit,
        orderBy: "usedAt",
        orderType: "desc",
      });

      return result.documents;
    } catch (error) {
      console.error("getCustomerUsageHistory error:", error);
      return [];
    }
  }
}
