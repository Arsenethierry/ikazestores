"use server";

import { createSafeActionClient } from "next-safe-action";
import { PaginationResult, QueryOptions } from "../core/database";
import { AffiliateProductModel } from "../models/AffliateProductModel";
import {
  CreateAffiliateImportSchema,
  UpdateAffiliateImportSchema,
} from "../schemas/products-schems";
import { VirtualProductTypes } from "../types";
import { authMiddleware } from "./middlewares";
import { revalidatePath } from "next/cache";
import z from "zod";

const action = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Server action error:", error);
    return error.message;
  },
});

const affiliateProductModel = new AffiliateProductModel();

export const importProductAction = action
  .schema(CreateAffiliateImportSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput: data, ctx }) => {
    const { user } = ctx;

    try {
      const result = await affiliateProductModel.importProduct(data);

      if ("error" in result) {
        throw new Error(result.error);
      }

      revalidatePath(`/store/${data.virtualStoreId}/products`);
      revalidatePath("/admin/products");

      return {
        success: true,
        data: result,
        message: "Product imported successfully!",
      };
    } catch (error) {
      console.error("importProductAction error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to import product"
      );
    }
  });

export const updateAffiliateImportAction = action
  .schema(
    z.object({
      importId: z.string(),
      data: UpdateAffiliateImportSchema,
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput: { importId, data } }) => {
    try {
      const result = await affiliateProductModel.updateImport(importId, data);

      if ("error" in result) {
        throw new Error(result.error);
      }

      revalidatePath(`/store/${result.virtualStoreId}/products`);
      revalidatePath(`/admin/products/${importId}`);

      return {
        success: true,
        data: result,
        message: "Import updated successfully!",
      };
    } catch (error) {
      console.error("updateAffiliateImportAction error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to update import",
      };
    }
  });

export const removeProductAction = action
  .schema(
    z.object({
      importId: z.string(),
      virtualStoreId: z.string(),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput: { importId, virtualStoreId } }) => {
    try {
      const result = await affiliateProductModel.removeImport(importId);

      if (result.error) {
        throw new Error(result.error);
      }

      revalidatePath(`/store/${virtualStoreId}/products`);
      revalidatePath("/admin/products");

      return {
        success: true,
        message: "Product removed successfully!",
      };
    } catch (error) {
      console.error("removeProductAction error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to remove product",
      };
    }
  });

export async function checkProductSyncStatus(
  productId: string,
  virtualStoreId: string
) {
  try {
    const existingImport = await affiliateProductModel.findOne([
      { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
      { field: "productId", operator: "equal", value: productId },
    ]);

    return {
      isCloned: !!existingImport,
      importData: existingImport ?? null,
    };
  } catch (error) {
    console.error("checkProductSyncStatus action error: ", error);
    return {
      isCloned: false,
      importData: null,
      error: "Failed to check product sync status",
    };
  }
}

export const bulkUpdateCommissionAction = action
  .schema(
    z.object({
      virtualStoreId: z.string(),
      newRate: z.number().min(0).max(100),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput: { virtualStoreId, newRate } }) => {
    try {
      const result = await affiliateProductModel.bulkUpdateCommissions(
        virtualStoreId,
        newRate
      );

      if (result.error) {
        throw new Error(result.error);
      }

      revalidatePath(`/store/${virtualStoreId}/products`);
      revalidatePath("/admin/products");

      return {
        success: true,
        message: `Commission rates updated to ${newRate}%`,
      };
    } catch (error) {
      console.error("bulkUpdateCommissionAction error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update commission rates"
      );
    }
  });

export async function getAffiliateImportAnalytics(virtualStoreId: string) {
  try {
    const analytics = await affiliateProductModel.getImportAnalytics(
      virtualStoreId
    );

    return {
      data: analytics,
    };
  } catch (error) {
    console.error("getAffiliateImportAnalytics action error: ", error);
    return {
      data: {
        totalImports: 0,
        activeImports: 0,
        totalRevenuePotential: 0,
        avgCommissionRate: 0,
        topCategories: [],
      },
      error: "Failed to fetch analytics",
    };
  }
}

export async function getVirtualStoreProductsByPriceRange(
  virtualStoreId: string,
  minPrice: number,
  maxPrice: number,
  options: {
    limit?: number;
    page?: number;
  } = {}
) {
  try {
    const { limit = 10, page = 1 } = options;
    const offset = (page - 1) * limit;

    const result =
      await affiliateProductModel.getVirtualStoreProductsByPriceRange(
        virtualStoreId,
        minPrice,
        maxPrice,
        {
          limit,
          offset,
        }
      );

    return {
      documents: result.documents,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("getVirtualStoreProductsByPriceRange action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    };
  }
}

export async function getVirtualStoreProducts(
  virtualStoreId: string,
  options: QueryOptions = {},
  isAdmin: boolean = false
): Promise<PaginationResult<VirtualProductTypes>> {
  try {
    if (!virtualStoreId || virtualStoreId.trim() === "") {
      throw new Error("Virtual store ID is required");
    }

    const affiliateProductModel = new AffiliateProductModel();

    const queryOptions: QueryOptions = {
      limit: 25,
      offset: 0,
      orderBy: "$createdAt",
      orderType: "desc",
      ...options,
    };

    const result = await affiliateProductModel.getVirtualStoreProducts(
      virtualStoreId,
      queryOptions,
      isAdmin
    );

    return result;
  } catch (error) {
    console.error("getVirtualStoreProducts action error:", error);

    return {
      documents: [],
      total: 0,
      limit: options.limit || 25,
      offset: options.offset || 0,
      hasMore: false,
    };
  }
}

export async function searchVirtualStoreProducts(
  virtualStoreId: string,
  options: {
    limit?: number;
    page?: number;
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}
) {
  try {
    const { limit = 10, page = 1, search, ...filters } = options;
    const offset = (page - 1) * limit;

    const queryFilters: any[] = [];

    if (filters.categoryId) {
      queryFilters.push({
        field: "categoryId",
        operator: "equal",
        value: filters.categoryId,
      });
    }

    if (filters.minPrice !== undefined) {
      queryFilters.push({
        field: "basePrice",
        operator: "greaterThanEqual",
        value: filters.minPrice,
      });
    }

    if (filters.maxPrice !== undefined) {
      queryFilters.push({
        field: "basePrice",
        operator: "lessThanEqual",
        value: filters.maxPrice,
      });
    }

    let result;
    if (search) {
      result = await affiliateProductModel.searchVirtualStoreProducts(
        virtualStoreId,
        search,
        {
          limit,
          offset,
          filters: queryFilters,
          orderBy: "$createdAt",
          orderType: "desc",
        }
      );
    } else {
      result = await affiliateProductModel.getVirtualStoreProducts(
        virtualStoreId,
        {
          limit,
          offset,
          filters: queryFilters,
          orderBy: "$createdAt",
          orderType: "desc",
        }
      );
    }

    return {
      documents: result.documents,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      hasMore: result.hasMore,
      success: true,
    };
  } catch (error) {
    console.error("getVirtualStoreProducts action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch products",
    };
  }
}

export async function getVirtualStoreProductsByCategory(
  virtualStoreId: string,
  categoryId: string,
  options: {
    limit?: number;
    page?: number;
  } = {}
) {
  try {
    const { limit = 10, page = 1 } = options;
    const offset = (page - 1) * limit;

    const result =
      await affiliateProductModel.getVirtualStoreProductsByCategory(
        virtualStoreId,
        categoryId,
        {
          limit,
          offset,
          orderBy: "$createdAt",
          orderType: "desc",
        }
      );

    return {
      documents: result.documents,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("getVirtualStoreProductsByCategory action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    };
  }
}

export async function getFeaturedVirtualStoreProducts(
  virtualStoreId: string,
  options: {
    limit?: number;
    page?: number;
  } = {}
) {
  try {
    const { limit = 10, page = 1 } = options;
    const offset = (page - 1) * limit;

    const result = await affiliateProductModel.getFeaturedVirtualStoreProducts(
      virtualStoreId,
      {
        limit,
        offset,
      }
    );

    return {
      documents: result.documents,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("getFeaturedVirtualStoreProducts action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    };
  }
}

export async function getProductCombinationsWithPricing(
  productId: string,
  virtualStoreId?: string
) {
  try {
    const combinations =
      await affiliateProductModel.getProductCombinationsWithPricing(
        productId,
        virtualStoreId
      );

    return {
      data: combinations,
    };
  } catch (error) {
    console.error("getProductCombinationsWithPricing action error: ", error);
    return {
      data: [],
      error: "Failed to fetch product combinations",
    };
  }
}

export async function bulkUpdateCommission(
  virtualStoreId: string,
  newRate: number
) {
  try {
    if (newRate < 0 || newRate > 100) {
      return { error: "Commission rate must be between 0 and 100%" };
    }

    const result = await affiliateProductModel.bulkUpdateCommissions(
      virtualStoreId,
      newRate
    );

    if (result.error) {
      return { error: result.error };
    }

    return { success: result.success };
  } catch (error) {
    return { error: `bulkUpdateCommission failed` };
  }
}

export async function getVirtualProductById(productId: string) {
  try {
    const result = await affiliateProductModel.findVirtualProductById(
      productId
    );
    return result;
  } catch (error) {
    return null;
  }
}
