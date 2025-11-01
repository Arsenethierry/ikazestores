import { ID, Query } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import {
  BaseModel,
  PaginationResult,
  QueryFilter,
  QueryOptions,
} from "../core/database";
import {
  COUPON_CODES_COLLECTION_ID,
  COUPON_USAGE_COLLECTION_ID,
  DATABASE_ID,
  DISCOUNTS_COLLECTION_ID,
} from "../env-config";
import {
  CalculateDiscountInput,
  CreateDiscountInput,
  PriceBreakdown,
  UpdateDiscountInput,
} from "../schemas/discount-schemas";
import { CouponCodes, CouponUsage, Discounts } from "../types/appwrite-types";
import { getAuthState } from "../user-permission";
import { checkStoreAccess } from "../helpers/store-permission-helper";
import { MARKETING_PERMISSIONS } from "../helpers/permissions";

export class DiscountModel extends BaseModel<Discounts> {
  constructor() {
    super(DISCOUNTS_COLLECTION_ID);
  }

  private get couponCodeModel() {
    return new CouponCodeModel();
  }

  private get couponUsageModel() {
    return new CouponUsageModel();
  }

  async createDiscount(
    data: CreateDiscountInput
  ): Promise<Discounts | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const hasPermission = await checkStoreAccess(
        user.$id,
        data.storeId,
        "marketing.discounts.create"
      );

      if (!hasPermission) {
        return {
          error: "You don't have permission to create discounts for this store",
        };
      }

      const validationError = this.validateDiscountConstraints(data);
      if (validationError) {
        return { error: validationError };
      }

      const discount = await this.create(
        {
          ...data,
          currentUsageCount: 0,
          createdBy: user.$id,
          targetIds: data.targetIds || [],
          excludedCustomerIds: data.excludedCustomerIds || [],
          eligibleCustomerIds: data.eligibleCustomerIds || [],
          shippingCountries: data.shippingCountries || [],
        },
        user.$id
      );

      return discount;
    } catch (error) {
      console.error("createDiscount error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to create discount" };
    }
  }

  async bulkCreateDiscounts(
    discounts: CreateDiscountInput[]
  ): Promise<{ success: Discounts[]; errors: string[] }> {
    const success: Discounts[] = [];
    const errors: string[] = [];

    for (const discountData of discounts) {
      const result = await this.createDiscount(discountData);
      if ("error" in result) {
        errors.push(result.error);
      } else {
        success.push(result);
      }
    }

    return { success, errors };
  }

  async getActiveDiscountForProduct(
    productId: string,
    physicalStoreId: string
  ): Promise<Discounts | null> {
    try {
      const now = new Date().toISOString();

      const result = await this.findMany({
        filters: [
          { field: "storeId", operator: "equal", value: physicalStoreId },
          { field: "storeType", operator: "equal", value: "physical" },
          { field: "isActive", operator: "equal", value: true },
          { field: "discountType", operator: "equal", value: "fixed_amount" },
          { field: "valueType", operator: "equal", value: "fixed" },
          { field: "startDate", operator: "lessThanEqual", value: now },
        ],
        limit: 20,
        orderBy: "priority",
        orderType: "desc",
      });

      const applicableDiscounts = result.documents.filter((discount) => {
        // Check end date
        if (discount.endDate && new Date(discount.endDate) < new Date()) {
          return false;
        }

        // Check usage limit
        if (
          discount.usageLimit &&
          discount.currentUsageCount &&
          discount.currentUsageCount >= discount.usageLimit
        ) {
          return false;
        }

        // Check if applicable to this product
        if (discount.applicableTo === "store_wide") return true;

        if (
          discount.applicableTo === "products" &&
          discount.targetIds?.includes(productId)
        ) {
          return true;
        }

        return false;
      });

      // Return the highest priority discount
      return applicableDiscounts[0] || null;
    } catch (error) {
      console.error("getActiveDiscountForProduct error:", error);
      return null;
    }
  }

  async getActiveDiscountsForProducts(
    productIds: string[],
    physicalStoreId: string
  ): Promise<Map<string, Discounts | null>> {
    try {
      const now = new Date().toISOString();

      const result = await this.findMany({
        filters: [
          { field: "storeId", operator: "equal", value: physicalStoreId },
          { field: "storeType", operator: "equal", value: "physical" },
          { field: "isActive", operator: "equal", value: true },
          { field: "discountType", operator: "equal", value: "fixed_amount" },
          { field: "valueType", operator: "equal", value: "fixed" },
          { field: "startDate", operator: "lessThanEqual", value: now },
        ],
        limit: 100,
        orderBy: "priority",
        orderType: "desc",
      });

      // Filter valid discounts
      const validDiscounts = result.documents.filter((discount) => {
        if (discount.endDate && new Date(discount.endDate) < new Date()) {
          return false;
        }
        if (
          discount.usageLimit &&
          discount.currentUsageCount &&
          discount.currentUsageCount >= discount.usageLimit
        ) {
          return false;
        }
        return true;
      });

      // Map productId to best discount
      const discountMap = new Map<string, Discounts | null>();

      productIds.forEach((productId) => {
        // Find applicable discounts for this product
        const applicable = validDiscounts.filter((discount) => {
          if (discount.applicableTo === "store_wide") return true;
          if (
            discount.applicableTo === "products" &&
            discount.targetIds?.includes(productId)
          ) {
            return true;
          }
          return false;
        });

        // Set the highest priority one
        discountMap.set(productId, applicable[0] || null);
      });

      return discountMap;
    } catch (error) {
      console.error("getActiveDiscountsForProducts error:", error);
      return new Map();
    }
  }

  async getActiveDiscounts(
    storeId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Discounts>> {
    const now = new Date().toISOString();

    const filters: QueryFilter[] = [
      { field: "storeId", operator: "equal", value: storeId },
      { field: "isActive", operator: "equal", value: true },
      { field: "startDate", operator: "lessThanEqual", value: now },
    ];

    return this.findMany({
      ...options,
      filters,
      orderBy: "priority",
      orderType: "desc",
    });
  }

  async getStoreWideDiscount(
    physicalStoreId: string
  ): Promise<Discounts | null> {
    try {
      const now = new Date().toISOString();

      const result = await this.findMany({
        filters: [
          { field: "storeId", operator: "equal", value: physicalStoreId },
          { field: "storeType", operator: "equal", value: "physical" },
          { field: "applicableTo", operator: "equal", value: "store_wide" },
          { field: "isActive", operator: "equal", value: true },
          { field: "discountType", operator: "equal", value: "fixed_amount" },
          { field: "valueType", operator: "equal", value: "fixed" },
          { field: "startDate", operator: "lessThanEqual", value: now },
        ],
        limit: 1,
        orderBy: "priority",
        orderType: "desc",
      });

      if (result.documents.length === 0) return null;

      const discount = result.documents[0];

      // Validate end date and usage
      if (discount.endDate && new Date(discount.endDate) < new Date()) {
        return null;
      }
      if (
        discount.usageLimit &&
        discount.currentUsageCount &&
        discount.currentUsageCount >= discount.usageLimit
      ) {
        return null;
      }

      return discount;
    } catch (error) {
      console.error("getStoreWideDiscount error:", error);
      return null;
    }
  }

  async getDiscountById(discountId: string): Promise<Discounts | null> {
    return this.findById(discountId, {});
  }

  async getApplicableDiscounts(
    productId: string,
    storeId: string,
    customerId?: string
  ): Promise<Discounts[]> {
    try {
      const now = new Date().toISOString();

      const filters: QueryFilter[] = [
        { field: "storeId", operator: "equal", value: storeId },
        { field: "isActive", operator: "equal", value: true },
        { field: "startDate", operator: "lessThanEqual", value: now },
      ];

      const allDiscounts = await this.findMany({ filters, limit: 100 });

      // Filter applicable discounts
      const applicable = allDiscounts.documents.filter((discount) => {
        // Check end date
        if (discount.endDate && new Date(discount.endDate) < new Date()) {
          return false;
        }

        // Check usage limit
        if (
          discount.usageLimit &&
          discount.currentUsageCount &&
          discount.currentUsageCount >= discount.usageLimit
        ) {
          return false;
        }

        // Check customer eligibility
        if (customerId) {
          if (discount.excludedCustomerIds?.includes(customerId)) {
            return false;
          }
          if (
            discount.eligibleCustomerIds &&
            discount.eligibleCustomerIds.length > 0 &&
            !discount.eligibleCustomerIds.includes(customerId)
          ) {
            return false;
          }
        }

        // Check if discount applies to this product
        if (discount.applicableTo === "products") {
          return discount.targetIds?.includes(productId);
        }

        // Store-wide discounts always apply
        if (discount.applicableTo === "store_wide") {
          return true;
        }

        return false;
      });

      return applicable.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error("getApplicableDiscounts error:", error);
      return [];
    }
  }

  async validateCoupon(
    code: string,
    storeId: string,
    customerId?: string,
    cartTotal?: number,
    productIds?: string[]
  ): Promise<{
    valid: boolean;
    error?: string;
    discount?: Discounts;
    coupon?: CouponCodes;
  }> {
    try {
      const coupon = await this.couponCodeModel.getCouponByCode(code, storeId);

      if (!coupon) {
        return {
          valid: false,
          error: "Coupon code not found or not valid for this store",
        };
      }

      // Step 2: Check if coupon is active
      if (!coupon.isActive) {
        return {
          valid: false,
          error: "This coupon code is currently inactive",
        };
      }

      // Step 3: Get associated discount
      const discount = await this.getDiscountById(coupon.discountId);

      if (!discount) {
        return {
          valid: false,
          error: "Associated discount not found",
        };
      }

      // Step 4: Check if discount is active
      if (!discount.isActive) {
        return {
          valid: false,
          error: "This discount is currently inactive",
        };
      }

      // Step 5: Validate date range
      const now = new Date();
      const startDate = new Date(discount.startDate);

      if (now < startDate) {
        return {
          valid: false,
          error: `This coupon will be valid starting ${startDate.toLocaleDateString()}`,
        };
      }

      if (discount.endDate) {
        const endDate = new Date(discount.endDate);
        if (now > endDate) {
          return {
            valid: false,
            error: "This coupon has expired",
          };
        }
      }

      // Step 6: Check total usage limit
      if (discount.usageLimit) {
        const currentUsage = discount.currentUsageCount || 0;
        if (currentUsage >= discount.usageLimit) {
          return {
            valid: false,
            error: "This coupon has reached its usage limit",
          };
        }
      }

      // Step 7: Check per-customer usage limit
      if (customerId && discount.usageLimitPerCustomer) {
        const customerUsageCount =
          await this.couponUsageModel.getCustomerUsageCount(
            coupon.$id,
            customerId
          );

        if (customerUsageCount >= discount.usageLimitPerCustomer) {
          return {
            valid: false,
            error: "You have reached the usage limit for this coupon",
          };
        }
      }

      // Step 8: Check customer eligibility
      if (customerId) {
        // Check if customer is excluded
        if (discount.excludedCustomerIds?.includes(customerId)) {
          return {
            valid: false,
            error: "This coupon is not available for your account",
          };
        }

        // Check if there's a whitelist and customer is not in it
        if (
          discount.eligibleCustomerIds &&
          discount.eligibleCustomerIds.length > 0 &&
          !discount.eligibleCustomerIds.includes(customerId)
        ) {
          return {
            valid: false,
            error: "This coupon is not available for your account",
          };
        }
      }

      // Step 9: Check minimum purchase amount
      if (discount.minPurchaseAmount && cartTotal !== undefined) {
        if (cartTotal < discount.minPurchaseAmount) {
          return {
            valid: false,
            error: `Minimum purchase of ${discount.minPurchaseAmount} RWF required`,
          };
        }
      }

      // Step 10: Check product applicability
      if (productIds && productIds.length > 0) {
        if (discount.applicableTo === "products") {
          // Check if at least one product in cart is in the discount's target products
          const hasApplicableProduct = productIds.some((productId) =>
            discount.targetIds?.includes(productId)
          );

          if (!hasApplicableProduct) {
            return {
              valid: false,
              error: "This coupon is not applicable to items in your cart",
            };
          }
        }
        // For store_wide, categories, and collections, assume validation passes
        // Additional category/collection checks can be added here if needed
      }

      // Step 11: All validations passed
      return {
        valid: true,
        discount,
        coupon,
      };
    } catch (error) {
      console.error("validateCoupon error:", error);
      return {
        valid: false,
        error: "Failed to validate coupon. Please try again.",
      };
    }
  }

  async updateDiscount(
    discountId: string,
    data: UpdateDiscountInput
  ): Promise<Discounts | { error: string }> {
    try {
      const existing = await this.findById(discountId, {});
      if (!existing) {
        return { error: "Discount not found" };
      }

      const updated = await this.update(discountId, data);
      return updated;
    } catch (error) {
      console.error("updateDiscount error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update discount" };
    }
  }

  async incrementUsageCount(discountId: string): Promise<void> {
    try {
      const discount = await this.findById(discountId, {});
      if (!discount) return;

      await this.update(discountId, {
        currentUsageCount: (discount.currentUsageCount || 0) + 1,
      });
    } catch (error) {
      console.error("incrementUsageCount error:", error);
    }
  }

  async bulkUpdateStatus(
    discountIds: string[],
    isActive: boolean
  ): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    for (const discountId of discountIds) {
      const result = await this.updateDiscount(discountId, { isActive });
      if ("error" in result) {
        errors++;
      } else {
        success++;
      }
    }

    return { success, errors };
  }

  async deleteDiscount(
    discountId: string
  ): Promise<{ success?: string; error?: string }> {
    try {
      await this.deleteCouponsByDiscount(discountId);
      await this.deleteCouponUsageByDiscount(discountId);
      await this.delete(discountId);

      return { success: "Discount and all related data deleted successfully" };
    } catch (error) {
      console.error("deleteDiscount error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete discount" };
    }
  }

  private async deleteCouponsByDiscount(discountId: string): Promise<void> {
    try {
      const { databases } = await createSessionClient();

      const coupons = await databases.listDocuments(
        DATABASE_ID,
        COUPON_CODES_COLLECTION_ID,
        [Query.equal("discountId", discountId), Query.limit(1000)]
      );

      const batchSize = 10;
      for (let i = 0; i < coupons.documents.length; i += batchSize) {
        await Promise.all(
          coupons.documents
            .slice(i, i + batchSize)
            .map((coupon) =>
              databases.deleteDocument(
                DATABASE_ID,
                COUPON_CODES_COLLECTION_ID,
                coupon.$id
              )
            )
        );
      }

      console.log(
        `Deleted ${coupons.documents.length} coupon codes for discount ${discountId}`
      );
    } catch (error) {
      console.error("deleteCouponsByDiscount error:", error);
    }
  }

  private async deleteCouponUsageByDiscount(discountId: string): Promise<void> {
    try {
      const { databases } = await createSessionClient();

      const coupons = await databases.listDocuments(
        DATABASE_ID,
        COUPON_CODES_COLLECTION_ID,
        [Query.equal("discountId", discountId), Query.limit(1000)]
      );

      for (const coupon of coupons.documents) {
        const usageRecords = await databases.listDocuments(
          DATABASE_ID,
          COUPON_USAGE_COLLECTION_ID,
          [Query.equal("couponCodeId", coupon.$id), Query.limit(1000)]
        );

        // Delete in batches
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
      }

      console.log(`Deleted coupon usage records for discount ${discountId}`);
    } catch (error) {
      console.error("deleteCouponUsageByDiscount error:", error);
    }
  }

  private validateDiscountConstraints(
    data: CreateDiscountInput
  ): string | null {
    if (data.discountType === "buy_x_get_y") {
      if (!data.buyXQuantity || !data.getYQuantity) {
        return "Buy X Get Y requires buyXQuantity and getYQuantity";
      }
    }

    if (data.storeType === "physical" && data.discountType === "bulk_pricing") {
      return "Bulk pricing is only available for virtual stores";
    }

    if (data.storeType === "virtual" && data.discountType === "buy_x_get_y") {
      return "Buy X Get Y is only available for physical stores";
    }

    return null;
  }

  async calculateFinalPrice(
    data: CalculateDiscountInput
  ): Promise<PriceBreakdown | { error: string }> {
    try {
      const { productId, basePrice, quantity, customerId, storeId } = data;

      let currentPrice = basePrice;
      const appliedDiscounts: Array<{
        id: string;
        name: string;
        amount: number;
        type: string;
      }> = [];

      // Get applicable discounts
      const discounts = await this.getApplicableDiscounts(
        productId,
        storeId,
        customerId
      );

      // Apply vendor discount (physical store)
      const vendorDiscount = discounts.find(
        (d) => d.storeType === "physical" && d.priority > 0
      );
      let vendorDiscountAmount = 0;

      if (vendorDiscount) {
        vendorDiscountAmount = this.calculateDiscountAmount(
          vendorDiscount,
          currentPrice,
          quantity
        );
        currentPrice -= vendorDiscountAmount;
        appliedDiscounts.push({
          id: vendorDiscount.$id,
          name: vendorDiscount.name,
          amount: vendorDiscountAmount,
          type: "vendor_discount",
        });
      }

      // Commission would be added here (handled by affiliate model)
      const commission = 0;

      // Apply influencer discount (virtual store)
      const influencerDiscount = discounts.find(
        (d) => d.storeType === "virtual" && d.canCombineWithOthers
      );
      let influencerDiscountAmount = 0;

      if (influencerDiscount) {
        influencerDiscountAmount = this.calculateDiscountAmount(
          influencerDiscount,
          currentPrice + commission,
          quantity
        );
        appliedDiscounts.push({
          id: influencerDiscount.$id,
          name: influencerDiscount.name,
          amount: influencerDiscountAmount,
          type: "influencer_discount",
        });
      }

      const finalPrice = Math.max(
        0,
        currentPrice + commission - influencerDiscountAmount
      );

      const totalSavings = vendorDiscountAmount + influencerDiscountAmount;

      return {
        originalPrice: basePrice,
        vendorDiscount: vendorDiscountAmount,
        commission,
        influencerDiscount: influencerDiscountAmount,
        couponDiscount: 0,
        finalPrice,
        totalSavings,
        appliedDiscounts,
      };
    } catch (error) {
      console.error("calculateFinalPrice error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to calculate price" };
    }
  }

  private calculateDiscountAmount(
    discount: Discounts,
    price: number,
    quantity: number
  ): number {
    let discountAmount = 0;

    switch (discount.discountType) {
      case "percentage":
        if (discount.valueType === "percentage") {
          discountAmount = (price * discount.value) / 100;
        }
        break;

      case "fixed_amount":
        if (discount.valueType === "fixed") {
          discountAmount = discount.value;
        }
        break;

      case "buy_x_get_y":
        if (discount.buyXQuantity && discount.getYQuantity) {
          const sets = Math.floor(quantity / discount.buyXQuantity);
          const freeItems = sets * discount.getYQuantity;
          const pricePerItem = price / quantity;
          discountAmount = freeItems * pricePerItem;
        }
        break;

      case "bulk_pricing":
        if (discount.minQuantity && quantity >= discount.minQuantity) {
          if (discount.valueType === "percentage") {
            discountAmount = (price * discount.value) / 100;
          } else {
            discountAmount = discount.value * quantity;
          }
        }
        break;

      default:
        if (discount.valueType === "percentage") {
          discountAmount = (price * discount.value) / 100;
        } else {
          discountAmount = discount.value;
        }
    }

    // Apply maximum discount cap
    if (discount.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
    }

    return Math.max(0, discountAmount);
  }
}

export class CouponCodeModel extends BaseModel<CouponCodes> {
  constructor() {
    super(COUPON_CODES_COLLECTION_ID);
  }

  async createCouponCode(
    code: string,
    discountId: string,
    storeId: string,
    userId: string
  ): Promise<CouponCodes | { error: string }> {
    try {
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
        userId
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

  async getCouponById(couponId: string): Promise<CouponCodes | null> {
    try {
      const { databases } = await createSessionClient();
      const coupon = await databases.getDocument(
        DATABASE_ID,
        COUPON_CODES_COLLECTION_ID,
        couponId
      );
      return coupon as CouponCodes;
    } catch (error) {
      console.error("getCouponById error:", error);
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
        MARKETING_PERMISSIONS.UPDATE_DISCOUNTS
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
        MARKETING_PERMISSIONS.DELETE_DISCOUNTS
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

  async getCouponsByDiscountPaginated(
    discountId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult<CouponCodes>> {
    try {
      const { databases } = await createSessionClient();
      const offset = (page - 1) * limit;

      const result = await databases.listDocuments(
        DATABASE_ID,
        COUPON_CODES_COLLECTION_ID,
        [
          Query.equal("discountId", discountId),
          Query.orderDesc("$createdAt"),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );

      const hasMore = offset + result.documents.length < result.total;

      return {
        documents: result.documents as CouponCodes[],
        total: result.total,
        limit: limit,
        offset,
        hasMore,
      };
    } catch (error) {
      console.error("getCouponsByDiscountPaginated error:", error);
      return { documents: [], total: 0, hasMore: false, limit, offset: 0 };
    }
  }
}

export class CouponUsageModel extends BaseModel<CouponUsage> {
  constructor() {
    super(COUPON_USAGE_COLLECTION_ID);
  }

  private get couponModel() {
    return new CouponCodeModel();
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

      await this.couponModel.incrementCouponUsage(couponCodeId);

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

  async getCouponUsage(couponId: string): Promise<{
    totalUses: number;
    uniqueCustomers: number;
    totalDiscount: number;
    recentUsage: CouponUsage[];
  }> {
    try {
      const usageRecords = await this.findMany({
        filters: [
          { field: "couponCodeId", operator: "equal", value: couponId },
        ],
      });

      const records = usageRecords.documents as CouponUsage[];
      const uniqueCustomers = new Set(records.map((r) => r.customerId)).size;
      const totalDiscount = records.reduce(
        (sum, r) => sum + (r.discountAmount || 0),
        0
      );

      return {
        totalUses: records.length,
        uniqueCustomers,
        totalDiscount,
        recentUsage: records.slice(0, 10),
      };
    } catch (error) {
      console.error("getCouponUsage error:", error);
      return {
        totalUses: 0,
        uniqueCustomers: 0,
        totalDiscount: 0,
        recentUsage: [],
      };
    }
  }
}
