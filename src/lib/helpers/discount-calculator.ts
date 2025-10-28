import { Discounts } from "../types/appwrite/appwrite";

export interface PriceBreakdown {
  // Original prices
  originalBasePrice: number;
  discountAmount: number;
  discountedBasePrice: number;
  
  // Commission
  commission: number;
  
  // Final prices
  originalPriceWithCommission: number; // For strikethrough
  finalPrice: number; // Actual price customer pays
  
  // Display info
  totalSavings: number;
  hasDiscount: boolean;
  activeDiscount?: {
    id: string;
    name: string;
    amount: number;
    expiresAt?: string;
  };
}

export class DiscountCalculator {
  /**
   * Calculate price with simple fixed-amount discount
   * Formula: finalPrice = (basePrice - discount) + commission
   */
  static calculatePrice(
    originalBasePrice: number,
    commission: number,
    discount?: Discounts | null
  ): PriceBreakdown {
    // Check if discount is active and valid
    const activeDiscount = discount ? this.getActiveDiscount(discount) : null;
    const discountAmount = activeDiscount?.value || 0;

    // Step 1: Apply discount to original base price
    const discountedBasePrice = Math.max(0, originalBasePrice - discountAmount);

    // Step 2: Add commission
    const finalPrice = discountedBasePrice + commission;
    const originalPriceWithCommission = originalBasePrice + commission;

    return {
      originalBasePrice,
      discountAmount,
      discountedBasePrice,
      commission,
      originalPriceWithCommission,
      finalPrice,
      totalSavings: discountAmount,
      hasDiscount: discountAmount > 0,
      activeDiscount: activeDiscount
        ? {
            id: activeDiscount.$id,
            name: activeDiscount.name,
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

    // Only support fixed_amount discounts
    if (discount.discountType !== "fixed_amount" || discount.valueType !== "fixed") {
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
}