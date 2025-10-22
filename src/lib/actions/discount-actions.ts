"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { DiscountModel } from "../models/DiscountModel";
import { ProductBadgeModel } from "../models/ProductBadgeModel";
import { ReturnPolicyModel } from "../models/ReturnPolicyModel";
import {
  BulkCreateBadgesSchema,
  BulkUpdateDiscountStatusSchema,
  CalculateDiscountSchema,
  CreateCouponCodeSchema,
  CreateDiscountSchema,
  CreateProductBadgeSchema,
  CreateReturnPolicySchema,
  UpdateDiscountSchema,
  UpdateProductBadgeSchema,
  UpdateReturnPolicySchema,
  UseCouponSchema,
  ValidateCouponSchema,
} from "../schemas/discount-schemas";
import { createSafeActionClient } from "next-safe-action";
import z from "zod";

const action = createSafeActionClient({
  handleServerError: (error) => {
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

const discountModel = new DiscountModel();
const badgeModel = new ProductBadgeModel();
const policyModel = new ReturnPolicyModel();

export const createDiscountAction = action
  .schema(CreateDiscountSchema)
  .action(async ({ parsedInput }) => {
    const result = await discountModel.createDiscount(parsedInput);

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath(
      `/admin/physical-store/${parsedInput.storeId}/marketing/discounts`
    );
    revalidatePath(
      `/admin/virtual-store/${parsedInput.storeId}/marketing/discounts`
    );
    revalidateTag(`discounts-${parsedInput.storeId}`);

    return {
      success: true,
      message: "Discount created successfully",
      data: result,
    };
  });

export const updateDiscountAction = action
  .schema(
    z.object({
      discountId: z.string().min(1),
      data: UpdateDiscountSchema,
    })
  )
  .action(async ({ parsedInput }) => {
    const result = await discountModel.updateDiscount(
      parsedInput.discountId,
      parsedInput.data
    );

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath("/admin/*/marketing/discounts");
    revalidateTag(`discount-${parsedInput.discountId}`);

    return {
      success: true,
      message: "Discount updated successfully",
      data: result,
    };
  });

export const deleteDiscountAction = action
  .schema(z.object({ discountId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const result = await discountModel.deleteDiscount(parsedInput.discountId);

    if (result.error) {
      throw new Error(result.error);
    }

    revalidatePath("/admin/*/marketing/discounts");
    revalidateTag("discounts");

    return {
      success: true,
      message: result.success,
    };
  });

export const bulkUpdateDiscountStatusAction = action
  .schema(BulkUpdateDiscountStatusSchema)
  .action(async ({ parsedInput }) => {
    const result = await discountModel.bulkUpdateStatus(
      parsedInput.discountIds,
      parsedInput.isActive
    );

    revalidatePath("/admin/*/marketing/discounts");
    revalidateTag("discounts");

    return {
      success: true,
      message: `Updated ${result.success} discounts successfully`,
      data: result,
    };
  });

export const createCouponCodeAction = action
  .schema(CreateCouponCodeSchema)
  .action(async ({ parsedInput }) => {
    const result = await discountModel.createCouponCode(
      parsedInput.code,
      parsedInput.discountId,
      parsedInput.storeId
    );

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath(`/admin/*/marketing/discounts/${parsedInput.discountId}`);
    revalidateTag(`coupons-${parsedInput.discountId}`);

    return {
      success: true,
      message: "Coupon code created successfully",
      data: result,
    };
  });

export const validateCouponAction = action
  .schema(ValidateCouponSchema)
  .action(async ({ parsedInput }) => {
    const result = await discountModel.validateCoupon(
      parsedInput.code,
      parsedInput.storeId,
      parsedInput.customerId,
      parsedInput.cartTotal
    );

    if (!result.valid) {
      throw new Error(result.error || "Invalid coupon");
    }

    return {
      success: true,
      message: "Coupon is valid",
      data: {
        discount: result.discount,
        coupon: result.coupon,
      },
    };
  });

export const useCouponAction = action
  .schema(UseCouponSchema)
  .action(async ({ parsedInput }) => {
    await discountModel.recordCouponUsage(
      parsedInput.couponCodeId,
      parsedInput.customerId,
      parsedInput.discountAmount,
      parsedInput.orderId
    );

    revalidateTag(`coupon-usage-${parsedInput.customerId}`);

    return {
      success: true,
      message: "Coupon usage recorded",
    };
  });

export const calculateFinalPriceAction = action
  .schema(CalculateDiscountSchema)
  .action(async ({ parsedInput }) => {
    const result = await discountModel.calculateFinalPrice(parsedInput);

    if ("error" in result) {
      throw new Error(result.error);
    }

    return {
      success: true,
      data: result,
    };
  });

export const createProductBadgeAction = action
  .schema(CreateProductBadgeSchema)
  .action(async ({ parsedInput }) => {
    const result = await badgeModel.createBadge(parsedInput);

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath(`/admin/*/products/${parsedInput.productId}`);
    revalidateTag(`product-${parsedInput.productId}`);
    revalidateTag(`badges-${parsedInput.productId}`);

    return {
      success: true,
      message: "Badge created successfully",
      data: result,
    };
  });

export const bulkCreateBadgesAction = action
  .schema(BulkCreateBadgesSchema)
  .action(async ({ parsedInput }) => {
    const result = await badgeModel.bulkCreateBadges(parsedInput);

    revalidatePath("/admin/*/products");
    revalidateTag("products");

    return {
      success: true,
      message: `Created ${result.success.length} badges successfully`,
      data: result,
    };
  });

export const updateProductBadgeAction = action
  .schema(
    z.object({
      badgeId: z.string().min(1),
      data: UpdateProductBadgeSchema,
    })
  )
  .action(async ({ parsedInput }) => {
    const result = await badgeModel.updateBadge(
      parsedInput.badgeId,
      parsedInput.data
    );

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath("/admin/*/products");
    revalidateTag(`badge-${parsedInput.badgeId}`);

    return {
      success: true,
      message: "Badge updated successfully",
      data: result,
    };
  });

export const deleteProductBadgeAction = action
  .schema(z.object({ badgeId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const result = await badgeModel.deleteBadge(parsedInput.badgeId);

    if (result.error) {
      throw new Error(result.error);
    }

    revalidatePath("/admin/*/products");
    revalidateTag("badges");

    return {
      success: true,
      message: result.success,
    };
  });

export const createReturnPolicyAction = action
  .schema(CreateReturnPolicySchema)
  .action(async ({ parsedInput }) => {
    const result = await policyModel.createPolicy(parsedInput);

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath(`/admin/*/settings/policies`);
    revalidateTag(`policies-${parsedInput.storeId}`);

    return {
      success: true,
      message: "Return policy created successfully",
      data: result,
    };
  });

export const updateReturnPolicyAction = action
  .schema(
    z.object({
      policyId: z.string().min(1),
      data: UpdateReturnPolicySchema,
    })
  )
  .action(async ({ parsedInput }) => {
    const result = await policyModel.updatePolicy(
      parsedInput.policyId,
      parsedInput.data
    );

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath("/admin/*/settings/policies");
    revalidateTag(`policy-${parsedInput.policyId}`);

    return {
      success: true,
      message: "Return policy updated successfully",
      data: result,
    };
  });

export const deleteReturnPolicyAction = action
  .schema(z.object({ policyId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const result = await policyModel.deletePolicy(parsedInput.policyId);

    if (result.error) {
      throw new Error(result.error);
    }

    revalidatePath("/admin/*/settings/policies");
    revalidateTag("policies");

    return {
      success: true,
      message: result.success,
    };
  });

export const getActiveDiscountsAction = action
  .schema(
    z.object({
      storeId: z.string().min(1),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    })
  )
  .action(async ({ parsedInput }) => {
    const result = await discountModel.getActiveDiscounts(parsedInput.storeId, {
      offset: parsedInput.page,
      limit: parsedInput.limit,
    });

    return {
      success: true,
      data: result,
    };
  });

export const getProductBadgesAction = action
  .schema(z.object({ productId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const badges = await badgeModel.getProductBadges(parsedInput.productId);

    return {
      success: true,
      data: badges,
    };
  });

export const getApplicablePolicyAction = action
  .schema(
    z.object({
      storeId: z.string().min(1),
      productId: z.string().optional(),
      categoryId: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const policy = await policyModel.getApplicablePolicy(
      parsedInput.storeId,
      parsedInput.productId,
      parsedInput.categoryId
    );

    return {
      success: true,
      data: policy,
    };
  });
