import z from "zod";

export const DiscountTypeEnum = z.enum([
  "percentage", // 20% off
  "fixed_amount", // $10 off
  "buy_x_get_y", // BOGO
  "bundle", // Buy together discount
  "bulk_pricing", // Volume discount
  "flash_sale", // Time-limited
  "first_time_buyer", // New customer only
]);

export const ValueTypeEnum = z.enum([
  "percentage", // e.g., 20 (means 20%)
  "fixed", // e.g., 100 (means 100 RWF)
]);

export const ApplicableToEnum = z.enum([
  "products", // Specific products
  "categories", // Entire categories
  "collections", // Product collections
  "store_wide", // All products
  "combinations", // Specific product combinations
]);

export const StoreTypeEnum = z.enum(["physical", "virtual"]);

export const BadgeTypeEnum = z.enum([
  "new",
  "sale",
  "limited",
  "bestseller",
  "featured",
  "exclusive",
  "trending",
  "low_stock",
  "pre_order",
  "custom",
]);

export const ShippingResponsibilityEnum = z.enum([
  "customer",
  "store",
  "shared",
]);

const BaseDiscountSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  storeType: StoreTypeEnum,
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  discountType: DiscountTypeEnum,
  valueType: ValueTypeEnum,
  value: z.number().min(0, "Value must be positive"),
  applicableTo: ApplicableToEnum,
  targetIds: z.array(z.string()).optional(),

  // Conditions
  minPurchaseAmount: z.number().min(0).optional(),
  minQuantity: z.number().int().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),

  // Date range
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end date",
    })
    .optional(),

  // Usage limits
  usageLimit: z.number().int().min(0).optional(),
  usageLimitPerCustomer: z.number().int().min(0).optional(),

  // Settings
  priority: z.number().int().min(0).max(100).default(0),
  canCombineWithOthers: z.boolean().default(false),
  isActive: z.boolean().default(true),

  // Customer restrictions
  excludedCustomerIds: z.array(z.string()).optional(),
  eligibleCustomerIds: z.array(z.string()).optional(),
  shippingCountries: z.array(z.string()).optional(),

  // Buy X Get Y specific
  buyXQuantity: z.number().int().min(0).optional(),
  getYQuantity: z.number().int().min(0).optional(),
});

export const CreateDiscountSchema = BaseDiscountSchema.refine(
  (data) => {
    if (data.discountType === "buy_x_get_y") {
      return data.buyXQuantity !== undefined && data.getYQuantity !== undefined;
    }
    return true;
  },
  {
    message: "Buy X Get Y requires buyXQuantity and getYQuantity",
    path: ["discountType"],
  }
)
  .refine(
    (data) => {
      if (data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.valueType === "percentage") {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: "Percentage value cannot exceed 100",
      path: ["value"],
    }
  );

export const UpdateDiscountSchema = BaseDiscountSchema.partial().extend({
  currentUsageCount: z.number().int().min(0).optional(),
});

export const BulkUpdateDiscountStatusSchema = z.object({
  discountIds: z.array(z.string()).min(1, "At least one discount required"),
  isActive: z.boolean(),
  storeId: z.string()
});

export const ApplyDiscountToProductsSchema = z.object({
  discountId: z.string().min(1, "Discount ID is required"),
  productIds: z.array(z.string()).min(1, "At least one product required"),
});

export const CreateCouponCodeSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric with _ or -"),
  discountId: z.string().min(1, "Discount ID is required"),
  storeId: z.string().min(1, "Store ID is required"),
  isActive: z.boolean().default(true),
});

export const ValidateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  storeId: z.string().min(1, "Store ID is required"),
  customerId: z.string().optional(),
  cartTotal: z.number().min(0).optional(),
  productIds: z.array(z.string()).optional(),
});

export const UseCouponSchema = z.object({
  couponCodeId: z.string().min(1, "Coupon code ID is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  orderId: z.string().optional(),
  discountAmount: z.number().min(0, "Discount amount must be positive"),
});

export const CreateProductBadgeSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  badgeType: BadgeTypeEnum,
  label: z.string().max(50).optional(),
  colorScheme: z
    .string()
    .max(50)
    .regex(/^[a-z-]+$/, "Invalid color scheme")
    .optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date",
    })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end date",
    })
    .optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(0),
});

export const UpdateProductBadgeSchema = CreateProductBadgeSchema.partial();

export const BulkCreateBadgesSchema = z.object({
  productIds: z.array(z.string()).min(1, "At least one product required"),
  badgeType: BadgeTypeEnum,
  label: z.string().max(100).optional(),
  colorScheme: z.string().max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priority: z.number().int().min(0).max(100).default(0),
});

export const CreateReturnPolicySchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
  isDefault: z.boolean().default(false),
  returnWindowDays: z
    .number()
    .int()
    .min(0)
    .max(365, "Return window cannot exceed 365 days"),
  allowReturns: z.boolean().default(true),
  allowExchanges: z.boolean().default(true),
  restockingFeePercent: z
    .number()
    .min(0)
    .max(100, "Restocking fee cannot exceed 100%")
    .default(0),
  conditions: z.string().max(2000).optional(),
  requiresOriginalPackaging: z.boolean().default(true),
  requiresReceipt: z.boolean().default(true),
  shippingCostResponsibility: ShippingResponsibilityEnum.optional(),
});

export const UpdateReturnPolicySchema = CreateReturnPolicySchema.partial();

export const CalculateDiscountSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  combinationId: z.string().optional(),
  basePrice: z.number().min(0, "Base price must be positive"),
  quantity: z.number().int().min(1).default(1),
  customerId: z.string().optional(),
  couponCode: z.string().optional(),
  storeId: z.string().min(1, "Store ID is required"),
});

export const PriceBreakdownSchema = z.object({
  originalPrice: z.number(),
  vendorDiscount: z.number().default(0),
  commission: z.number().default(0),
  influencerDiscount: z.number().default(0),
  couponDiscount: z.number().default(0),
  finalPrice: z.number(),
  totalSavings: z.number(),
  appliedDiscounts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number(),
      type: z.string(),
    })
  ),
});

export const AssignProductsToDiscountSchema = z.object({
  discountId: z.string().min(1, "Discount ID is required"),
  productIds: z.array(z.string()).min(1, "At least one product required"),
  storeId: z.string().min(1, "Store ID is required"),
});

export const RemoveProductsFromDiscountSchema = z.object({
  discountId: z.string().min(1, "Discount ID is required"),
  productIds: z.array(z.string()).min(1, "At least one product required"),
  storeId: z.string().min(1, "Store ID is required"),
});

export type CreateDiscountInput = z.infer<typeof CreateDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof UpdateDiscountSchema>;
export type CreateCouponCodeInput = z.infer<typeof CreateCouponCodeSchema>;
export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;
export type UseCouponInput = z.infer<typeof UseCouponSchema>;
export type CreateProductBadgeInput = z.infer<typeof CreateProductBadgeSchema>;
export type UpdateProductBadgeInput = z.infer<typeof UpdateProductBadgeSchema>;
export type BulkCreateBadgesInput = z.infer<typeof BulkCreateBadgesSchema>;
export type CreateReturnPolicyInput = z.infer<typeof CreateReturnPolicySchema>;
export type UpdateReturnPolicyInput = z.infer<typeof UpdateReturnPolicySchema>;
export type CalculateDiscountInput = z.infer<typeof CalculateDiscountSchema>;
export type PriceBreakdown = z.infer<typeof PriceBreakdownSchema>;
