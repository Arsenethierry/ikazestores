"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  CouponCodeModel,
  CouponUsageModel,
  DiscountModel,
} from "../models/DiscountModel";
import { ProductBadgeModel } from "../models/ProductBadgeModel";
import { ReturnPolicyModel } from "../models/ReturnPolicyModel";
import {
  AssignProductsToDiscountSchema,
  BulkCreateBadgesSchema,
  BulkUpdateDiscountStatusSchema,
  CalculateDiscountSchema,
  CreateCouponCodeSchema,
  CreateDiscountSchema,
  CreateProductBadgeSchema,
  CreateReturnPolicySchema,
  RemoveProductsFromDiscountSchema,
  UpdateDiscountSchema,
  UpdateProductBadgeSchema,
  UpdateReturnPolicySchema,
  UseCouponSchema,
  ValidateCouponSchema,
} from "../schemas/discount-schemas";
import { createSafeActionClient } from "next-safe-action";
import z from "zod";
import { checkStoreAccess } from "../helpers/store-permission-helper";
import { authMiddleware } from "./middlewares";
import {
  MARKETING_PERMISSIONS,
  STORE_PERMISSIONS,
} from "../helpers/permissions";
import { ProductModel } from "../models/ProductModel";

const action = createSafeActionClient({
  handleServerError: (error) => {
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

const discountModel = new DiscountModel();
const badgeModel = new ProductBadgeModel();
const policyModel = new ReturnPolicyModel();
const couponCodeModel = new CouponCodeModel();
const couponUsageModel = new CouponUsageModel();

export const createDiscountAction = action
  .use(authMiddleware)
  .schema(CreateDiscountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { storeId, storeType } = parsedInput;

    // ✅ Use centralized permission check
    const hasPermission = await checkStoreAccess(
      user.$id,
      storeId,
      MARKETING_PERMISSIONS.CREATE_DISCOUNTS,
      storeType
    );

    if (!hasPermission) {
      return {
        error: "Access denied: You don't have permission to create discounts",
      };
    }

    const result = await discountModel.createDiscount(parsedInput);

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath(
      `/admin/stores/${storeId}/${storeType}-store/marketing/discounts`
    );
    revalidateTag(`discounts-${storeId}`);

    return {
      success: true,
      message: "Discount created successfully",
      data: result,
    };
  });

export const updateDiscountAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      discountId: z.string().min(1),
      data: UpdateDiscountSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { discountId, data } = parsedInput;

    // Fetch existing discount to get storeId
    const existing = await discountModel.getDiscountById(discountId);
    if (!existing) {
      return { error: "Discount not found" };
    }

    // ✅ Use centralized permission check
    const hasPermission = await checkStoreAccess(
      user.$id,
      existing.storeId,
      MARKETING_PERMISSIONS.UPDATE_DISCOUNTS,
      existing.storeType as "physical" | "virtual"
    );

    if (!hasPermission) {
      return {
        error: "Access denied: You don't have permission to update discounts",
      };
    }

    const result = await discountModel.updateDiscount(discountId, data);

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath("/admin/*/marketing/discounts");
    revalidateTag(`discount-${discountId}`);

    return {
      success: true,
      message: "Discount updated successfully",
      data: result,
    };
  });

export const deleteDiscountAction = action
  .use(authMiddleware)
  .schema(z.object({ discountId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { discountId } = parsedInput;

    const existing = await discountModel.getDiscountById(discountId);
    if (!existing) {
      return { error: "Discount not found" };
    }

    const hasPermission = await checkStoreAccess(
      user.$id,
      existing.storeId,
      MARKETING_PERMISSIONS.DELETE_DISCOUNTS,
      existing.storeType as "physical" | "virtual"
    );

    if (!hasPermission) {
      return {
        error: "Access denied: You don't have permission to delete discounts",
      };
    }

    const result = await discountModel.deleteDiscount(discountId);

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

export const assignProductsToDiscountAction = action
  .use(authMiddleware)
  .schema(AssignProductsToDiscountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { discountId, productIds, storeId } = parsedInput;

    const hasPermission = await checkStoreAccess(
      user.$id,
      storeId,
      MARKETING_PERMISSIONS.UPDATE_DISCOUNTS,
      "physical"
    );

    if (!hasPermission) {
      return {
        error: "Access denied: You don't have permission to manage discounts",
      };
    }

    try {
      const discount = await discountModel.getDiscountById(discountId);
      if (!discount) {
        return { error: "Discount not found" };
      }

      if (discount.storeId !== storeId) {
        return { error: "Discount does not belong to this store" };
      }

      if (discount.applicableTo !== "products") {
        return {
          error: "Can only assign products to product-specific discounts",
        };
      }

      const existingTargetIds = discount.targetIds || [];
      const newTargetIds = [...new Set([...existingTargetIds, ...productIds])];

      const result = await discountModel.updateDiscount(discountId, {
        targetIds: newTargetIds,
      });

      if ("error" in result) {
        throw new Error(result.error);
      }

      revalidatePath("/admin/*/marketing/discounts");
      revalidateTag(`discount-${discountId}`);
      revalidateTag(`discounts-${storeId}`);

      return {
        success: true,
        message: `Successfully assigned ${productIds.length} product(s) to discount`,
        data: result,
      };
    } catch (error) {
      console.error("assignProductsToDiscount error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to assign products to discount",
      };
    }
  });

export const removeProductsFromDiscountAction = action
  .use(authMiddleware)
  .schema(RemoveProductsFromDiscountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { discountId, productIds, storeId } = parsedInput;

    const hasPermission = await checkStoreAccess(
      user.$id,
      storeId,
      MARKETING_PERMISSIONS.UPDATE_DISCOUNTS,
      "physical"
    );

    if (!hasPermission) {
      return {
        error: "Access denied: You don't have permission to manage discounts",
      };
    }

    try {
      const discount = await discountModel.getDiscountById(discountId);
      if (!discount) {
        return { error: "Discount not found" };
      }

      if (discount.storeId !== storeId) {
        return { error: "Discount does not belong to this store" };
      }

      if (discount.applicableTo !== "products") {
        return {
          error: "Can only remove products from product-specific discounts",
        };
      }

      const existingTargetIds = discount.targetIds || [];
      const newTargetIds = existingTargetIds.filter(
        (id) => !productIds.includes(id)
      );

      const result = await discountModel.updateDiscount(discountId, {
        targetIds: newTargetIds,
      });

      if ("error" in result) {
        throw new Error(result.error);
      }

      revalidatePath("/admin/*/marketing/discounts");
      revalidateTag(`discount-${discountId}`);
      revalidateTag(`discounts-${storeId}`);

      return {
        success: true,
        message: `Successfully removed ${productIds.length} product(s) from discount`,
        data: result,
      };
    } catch (error) {
      console.error("removeProductsFromDiscount error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove products from discount",
      };
    }
  });

export const bulkUpdateDiscountStatusAction = action
  .use(authMiddleware)
  .schema(BulkUpdateDiscountStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { discountIds, isActive, storeId } = parsedInput;

    const hasPermission = await checkStoreAccess(
      user.$id,
      storeId,
      MARKETING_PERMISSIONS.MANAGE_DISCOUNT_STATUS
    );

    if (!hasPermission) {
      return {
        error:
          "Access denied: You don't have permission to manage discount status",
      };
    }

    const result = await discountModel.bulkUpdateStatus(discountIds, isActive);

    revalidatePath("/admin/*/marketing/discounts");
    revalidateTag("discounts");

    return {
      success: true,
      message: `Updated ${result.success} discounts successfully`,
      data: result,
    };
  });

export const getDiscountProductsAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      discountId: z.string().min(1),
      storeId: z.string().min(1),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { discountId, storeId } = parsedInput;

    try {
      const discount = await discountModel.getDiscountById(discountId);
      if (!discount) {
        return { error: "Discount not found" };
      }

      if (discount.applicableTo !== "products" || !discount.targetIds?.length) {
        return {
          success: true,
          data: { products: [], total: 0 },
        };
      }

      const { ProductModel } = await import("../models/ProductModel");
      const productModel = new ProductModel();

      const products = await productModel.findMany({
        filters: [
          { field: "$id", operator: "equal", value: discount.targetIds },
          { field: "physicalStoreId", operator: "equal", value: storeId },
        ],
        limit: 100,
      });

      return {
        success: true,
        data: {
          products: products.documents,
          total: products.total,
        },
      };
    } catch (error) {
      console.error("getDiscountProducts error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch discount products",
      };
    }
  });

export const createCouponCodeAction = action
  .use(authMiddleware)
  .schema(CreateCouponCodeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { storeId } = parsedInput;

    const hasPermission = await checkStoreAccess(
      user.$id,
      storeId,
      MARKETING_PERMISSIONS.CREATE_COUPONS
    );

    if (!hasPermission) {
      return {
        error:
          "Access denied: You don't have permission to create coupon codes",
      };
    }

    const result = await couponCodeModel.createCouponCode(
      parsedInput.code,
      parsedInput.discountId,
      parsedInput.storeId,
      user.$id
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
    await couponUsageModel.recordUsage(
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
  .use(authMiddleware)
  .schema(CreateProductBadgeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { productId } = parsedInput;

    const { ProductModel } = await import("../models/ProductModel");
    const productModel = new ProductModel();
    const product = await productModel.findProductById(productId);

    if (!product) {
      return { error: "Product not found" };
    }

    const hasPermission = await checkStoreAccess(
      user.$id,
      product.physicalStoreId,
      MARKETING_PERMISSIONS.CREATE_BADGES,
      "physical"
    );

    if (!hasPermission) {
      return {
        error: "Access denied: You don't have permission to create badges",
      };
    }

    const result = await badgeModel.createBadge(parsedInput, user.$id);

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath(`/admin/stores/${product.physicalStoreId}/products`);
    revalidateTag(`badges-${productId}`);

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
  .use(authMiddleware)
  .schema(
    z.object({
      badgeId: z.string().min(1),
      data: UpdateProductBadgeSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { badgeId, data } = parsedInput;

    // Fetch badge to get productId
    const badge = await badgeModel.findById(badgeId, {});
    if (!badge) {
      return { error: "Badge not found" };
    }

    // Fetch product to get storeId
    const { ProductModel } = await import("../models/ProductModel");
    const productModel = new ProductModel();
    const product = await productModel.findProductById(badge.productId);

    if (!product) {
      return { error: "Product not found" };
    }

    // ✅ Use centralized permission check
    const hasPermission = await checkStoreAccess(
      user.$id,
      product.physicalStoreId,
      MARKETING_PERMISSIONS.UPDATE_BADGES,
      "physical"
    );

    if (!hasPermission) {
      return {
        error: "Access denied: You don't have permission to update badges",
      };
    }

    const result = await badgeModel.update(badgeId, data);

    revalidatePath(`/admin/stores/${product.physicalStoreId}/products`);
    revalidateTag(`badge-${badgeId}`);

    return {
      success: true,
      message: "Badge updated successfully",
      data: result,
    };
  });

export const deleteProductBadgeAction = action
  .use(authMiddleware)
  .schema(z.object({ badgeId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { badgeId } = parsedInput;

    const badge = await badgeModel.findById(badgeId, {});
    if (!badge) {
      return { error: "Badge not found" };
    }

    const { ProductModel } = await import("../models/ProductModel");
    const productModel = new ProductModel();
    const product = await productModel.findProductById(badge.productId);

    if (!product) {
      return { error: "Product not found" };
    }

    const hasPermission = await checkStoreAccess(
      user.$id,
      product.physicalStoreId,
      MARKETING_PERMISSIONS.DELETE_BADGES,
      "physical"
    );

    if (!hasPermission) {
      return {
        error: "Access denied: You don't have permission to delete badges",
      };
    }

    await badgeModel.delete(badgeId);

    revalidatePath(`/admin/stores/${product.physicalStoreId}/products`);
    revalidateTag(`badges-${badge.productId}`);

    return {
      success: true,
      message: "Badge deleted successfully",
    };
  });

export const createReturnPolicyAction = action
  .use(authMiddleware)
  .schema(CreateReturnPolicySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { storeId } = parsedInput;

    const hasPermission = await checkStoreAccess(
      user.$id,
      storeId,
      STORE_PERMISSIONS.CREATE_RETURN_POLICIES
    );

    if (!hasPermission) {
      return {
        error:
          "Access denied: You don't have permission to create return policies",
      };
    }

    const result = await policyModel.createPolicy(parsedInput, user.$id);

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath(`/admin/stores/${storeId}/settings/return-policies`);
    revalidateTag(`return-policies-${storeId}`);

    return {
      success: true,
      message: "Return policy created successfully",
      data: result,
    };
  });

export const updateReturnPolicyAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      policyId: z.string().min(1),
      data: UpdateReturnPolicySchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { policyId, data } = parsedInput;

    const existing = await policyModel.findById(policyId, {});
    if (!existing) {
      return { error: "Return policy not found" };
    }

    const hasPermission = await checkStoreAccess(
      user.$id,
      existing.storeId,
      STORE_PERMISSIONS.UPDATE_RETURN_POLICIES
    );

    if (!hasPermission) {
      return {
        error:
          "Access denied: You don't have permission to update return policies",
      };
    }

    const result = await policyModel.updatePolicy(policyId, data);

    if ("error" in result) {
      throw new Error(result.error);
    }

    revalidatePath(
      `/admin/stores/${existing.storeId}/settings/return-policies`
    );
    revalidateTag(`return-policy-${policyId}`);

    return {
      success: true,
      message: "Return policy updated successfully",
      data: result,
    };
  });

export const deleteReturnPolicyAction = action
  .use(authMiddleware)
  .schema(z.object({ policyId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { policyId } = parsedInput;

    const existing = await policyModel.findById(policyId, {});
    if (!existing) {
      return { error: "Return policy not found" };
    }

    const hasPermission = await checkStoreAccess(
      user.$id,
      existing.storeId,
      STORE_PERMISSIONS.DELETE_RETURN_POLICIES
    );

    if (!hasPermission) {
      return {
        error:
          "Access denied: You don't have permission to delete return policies",
      };
    }

    const result = await policyModel.deletePolicy(policyId);

    if (result.error) {
      throw new Error(result.error);
    }

    revalidatePath(
      `/admin/stores/${existing.storeId}/settings/return-policies`
    );
    revalidateTag(`return-policies-${existing.storeId}`);

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

export const getStoreProductsForDiscountAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      storeId: z.string().min(1, "Store ID is required"),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { storeId, search, page, limit } = parsedInput;

    try {
      // Check permissions
      const hasPermission = await checkStoreAccess(
        user.$id,
        storeId,
        MARKETING_PERMISSIONS.VIEW_DISCOUNTS,
        "physical"
      );

      if (!hasPermission) {
        return {
          error: "Access denied: You don't have permission to view products",
        };
      }

      const productModel = new ProductModel();
      const offset = (page - 1) * limit;

      const filters = [
        { field: "physicalStoreId", operator: "equal", value: storeId },
        { field: "status", operator: "equal", value: "active" },
      ];

      // Fetch products (with search if provided)
      const result = search
        ? await productModel.searchProducts(search, {
            filters,
            limit,
            offset,
            orderBy: "$createdAt",
            orderType: "desc",
          })
        : await productModel.findMany({
            filters,
            limit,
            offset,
            orderBy: "$createdAt",
            orderType: "desc",
          });

      const totalPages = Math.ceil(result.total / limit);

      return {
        success: true,
        data: {
          products: result.documents,
          total: result.total,
          currentPage: page,
          totalPages,
          hasMore: result.hasMore,
        },
      };
    } catch (error) {
      console.error("getStoreProductsForDiscount error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch store products",
      };
    }
  });
