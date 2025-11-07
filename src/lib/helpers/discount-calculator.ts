import { Discounts } from "../types/appwrite-types";

export interface PriceBreakdown {
  // Original prices
  originalBasePrice: number;
  discountAmount: number;
  discountedBasePrice: number;

  // For virtual stores (commission)
  commission: number;

  // Final prices
  originalPriceWithCommission: number; // For strikethrough
  finalPrice: number; // Actual price customer pays

  // Display info
  totalSavings: number;
  hasDiscount: boolean;
  discountPercentage: number;
  activeDiscount?: {
    id: string;
    name: string;
    type: string;
    amount: number;
    expiresAt?: string;
  };
}

export class DiscountCalculator {
  /**
   * Calculate price with discount support (both fixed_amount and percentage)
   * For Physical Store: finalPrice = basePrice - discount
   * For Virtual Store: finalPrice = (basePrice - discount) + commission
   */
  static calculatePrice(
    originalBasePrice: number,
    commission: number = 0,
    discount?: Discounts | null
  ): PriceBreakdown {
    // Check if discount is active and valid
    const activeDiscount = discount ? this.getActiveDiscount(discount) : null;
    let discountAmount = 0;

    // Calculate discount amount based on type
    if (activeDiscount) {
      if (
        activeDiscount.discountType === "fixed_amount" &&
        activeDiscount.valueType === "fixed"
      ) {
        // Fixed amount discount
        discountAmount = activeDiscount.value;
      } else if (
        activeDiscount.discountType === "percentage" &&
        activeDiscount.valueType === "percentage"
      ) {
        // Percentage discount
        discountAmount = (originalBasePrice * activeDiscount.value) / 100;
      }

      // Apply max discount cap if specified
      if (
        activeDiscount.maxDiscountAmount &&
        discountAmount > activeDiscount.maxDiscountAmount
      ) {
        discountAmount = activeDiscount.maxDiscountAmount;
      }
    }

    // Step 1: Apply discount to original base price
    const discountedBasePrice = Math.max(0, originalBasePrice - discountAmount);

    // Step 2: Add commission (for virtual stores)
    const finalPrice = discountedBasePrice + commission;
    const originalPriceWithCommission = originalBasePrice + commission;

    // Calculate discount percentage for display
    const discountPercentage =
      originalBasePrice > 0 && discountAmount > 0
        ? Math.round((discountAmount / originalBasePrice) * 100)
        : 0;

    return {
      originalBasePrice,
      discountAmount,
      discountedBasePrice,
      commission,
      originalPriceWithCommission,
      finalPrice,
      totalSavings: discountAmount,
      hasDiscount: discountAmount > 0,
      discountPercentage,
      activeDiscount: activeDiscount
        ? {
            id: activeDiscount.$id,
            name: activeDiscount.name,
            type: activeDiscount.discountType,
            amount: discountAmount,
            expiresAt: activeDiscount.endDate || undefined,
          }
        : undefined,
    };
  }

  /**
   * Get active discount if valid, otherwise return null
   */
  private static getActiveDiscount(discount: Discounts): Discounts | null {
    if (!discount.isActive) return null;

    // Check date range
    const now = new Date();
    const startDate = new Date(discount.startDate);
    if (startDate > now) return null;

    if (discount.endDate) {
      const endDate = new Date(discount.endDate);
      if (endDate < now) return null;
    }

    // Check usage limits
    if (
      discount.usageLimit &&
      discount.currentUsageCount &&
      discount.currentUsageCount >= discount.usageLimit
    ) {
      return null;
    }

    // Support both fixed_amount and percentage discounts
    if (
      !(
        discount.discountType === "fixed_amount" &&
        discount.valueType === "fixed"
      ) &&
      !(
        discount.discountType === "percentage" &&
        discount.valueType === "percentage"
      )
    ) {
      return null;
    }

    return discount;
  }

  /**
   * Check if discount is expiring soon (within 24 hours)
   */
  static isExpiringSoon(discount?: Discounts): boolean {
    if (!discount?.endDate) return false;
    const expiresAt = new Date(discount.endDate).getTime();
    const now = new Date().getTime();
    const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
    return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
  }

  /**
   * Format price for display
   */
  static formatPrice(amount: number, currency: string = "RWF"): string {
    return `${currency} ${amount.toLocaleString()}`;
  }

  /**
   * Compare two discounts and return the best one (most savings)
   */
  static getBestDiscount(
    basePrice: number,
    discount1?: Discounts | null,
    discount2?: Discounts | null
  ): Discounts | null {
    if (!discount1 && !discount2) return null;
    if (!discount1) return discount2!;
    if (!discount2) return discount1!;

    const savings1 = this.calculatePrice(
      basePrice,
      0,
      discount1
    ).discountAmount;
    const savings2 = this.calculatePrice(
      basePrice,
      0,
      discount2
    ).discountAmount;

    // If savings are equal, use priority
    if (savings1 === savings2) {
      return discount1.priority > discount2.priority ? discount1 : discount2;
    }

    return savings1 > savings2 ? discount1 : discount2;
  }
}
