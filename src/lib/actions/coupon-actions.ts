"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CouponCodeModel, CouponUsageModel } from "../models/DiscountModel";
import { createSafeActionClient } from "next-safe-action";
import z from "zod";
import { checkStoreAccess } from "../helpers/store-permission-helper";
import { authMiddleware } from "./middlewares";
import { MARKETING_PERMISSIONS } from "../helpers/permissions";

const action = createSafeActionClient({
  handleServerError: (error) => {
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

const couponCodeModel = new CouponCodeModel();
const couponUsageModel = new CouponUsageModel();

// Schema for toggling coupon status
const ToggleCouponStatusSchema = z.object({
  couponId: z.string().min(1),
  isActive: z.boolean(),
  storeId: z.string().min(1),
});

// Schema for deleting coupon
const DeleteCouponSchema = z.object({
  couponId: z.string().min(1),
  storeId: z.string().min(1),
});

// Schema for bulk operations
const BulkCouponOperationSchema = z.object({
  couponIds: z.array(z.string()).min(1),
  operation: z.enum(["activate", "deactivate", "delete"]),
  storeId: z.string().min(1),
});

export const toggleCouponStatusAction = action
  .use(authMiddleware)
  .schema(ToggleCouponStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { couponId, isActive, storeId } = parsedInput;

    const result = await couponCodeModel.updateCouponStatus(
      couponId,
      isActive,
      storeId
    );

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath("/admin/*/marketing/discounts/[discountId]");
    revalidateTag(`coupons-${result.discountId}`);

    return {
      success: true,
      message: `Coupon ${isActive ? "activated" : "deactivated"} successfully`,
      data: result,
    };
  });

export const deleteCouponAction = action
  .use(authMiddleware)
  .schema(DeleteCouponSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { couponId, storeId } = parsedInput;

    const coupon = await couponCodeModel.getCouponById(couponId);
    if (!coupon) {
      return { error: "Coupon not found" };
    }

    const result = await couponCodeModel.deleteCoupon(couponId, storeId);

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath("/admin/*/marketing/discounts/[discountId]");
    revalidateTag(`coupons-${coupon.discountId}`);

    return {
      success: true,
      message: "Coupon deleted successfully",
    };
  });

export const bulkCouponOperationAction = action
  .use(authMiddleware)
  .schema(BulkCouponOperationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { couponIds, operation, storeId } = parsedInput;

    let successCount = 0;
    let errorCount = 0;

    for (const couponId of couponIds) {
      try {
        if (operation === "delete") {
          await couponCodeModel.deleteCoupon(couponId, storeId);
        } else {
          const isActive = operation === "activate";
          await couponCodeModel.updateCouponStatus(couponId, isActive, storeId);
        }
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to ${operation} coupon ${couponId}:`, error);
      }
    }

    revalidatePath("/admin/*/marketing/discounts/[discountId]");

    return {
      success: true,
      message: `${successCount} coupon(s) ${operation}d successfully${
        errorCount > 0 ? `, ${errorCount} failed` : ""
      }`,
      data: { successCount, errorCount },
    };
  });

export const getCouponUsageAction = action
  .schema(z.object({ couponId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const { couponId } = parsedInput;

    const usage = await couponUsageModel.getCouponUsage(couponId);

    return {
      success: true,
      data: usage,
    };
  });
