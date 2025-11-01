"use server";

import { revalidatePath } from "next/cache";
import {
  BasicInfoStepSchema,
  BulkUpdateProductStatusSchema,
  CategoryStepSchema,
  ColorVariantUpdateSchema,
  CreateProductSchema,
  createReviewSchema,
  DeleteProductSchema,
  ImagesStepSchema,
  UpdateColorVariantData,
  UpdateProductSchema,
  VariantsStepSchema,
  voteOnReviewSchema,
} from "../schemas/products-schems";
import { ProductModel } from "../models/ProductModel";
import { getAuthState } from "../user-permission";
import { OriginalProductTypes, ProductFilters } from "../types";
import { ColorVariantsModel } from "../models/ColorVariantsModel";
import { getUserLocation } from "../geolocation";
import { createSafeActionClient } from "next-safe-action";
import {
  CatalogProductTypeModel,
  CatalogProductTypeVariantModel,
  CatalogSubcategoryModel,
  CatalogVariantOptionModel,
  CatalogVariantTemplateModel,
  CategoryModel,
} from "../models/catalog-models";
import { authMiddleware } from "./middlewares";
import z from "zod";
import {
  CatalogProductTypeVariants,
  ProductColors,
} from "../types/appwrite/appwrite";
import { checkStoreAccess } from "../helpers/store-permission-helper";
import { PRODUCT_PERMISSIONS } from "../helpers/permissions";
import { ProductReviewModel } from "../models/ProductReviewModel";

const action = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Action error:", error);
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

const originalProductsModel = new ProductModel();
const colorVariantsModel = new ColorVariantsModel();
const categoryModel = new CategoryModel();
const subcategoryModel = new CatalogSubcategoryModel();
const productTypeModel = new CatalogProductTypeModel();
const variantTemplateModel = new CatalogVariantTemplateModel();
const catalogProductTypeVariantModel = new CatalogProductTypeVariantModel();
const catalogVariantOptionModel = new CatalogVariantOptionModel();
const reviewModel = new ProductReviewModel();

export const createProductAction = action
  .use(authMiddleware)
  .schema(CreateProductSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await originalProductsModel.createProduct(parsedInput);

      if ("error" in result) {
        return {
          success: false,
          error: result.error,
        };
      }

      revalidatePath(`/admin/stores/${parsedInput.physicalStoreId}/products`);
      revalidatePath("/marketplace");

      return {
        success: true,
        data: result,
        message: `Product "${result.name}" created successfully!`,
      };
    } catch (error) {
      console.error("Create product error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create product",
      };
    }
  });

export async function updateOriginalProduct(
  productId: string,
  data: UpdateProductSchema
) {
  try {
    const validatedData = UpdateProductSchema.parse(data);

    const result = await originalProductsModel.updateProduct(
      productId,
      validatedData
    );

    if ("error" in result) {
      return { error: result.error };
    }

    revalidatePath("/admin/stores/[storeId]/products");
    revalidatePath(`/admin/products/${productId}`);
    return {
      success: `Product "${result.name}" updated successfully!`,
      data: result,
    };
  } catch (error) {
    console.error("updateOriginalProduct action error: ", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update product" };
  }
}

export const bulkUpdateProductStatus = action
  .use(authMiddleware)
  .schema(BulkUpdateProductStatusSchema)
  .action(async ({ parsedInput }) => {
    const { productIds, status } = parsedInput;
    try {
      const { isPhysicalStoreOwner, user, isSystemAdmin } =
        await getAuthState();

      if (!isPhysicalStoreOwner || !user || !isSystemAdmin) {
        return {
          error:
            "Access denied: Only store owners & admins can update product status",
        };
      }

      const products = await Promise.all(
        productIds.map((id) => originalProductsModel.findProductById(id))
      );

      const updatePromises = productIds.map((id) =>
        originalProductsModel.updateProduct(id, { status })
      );

      const results = await Promise.all(updatePromises);
      const failures = results.filter((result) => "error" in result);

      if (failures.length > 0) {
        return { error: `Failed to update ${failures.length} product(s)` };
      }

      if (failures.length > 0) {
        return { error: `Failed to update ${failures.length} product(s)` };
      }

      const storeIds = [
        ...new Set(products.map((p) => p?.physicalStoreId).filter(Boolean)),
      ];
      storeIds.forEach((storeId) => {
        revalidatePath(`/admin/stores/${storeId}/products`);
        revalidatePath(`/admin/stores/${storeId}`);
      });

      return {
        success: `Successfully updated ${productIds.length} product(s) to ${status}`,
      };
    } catch (error) {
      console.error("bulkUpdateProductStatus error:", error);
      return { error: "Failed to bulk update product status" };
    }
  });

export async function updateColorVariant(
  colorVariantId: string,
  data: UpdateColorVariantData
) {
  try {
    const validatedData = ColorVariantUpdateSchema.parse(data);
    const result = await colorVariantsModel.updateColorVariant(
      colorVariantId,
      validatedData
    );

    if ("error" in result) {
      return { error: result.error };
    }

    revalidatePath("/admin/stores/[storeId]/products");
    revalidatePath(`/admin/stores/[storeId]/products/${result.productId}`);

    return {
      success: `Color variant "${result.colorName}" updated successfully!`,
      data: result,
    };
  } catch (error) {
    console.error("updateColorVariant action error: ", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update color variant" };
  }
}

export async function deleteColorVariant(colorVariantId: string) {
  try {
    const result = await colorVariantsModel.deleteColorVariant(colorVariantId);

    if ("error" in result) {
      return { error: result.error };
    }

    revalidatePath("/admin/stores/[storeId]/products");

    return {
      success: result.success || "Color variant deleted successfully!",
    };
  } catch (error) {
    console.error("deleteColorVariant action error: ", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to delete color variant" };
  }
}

export const toggleProductFeatured = action
  .use(authMiddleware)
  .schema(z.object({ productId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { productId } = parsedInput;
    try {
      const { isPhysicalStoreOwner, user, isSystemAdmin, isSystemAgent } =
        await getAuthState();
      if (!isPhysicalStoreOwner || !user) {
        return {
          error: "Access denied: Only store owners can feature products",
        };
      }

      const existingProduct = await originalProductsModel.findProductById(
        productId
      );
      if (!existingProduct) {
        return { error: "Access denied" };
      }

      const result = await originalProductsModel.updateProduct(productId, {
        featured: !existingProduct.featured,
      });

      if ("error" in result) {
        return { error: result.error };
      }

      revalidatePath(
        `/admin/stores/${existingProduct.physicalStoreId}/products`
      );
      revalidatePath(`/admin/stores/${existingProduct.physicalStoreId}`);
      revalidatePath("/marketplace");

      return {
        success: `Product ${
          existingProduct.featured ? "unfeatured" : "featured"
        } successfully`,
        data: result as OriginalProductTypes,
      };
    } catch (error) {
      console.error("toggleProductFeatured error:", error);
      return { error: "Failed to toggle product featured status" };
    }
  });

export const toggleProductDropshippingAction = action
  .use(authMiddleware)
  .schema(z.object({ productId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { productId } = parsedInput;
    const { user } = ctx;

    try {
      const existingProduct = await originalProductsModel.findProductById(
        productId
      );
      if (!existingProduct) {
        return { error: "Product not found" };
      }

      const hasPermission = await checkStoreAccess(
        user.$id,
        existingProduct.physicalStoreId,
        PRODUCT_PERMISSIONS.MANAGE_DROPSHIPPING,
        "physical"
      );

      if (!hasPermission) {
        return {
          error:
            "Access denied: You don't have permission to manage dropshipping settings",
        };
      }

      const result = await originalProductsModel.updateProduct(productId, {
        isDropshippingEnabled: !existingProduct.isDropshippingEnabled,
      });

      if ("error" in result) {
        return { error: result.error };
      }

      revalidatePath(
        `/admin/stores/${existingProduct.physicalStoreId}/products`
      );
      revalidatePath(`/admin/stores/${existingProduct.physicalStoreId}`);
      revalidatePath(
        `/admin/stores/${existingProduct.physicalStoreId}/products/${productId}/settings`
      );

      return {
        success: `Dropshipping ${
          existingProduct.isDropshippingEnabled ? "disabled" : "enabled"
        } successfully`,
        data: result,
      };
    } catch (error) {
      console.error("toggleProductDropshipping error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to toggle dropshipping",
      };
    }
  });

export const quickEditPhysicalProductPriceAction = action
  .use(authMiddleware)
  .schema(
    z.object({
      productId: z.string(),
      basePrice: z.number().min(0, "Price must be positive"),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { productId, basePrice } = parsedInput;
    const { user } = ctx;

    try {
      const existingProduct = await originalProductsModel.findProductById(
        productId
      );
      if (!existingProduct) {
        return { error: "Product not found" };
      }

      // Check permission
      const hasPermission = await checkStoreAccess(
        user.$id,
        existingProduct.physicalStoreId,
        PRODUCT_PERMISSIONS.MANAGE_PRICING,
        "physical"
      );

      if (!hasPermission) {
        return {
          error:
            "Access denied: You don't have permission to manage product pricing",
        };
      }

      const result = await originalProductsModel.updateProduct(productId, {
        basePrice,
      });

      if ("error" in result) {
        return { error: result.error };
      }

      revalidatePath(
        `/admin/stores/${existingProduct.physicalStoreId}/products`
      );
      revalidatePath(
        `/admin/stores/${existingProduct.physicalStoreId}/products/${productId}`
      );
      revalidatePath(
        `/admin/stores/${existingProduct.physicalStoreId}/products/${productId}/settings`
      );

      return {
        success: "Price updated successfully",
        data: result,
      };
    } catch (error) {
      console.error("quickEditPhysicalProductPrice error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to update price",
      };
    }
  });

export async function getFilteredProducts(
  filters: ProductFilters,
  storeCountry: string
) {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      subcategoryId,
      productTypeId,
      status = "active",
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const offset = (page - 1) * limit;

    const queryFilters: any[] = [
      { field: "storeCountry", operator: "equal", value: storeCountry },
    ];

    if (status && status !== "all") {
      queryFilters.push({ field: "status", operator: "equal", value: status });
    }

    if (categoryId) {
      queryFilters.push({
        field: "categoryId",
        operator: "equal",
        value: categoryId,
      });
    }

    if (subcategoryId) {
      queryFilters.push({
        field: "subcategoryId",
        operator: "equal",
        value: subcategoryId,
      });
    }

    if (productTypeId) {
      queryFilters.push({
        field: "productTypeId",
        operator: "equal",
        value: productTypeId,
      });
    }

    if (minPrice !== undefined) {
      queryFilters.push({
        field: "basePrice",
        operator: "greaterThanEqual",
        value: minPrice,
      });
    }

    if (maxPrice !== undefined) {
      queryFilters.push({
        field: "basePrice",
        operator: "lessThanEqual",
        value: maxPrice,
      });
    }

    // --- main fetch ---
    const result = search
      ? await originalProductsModel.searchProducts(search, {
          limit,
          offset,
          filters: queryFilters,
          orderBy: sortBy,
          orderType: sortOrder as "asc" | "desc",
        })
      : await originalProductsModel.getFeaturedProducts({
          limit,
          offset,
          filters: queryFilters,
          orderBy: sortBy,
          orderType: sortOrder as "asc" | "desc",
        });

    return {
      products: result.documents || [],
      total: result.total || 0,
      hasMore: result.hasMore || false,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], total: 0, hasMore: false, currentPage: 1 };
  }
}

export async function getProductsCombinations(
  productId: string,
  options: {
    limit?: number;
    offset?: number;
    activeOnly?: boolean;
    orderBy?: string;
    orderType?: "asc" | "desc";
  } = {}
) {
  try {
    if (!productId) {
      return {
        success: false,
        combinations: [],
        total: 0,
        hasMore: false,
        error: "Product ID is required",
      };
    }

    const result = await originalProductsModel.getProductsCombinations(
      productId,
      options
    );

    if (!result.success) {
      return {
        success: false,
        combinations: [],
        total: 0,
        hasMore: false,
        error: result.error || "Failed to fetch product combinations",
      };
    }

    return {
      success: true,
      combinations: result.combinations,
      total: result.total,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("getProductsCombinations action error: ", error);
    return {
      success: false,
      combinations: [],
      total: 0,
      hasMore: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch product combinations",
    };
  }
}

export async function getProductAnalytics(
  storeId: string,
  options: {
    dateRange?: { from: Date; to: Date };
    includeVariants?: boolean;
  } = {}
) {
  try {
    const { isPhysicalStoreOwner } = await getAuthState();
    if (!isPhysicalStoreOwner) {
      return { error: "Access denied: Cannot access this store's analytics" };
    }

    const allProducts = await originalProductsModel.findByPhysicalStore(
      storeId,
      {
        limit: 1000,
      }
    );

    const products = allProducts.documents;
    const activeProducts = products.filter((p) => p.status === "active").length;
    const draftProducts = products.filter((p) => p.status === "draft").length;
    const featuredProducts = products.filter((p) => p.featured).length;
    const dropshippingEnabled = products.filter(
      (p) => p.isDropshippingEnabled
    ).length;

    const totalValue = products.reduce(
      (sum, product) => sum + product.basePrice,
      0
    );
    const averagePrice = products.length > 0 ? totalValue / products.length : 0;

    const categoryCount: { [key: string]: number } = {};
    products.forEach((product) => {
      categoryCount[product.categoryId] =
        (categoryCount[product.categoryId] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .map(([categoryId, count]) => ({ categoryId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentProducts = products
      .sort(
        (a, b) =>
          new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      )
      .slice(0, 10);

    return {
      success: "Analytics retrieved successfully",
      data: {
        totalProducts: products.length,
        activeProducts,
        draftProducts,
        featuredProducts,
        dropshippingEnabled,
        totalValue,
        averagePrice,
        topCategories,
        recentProducts,
      },
    };
  } catch (error) {
    console.error("getProductAnalytics error:", error);
    return { error: "Failed to retrieve product analytics" };
  }
}

export const deleteOriginalProducts = action
  .schema(DeleteProductSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput }) => {
    try {
      const idsArray = Array.isArray(parsedInput.productIds)
        ? parsedInput.productIds
        : [parsedInput.productIds];

      const result = await originalProductsModel.deleteProducts(idsArray);

      if (result.error) {
        return { error: result.error };
      }

      revalidatePath("/admin/stores/[storeId]/products");
      return {
        success: true,
        data: result,
        message: result.success,
      };
    } catch (error) {
      console.error("deleteProducts action error: ", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete product(s)" };
    }
  });

export async function getOriginalProductById(productId: string) {
  try {
    const product = await originalProductsModel.findProductById(productId);

    if (!product) {
      return { error: "Product not found" };
    }

    return { data: product };
  } catch (error) {
    console.error("getOriginalProductById action error: ", error);
    return { error: "Failed to fetch product" };
  }
}

export async function getProductWithColors(productId: string) {
  try {
    const result = await originalProductsModel.findProductWithColors(productId);

    return {
      success: "Product data retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("getProductWithColors action error: ", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to retrieve product data" };
  }
}

export async function getStoreOriginalProducts(storeId: string) {
  try {
    const result = await originalProductsModel.findByPhysicalStore(storeId);

    return {
      documents: result.documents,
      total: result.total,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("getStoreOriginalProducts action error: ", error);
    return {
      documents: [],
      total: 0,
      hasMore: false,
    };
  }
}

export async function searchOriginalProducts(
  searchTerm: string,
  options: {
    limit?: number;
    page?: number;
    storeId?: string;
    categoryId?: string;
    status?: "active" | "inactive" | "draft" | "all";
    minPrice?: number;
    maxPrice?: number;
    withCombinations?: boolean;
  } = {}
) {
  try {
    const {
      limit = 10,
      page = 1,
      withCombinations = false,
      ...filters
    } = options;
    const offset = (page - 1) * limit;

    const queryFilters: any[] = [];

    if (filters.storeId) {
      queryFilters.push({
        field: "storeId",
        operator: "equal",
        value: filters.storeId,
      });
    }

    if (filters.categoryId) {
      queryFilters.push({
        field: "categoryId",
        operator: "equal",
        value: filters.categoryId,
      });
    }

    if (filters.status) {
      queryFilters.push({
        field: "status",
        operator: "equal",
        value: filters.status,
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

    const result = await originalProductsModel.searchProducts(searchTerm, {
      limit,
      offset,
      filters: queryFilters,
      orderBy: "$createdAt",
      orderType: "desc",
    });

    return {
      documents: result.documents,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("searchOriginalProducts action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    };
  }
}

export async function getNearbyStoresOriginalProducts(
  southWest: { lat: number; lng: number },
  northEast: { lat: number; lng: number }
) {
  try {
    const result = await originalProductsModel.findNearbyProducts(
      southWest,
      northEast
    );

    return {
      documents: result.documents,
      total: result.total,
    };
  } catch (error) {
    console.error("getNearbyStoresOriginalProducts action error: ", error);
    return {
      documents: [],
      total: 0,
    };
  }
}

export async function getFeaturedOriginalProducts(
  options: {
    limit?: number;
    page?: number;
    storeId?: string;
  } = {}
) {
  try {
    const { limit = 10, page = 1, storeId } = options;
    const offset = (page - 1) * limit;

    const filters: any[] = [];
    if (storeId) {
      filters.push({ field: "storeId", operator: "equal", value: storeId });
    }

    const result = await originalProductsModel.getFeaturedProducts({
      limit,
      offset,
      filters,
    });

    return {
      documents: result.documents,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("getFeaturedOriginalProducts action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    };
  }
}

export async function getOriginalProductsByCategory(
  categoryId: string,
  options: {
    limit?: number;
    page?: number;
    storeId?: string;
  } = {}
) {
  try {
    const { limit = 10, page = 1, storeId } = options;
    const offset = (page - 1) * limit;

    const filters: any[] = [];
    if (storeId) {
      filters.push({ field: "storeId", operator: "equal", value: storeId });
    }

    const result = await originalProductsModel.findByCategory(categoryId, {
      limit,
      offset,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });

    return {
      documents: result.documents,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("getOriginalProductsByCategory action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    };
  }
}

export async function getOriginalProductsByPriceRange(
  minPrice: number,
  maxPrice: number,
  options: {
    limit?: number;
    page?: number;
    storeId?: string;
  } = {}
) {
  try {
    const { limit = 10, page = 1, storeId } = options;
    const offset = (page - 1) * limit;

    const filters: any[] = [];
    if (storeId) {
      filters.push({ field: "storeId", operator: "equal", value: storeId });
    }

    const result = await originalProductsModel.findByPriceRange(
      minPrice,
      maxPrice,
      {
        limit,
        offset,
        filters,
        orderBy: "basePrice",
        orderType: "asc",
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
    console.error("getOriginalProductsByPriceRange action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    };
  }
}

export async function getOriginalProductsByTag(
  tag: string,
  options: {
    limit?: number;
    page?: number;
    storeId?: string;
  } = {}
) {
  try {
    const { limit = 10, page = 1, storeId } = options;
    const offset = (page - 1) * limit;

    const filters: any[] = [];
    if (storeId) {
      filters.push({ field: "storeId", operator: "equal", value: storeId });
    }

    const result = await originalProductsModel.getProductsByTag(tag, {
      limit,
      offset,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });

    return {
      documents: result.documents,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("getOriginalProductsByTag action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    };
  }
}

export async function getOriginalProductsByStatus(
  status: "active" | "draft" | "archived",
  options: {
    limit?: number;
    page?: number;
    storeId?: string;
  } = {}
) {
  try {
    const { limit = 10, page = 1, storeId } = options;
    const offset = (page - 1) * limit;

    const filters: any[] = [];
    if (storeId) {
      filters.push({ field: "storeId", operator: "equal", value: storeId });
    }

    const result = await originalProductsModel.findByStatus(status, {
      limit,
      offset,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });

    return {
      documents: result.documents,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("getOriginalProductsByStatus action error: ", error);
    return {
      documents: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    };
  }
}

export const searchCategories = action
  .schema(
    z.object({
      search: z.string().optional(),
      limit: z.number().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const result = await categoryModel.findCategories(
        parsedInput.search ? { categoryName: parsedInput.search } : {},
        {
          limit: parsedInput.limit || 20,
          includeInactive: false,
          orderBy: "sortOrder",
          orderType: "asc",
        }
      );

      const options = result.documents.map((cat) => ({
        value: cat.$id,
        label: cat.categoryName,
        description: cat.description,
      }));

      return { success: true, data: options };
    } catch (error) {
      console.error("Search categories error:", error);
      return { success: false, error: "Failed to search categories" };
    }
  });

export const searchSubcategories = action
  .schema(
    z.object({
      categoryId: z.string(),
      search: z.string().optional(),
      limit: z.number().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const result = await subcategoryModel.getSubcategoriesByCategory(
        parsedInput.categoryId,
        {
          limit: parsedInput.limit || 20,
          orderBy: "sortOrder",
          orderType: "asc",
        }
      );

      let filtered = result.documents;
      if (parsedInput.search) {
        const searchLower = parsedInput.search.toLowerCase();
        filtered = filtered.filter((sub) =>
          sub.subCategoryName.toLowerCase().includes(searchLower)
        );
      }

      const options = filtered.map((sub) => ({
        value: sub.$id,
        label: sub.subCategoryName,
        description: sub.description,
      }));

      return { success: true, data: options };
    } catch (error) {
      console.error("Search subcategories error:", error);
      return { success: false, error: "Failed to search subcategories" };
    }
  });

export const searchProductTypes = action
  .schema(
    z.object({
      subcategoryId: z.string(),
      search: z.string().optional(),
      limit: z.number().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const result = await productTypeModel.getProductTypesBySubcategory(
        parsedInput.subcategoryId,
        {
          limit: parsedInput.limit || 20,
          orderBy: "sortOrder",
          orderType: "asc",
        }
      );

      let filtered = result.documents;
      if (parsedInput.search) {
        const searchLower = parsedInput.search.toLowerCase();
        filtered = filtered.filter((pt) =>
          pt.productTypeName.toLowerCase().includes(searchLower)
        );
      }

      const options = filtered.map((pt) => ({
        value: pt.$id,
        label: pt.productTypeName,
        description: pt.description,
      }));

      return { success: true, data: options };
    } catch (error) {
      console.error("Search product types error:", error);
      return { success: false, error: "Failed to search product types" };
    }
  });

export const getVariantTemplatesForProductType = action
  .schema(z.object({ productTypeId: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const productType = await productTypeModel.getProductTypeById(
        parsedInput.productTypeId
      );

      if (!productType) {
        return { success: false, error: "Product type not found" };
      }

      const assignments =
        await catalogProductTypeVariantModel.getVariantsForProductType(
          parsedInput.productTypeId,
          {}
        );

      // Get full template details
      const templates = await Promise.all(
        assignments.documents.map(
          async (assignment: CatalogProductTypeVariants) => {
            const template = await variantTemplateModel.getVariantTemplateById(
              assignment.variantTemplateId
            );

            if (!template) return null;

            // Get variant options
            const options =
              await catalogVariantOptionModel.getAllOptionsForTemplate(
                assignment.variantTemplateId
              );

            return {
              id: template.$id,
              name: template.variantTemplateName,
              description: template.description,
              inputType: template.inputType,
              isRequired: assignment.isRequired || template.isRequired,
              sortOrder: assignment.sortOrder,
              variantOptions: options.documents || [],
            };
          }
        )
      );

      const validTemplates = templates.filter((t) => t !== null);

      return {
        success: true,
        data: validTemplates,
      };
    } catch (error) {
      console.error("Get variant templates error:", error);
      return {
        success: false,
        error: "Failed to get variant templates",
      };
    }
  });

export const checkReviewEligibilityAction = async ({
  productId,
  virtualStoreId,
}: {
  productId: string;
  virtualStoreId: string;
}) => {
  try {
    const eligibility = await reviewModel.checkReviewEligibility(
      productId,
      virtualStoreId
    );

    return {
      success: true,
      data: eligibility,
    };
  } catch (error) {
    console.error("checkReviewEligibilityAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check review eligibility",
    };
  }
};

export const getProductReviewsAction = async ({
  storeId,
  rating,
  productId,
  verifiedOnly,
  withPhotos,
  limit,
  sortBy,
}: {
  productId: string;
  limit: number;
  storeId?: string;
  rating?: number;
  sortBy?: "newest" | "oldest" | "helpful" | "rating_high" | "rating_low";
  verifiedOnly?: boolean;
  withPhotos?: boolean;
}) => {
  try {
    const reviewModel = new ProductReviewModel();
    const result = await reviewModel.getProductReviews(productId, {
      limit,
      storeId,
      rating,
      sortBy,
      verifiedOnly,
      withPhotos,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("getProductReviewsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch reviews",
      data: {
        documents: [],
        total: 0,
        limit,
        totalPages: 0,
      },
    };
  }
};

export const createProductReviewAction = action
  .schema(createReviewSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await reviewModel.createReview({
        productId: parsedInput.productId,
        virtualStoreId: parsedInput.virtualStoreId,
        rating: parsedInput.rating,
        title: parsedInput.title,
        comment: parsedInput.comment,
        pros: parsedInput.pros,
        cons: parsedInput.cons,
        orderId: parsedInput.orderId,
      });

      if ("error" in result) {
        return {
          success: false,
          error: result.error,
        };
      }

      revalidatePath(`/products/[productSlug]/[productId]`, "page");

      return {
        success: true,
        data: result,
        message:
          "Review submitted successfully! It will appear after moderation.",
      };
    } catch (error) {
      console.error("createProductReviewAction error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to submit review",
      };
    }
  });

export const voteOnReviewAction = action
  .schema(voteOnReviewSchema)
  .action(async ({ parsedInput: { reviewId, voteType } }) => {
    try {
      const result = await reviewModel.voteOnReview(reviewId, voteType);

      if (result.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      revalidatePath(`/products/[productSlug]/[productId]`, "page");

      return {
        success: true,
        message: result.success,
      };
    } catch (error) {
      console.error("voteOnReviewAction error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to vote on review",
      };
    }
  });

export const getUserReviewableProductsAction = async ({
  userId,
  limit,
}: {
  userId: string;
  limit: number;
}) => {
  try {
    const result = await reviewModel.getUserReviewableProducts(userId, {
      limit,
    });

    return {
      success: result.success,
      data: result.products,
      error: result.error,
    };
  } catch (error) {
    console.error("getUserReviewableProductsAction error:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch reviewable products",
    };
  }
};

export const getReviewStatsAction = async ({
  productId,
  virtualStoreId,
}: {
  productId: string;
  virtualStoreId: string;
}) => {
  try {
    const allReviews = await reviewModel.getProductReviews(productId, {
      limit: 1000,
      storeId: virtualStoreId,
    });

    const reviews = allReviews.documents;
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
          verifiedPurchaseCount: 0,
          withPhotosCount: 0,
        },
      };
    }

    // Calculate statistics
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    const verifiedPurchaseCount = reviews.filter(
      (r) => r.isVerifiedPurchase
    ).length;
    const withPhotosCount = reviews.filter(
      (r) => r.images && r.images.length > 0
    ).length;

    return {
      success: true,
      data: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
        ratingDistribution,
        verifiedPurchaseCount,
        withPhotosCount,
        ratingDistributionPercentage: {
          5: Math.round((ratingDistribution[5] / totalReviews) * 100),
          4: Math.round((ratingDistribution[4] / totalReviews) * 100),
          3: Math.round((ratingDistribution[3] / totalReviews) * 100),
          2: Math.round((ratingDistribution[2] / totalReviews) * 100),
          1: Math.round((ratingDistribution[1] / totalReviews) * 100),
        },
      },
    };
  } catch (error) {
    console.error("getReviewStatsAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch review statistics",
    };
  }
};
