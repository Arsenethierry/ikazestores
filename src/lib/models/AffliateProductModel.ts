import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  createDocumentPermissions,
  createSessionClient,
} from "../appwrite";
import {
  BaseModel,
  CacheOptions,
  PaginationResult,
  QueryFilter,
  QueryOptions,
} from "../core/database";
import {
  AFFILIATE_COMBINATION_PRICING_COLLECTION_ID,
  AFFILIATE_PRODUCT_IMPORTS_COLLECTION_ID,
  DATABASE_ID,
  PRODUCTS_COLLECTION_ID,
  VARIANT_COMBINATIONS_COLLECTION_ID,
} from "../env-config";
import {
  AffiliateCombinationPricing,
  AffiliateProductImports,
  ProductCombinations,
  Products,
} from "../types/appwrite/appwrite";
import {
  CreateAffiliateImportSchema,
  UpdateAffiliateImportSchema,
} from "../schemas/products-schems";
import { getAuthState } from "../user-permission";
import { ProductModel } from "./ProductModel";
import { VirtualProductTypes } from "../types";
import { VirtualStore } from "./virtual-store";

export interface VirtualStoreCombination extends ProductCombinations {
  finalPrice: number;
  commission: number;
}
export class AffiliateProductModel extends BaseModel<AffiliateProductImports> {
  private originalProduct: ProductModel;
  private virtualStore: VirtualStore;

  constructor() {
    super(AFFILIATE_PRODUCT_IMPORTS_COLLECTION_ID);
    this.originalProduct = new ProductModel();
    this.virtualStore = new VirtualStore();
  }

  async findByVirtualStore(
    virtualStoreId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<AffiliateProductImports>> {
    const filters: QueryFilter[] = [
      { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async findVirtualProductById(
    productId: string,
    isAdmin: boolean = false
  ): Promise<VirtualProductTypes | null> {
    const virtualProduct = await this.findById(productId, {});
    if (!virtualProduct) return null;
    const originalProduct = await this.originalProduct.findProductWithColors(
      virtualProduct.productId
    );
    if (!originalProduct) return null;

    return {
      ...virtualProduct,
      name: originalProduct.name,
      description: originalProduct.description,
      shortDescription: originalProduct.shortDescription || undefined,
      sku: originalProduct.sku,
      images: originalProduct.images || [],
      tags: originalProduct.tags?.length ? originalProduct.tags : null,
      price: virtualProduct.commission + originalProduct.basePrice,
      basePrice: isAdmin
        ? originalProduct.basePrice
        : virtualProduct.commission,
      currency: originalProduct.currency,
      status: originalProduct.status,
      hasVariants: originalProduct.hasVariants,
      // combinations: combinations.length > 0 ? combinations : undefined,
      colors: originalProduct.colors.length > 0 ? originalProduct.colors : null,
      categoryId: originalProduct.categoryId,
      subcategoryId: originalProduct.subcategoryId,
      productTypeId: originalProduct.productTypeId,
      physicalStoreCountry: originalProduct.storeCountry,
      physicalStoreLatitude: originalProduct.storeLatitude,
      physicalStoreLongitude: originalProduct.storeLongitude,
      physicalStoreId: originalProduct.physicalStoreId,
    };
  }

  async getVirtualStoreProducts(
    virtualStoreId: string,
    options: QueryOptions = {},
    isAdmin: boolean = false
  ): Promise<PaginationResult<VirtualProductTypes>> {
    try {
      const imports = await this.findActiveImports(virtualStoreId, options);
      if (imports.documents.length === 0) {
        return {
          documents: [],
          total: 0,
          limit: options.limit || 25,
          offset: options.offset || 0,
          hasMore: false,
        };
      }

      const productIds = imports.documents.map((imp) => imp.productId);
      const productFilters: QueryFilter[] = [
        { field: "$id", operator: "in", values: productIds },
        { field: "status", operator: "equal", value: "active" },
        { field: "isDropshippingEnabled", operator: "equal", value: true },
      ];

      if (options.filters) {
        productFilters.push(...options.filters);
      }

      const productsResult = await this.originalProduct.findMany({
        ...options,
        filters: productFilters,
      });

      const virtualStoreProducts = await Promise.all(
        productsResult.documents.map(async (product) => {
          const import_ = imports.documents.find(
            (imp) => imp.productId === product.$id
          );

          const colorsResult = await this.originalProduct.getProductColors(
            product.$id
          );

          return {
            ...import_,
            categoryId: product.categoryId,
            colors:
              colorsResult.documents.length > 0 ? colorsResult.documents : null,
            currency: product.currency,
            description: product.description,
            hasVariants: product.hasVariants,
            images: product.images,
            name: product.name,
            price: product.basePrice + (import_?.commission || 0),
            basePrice: isAdmin
              ? product.basePrice
              : product.basePrice + (import_?.commission || 0),
            productTypeId: product.productTypeId,
            sku: product.sku,
            status: product.status,
            subcategoryId: product.subcategoryId,
            tags: product.tags,
            physicalStoreCountry: product.storeCountry,
            physicalStoreLatitude: product.storeLatitude,
            physicalStoreLongitude: product.storeLongitude,
            physicalStoreId: product.physicalStoreId,
          } as VirtualProductTypes;
        })
      );
      return {
        documents: virtualStoreProducts,
        total: virtualStoreProducts.length,
        limit: options.limit || 25,
        offset: options.offset || 0,
        hasMore: false,
      };
    } catch (error) {
      console.error("getVirtualStoreProducts error:", error);
      return {
        documents: [],
        total: 0,
        limit: options.limit || 25,
        offset: options.offset || 0,
        hasMore: false,
      };
    }
  }

  async findActiveImports(
    virtualStoreId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<AffiliateProductImports>> {
    const filters: QueryFilter[] = [
      { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
      { field: "isActive", operator: "equal", value: true },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async getProductCombinationsWithPricing(
    productId: string,
    virtualStoreId?: string
  ): Promise<VirtualStoreCombination[]> {
    try {
      const { databases } = await createSessionClient();

      const combinations = await databases.listDocuments<ProductCombinations>(
        DATABASE_ID,
        VARIANT_COMBINATIONS_COLLECTION_ID,
        [Query.equal("productId", productId), Query.equal("isActive", true)]
      );

      if (!virtualStoreId) {
        return combinations.documents.map((combination) => ({
          ...combination,
          finalPrice: combination.basePrice,
          commission: 0,
        }));
      }

      const affiliateImport = await this.findOne([
        { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
        { field: "productId", operator: "equal", value: productId },
      ]);

      if (!affiliateImport) {
        throw new Error("Product not imported by this virtual store");
      }

      const baseCommission = affiliateImport.commission;
      const customPricing =
        await databases.listDocuments<AffiliateCombinationPricing>(
          DATABASE_ID,
          AFFILIATE_COMBINATION_PRICING_COLLECTION_ID,
          [Query.equal("affiliateImportId", affiliateImport.$id)]
        );

      return combinations.documents.map((combination) => {
        const customPrice = customPricing.documents.find(
          (cp) => cp.combinationId === combination.$id
        );
        const commission = customPrice?.customCommission || baseCommission;
        const finalPrice = combination.basePrice + commission;

        return {
          ...combination,
          finalPrice,
          commission,
        };
      });
    } catch (error) {
      console.error("getProductCombinationsWithPricing error:", error);
      return [];
    }
  }

  async importProduct(
    data: CreateAffiliateImportSchema
  ): Promise<AffiliateProductImports | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const { databases } = await createAdminClient();

      const product = await this.originalProduct.findById(data.productId, {});

      if (!product || !product.isDropshippingEnabled) {
        return { error: "This product is not available for dropshipping" };
      }

      const existingImport = await this.findOne([
        {
          field: "virtualStoreId",
          operator: "equal",
          value: data.virtualStoreId,
        },
        { field: "productId", operator: "equal", value: data.productId },
      ]);

      if (existingImport) {
        return { error: "Product already imported to this virtual store" };
      }

      const documentPermissions = createDocumentPermissions({
        userId: user.$id,
      });
      const importId = ID.unique();

      const storeData = await this.virtualStore.findById(
        data.virtualStoreId,
        {}
      );

      if (!storeData) {
        return { error: "Invalid store, please contact support" };
      }

      const importData = {
        virtualStoreId: data.virtualStoreId,
        productId: data.productId,
        commission: data.commission,
        isActive: true,
        virtualStoreName: storeData.storeName,
        importedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
      };

      const newImport = await databases.createDocument(
        DATABASE_ID,
        AFFILIATE_PRODUCT_IMPORTS_COLLECTION_ID,
        importId,
        importData,
        documentPermissions
      );

      if (data.customCombinationPricing?.length) {
        const pricingPromises = data.customCombinationPricing.map(
          async (pricing) => {
            const pricingId = ID.unique();
            await databases.createDocument(
              DATABASE_ID,
              AFFILIATE_COMBINATION_PRICING_COLLECTION_ID,
              pricingId,
              {
                affiliateImportId: importId,
                combinationId: pricing.combinationId,
                customCommission: pricing.customCommission,
                isActive: true,
              },
              documentPermissions
            );
          }
        );

        await Promise.all(pricingPromises);
      }

      return newImport as AffiliateProductImports;
    } catch (error) {
      console.error("importProduct error: ", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to import product" };
    }
  }

  async updateImport(
    importId: string,
    data: UpdateAffiliateImportSchema
  ): Promise<AffiliateProductImports | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const existingImport = await this.findById(importId, {});
      if (!existingImport) {
        return { error: "Import not found" };
      }

      const updatedImport = await this.update(importId, {
        ...data,
        lastSyncedAt: new Date().toISOString(),
      });

      return updatedImport;
    } catch (error) {
      console.error("updateImport error: ", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update import" };
    }
  }

  async removeImport(
    importId: string
  ): Promise<{ success?: string; error?: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const { databases } = await createSessionClient();

      const customPricing = await databases.listDocuments(
        DATABASE_ID,
        AFFILIATE_COMBINATION_PRICING_COLLECTION_ID,
        [Query.equal("affiliateImportId", importId)]
      );

      await Promise.all(
        customPricing.documents.map((pricing) =>
          databases.deleteDocument(
            DATABASE_ID,
            AFFILIATE_COMBINATION_PRICING_COLLECTION_ID,
            pricing.$id
          )
        )
      );

      await this.delete(importId);

      return { success: "Product removed from virtual store successfully" };
    } catch (error) {
      console.error("removeImport error: ", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to remove import" };
    }
  }

  async bulkUpdateCommissions(
    virtualStoreId: string,
    newCommission: number
  ): Promise<{ success?: string; error?: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const imports = await this.findActiveImports(virtualStoreId);

      const updatePromises = imports.documents.map((import_) =>
        this.update(import_.$id, {
          commission: newCommission,
          lastSyncedAt: new Date().toISOString(),
        })
      );

      await Promise.all(updatePromises);

      return {
        success: `Updated commission rates for ${imports.documents.length} products`,
      };
    } catch (error) {
      console.error("bulkUpdateCommissionRates error: ", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update commission rates" };
    }
  }

  async checkSyncStatus(
    virtualStoreId: string
  ): Promise<AffiliateProductImports[]> {
    try {
      const oneDayAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const outdatedImports = await this.findMany({
        filters: [
          { field: "virtualStoreId", operator: "equal", value: virtualStoreId },
          { field: "lastSyncedAt", operator: "lessThan", value: oneDayAgo },
        ],
      });

      return outdatedImports.documents;
    } catch (error) {
      console.error("checkSyncStatus error: ", error);
      return [];
    }
  }

  async searchVirtualStoreProducts(
    virtualStoreId: string,
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<VirtualProductTypes>> {
    const searchFilters: QueryFilter[] = [
      { field: "name", operator: "contains", value: searchTerm },
      ...(options.filters || []),
    ];

    return this.getVirtualStoreProducts(virtualStoreId, {
      ...options,
      filters: searchFilters,
    });
  }

  async getVirtualStoreProductsByCategory(
    virtualStoreId: string,
    categoryId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<VirtualProductTypes>> {
    const categoryFilters: QueryFilter[] = [
      { field: "categoryId", operator: "equal", value: categoryId },
      ...(options.filters || []),
    ];

    return this.getVirtualStoreProducts(virtualStoreId, {
      ...options,
      filters: categoryFilters,
    });
  }

  async getVirtualStoreProductsByPriceRange(
    virtualStoreId: string,
    minPrice: number,
    maxPrice: number,
    options: QueryOptions = {}
  ): Promise<PaginationResult<VirtualProductTypes>> {
    // Note: Price filtering for virtual stores needs to be done after calculating final prices
    // This is a simplified version - for better performance, consider implementing server-side calculation

    const products = await this.getVirtualStoreProducts(
      virtualStoreId,
      options
    );

    const filteredProducts = products.documents.filter(
      (product) =>
        product.finalPrice >= minPrice && product.finalPrice <= maxPrice
    );

    return {
      documents: filteredProducts,
      total: filteredProducts.length,
      limit: options.limit || 25,
      offset: options.offset || 0,
      hasMore: false, // Simplified for this implementation
    };
  }

  async getFeaturedVirtualStoreProducts(
    virtualStoreId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<VirtualProductTypes>> {
    const featuredFilters: QueryFilter[] = [
      { field: "featured", operator: "equal", value: true },
      ...(options.filters || []),
    ];

    return this.getVirtualStoreProducts(virtualStoreId, {
      ...options,
      filters: featuredFilters,
      orderBy: "$createdAt",
      orderType: "desc",
    });
  }

  async getImportAnalytics(virtualStoreId: string): Promise<{
    totalImports: number;
    activeImports: number;
    totalRevenuePotential: number;
    avgCommission: number;
    topCategories: { categoryId: string; count: number }[];
  }> {
    try {
      const allImports = await this.findByVirtualStore(virtualStoreId);
      const activeImports = allImports.documents.filter((imp) => imp.isActive);

      const totalImports = allImports.total;
      const activeCount = activeImports.length;

      const avgCommission =
        activeImports.length > 0
          ? activeImports.reduce((sum, imp) => sum + imp.commission, 0) /
            activeImports.length
          : 0;

      const { databases } = await createSessionClient();
      const productIds = activeImports.map((imp) => imp.productId);

      let totalRevenuePotential = 0;
      const categoryCount: { [key: string]: number } = {};

      if (productIds.length > 0) {
        const products = await databases.listDocuments<Products>(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          [Query.equal("$id", productIds)]
        );

        products.documents.forEach((product) => {
          const import_ = activeImports.find(
            (imp) => imp.productId === product.$id
          );
          if (import_) {
            const commission = product.basePrice + import_.commission;
            totalRevenuePotential += commission;

            categoryCount[product.categoryId] =
              (categoryCount[product.categoryId] || 0) + 1;
          }
        });
      }

      const topCategories = Object.entries(categoryCount)
        .map(([categoryId, count]) => ({ categoryId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalImports,
        activeImports: activeCount,
        totalRevenuePotential,
        avgCommission,
        topCategories,
      };
    } catch (error) {
      console.error("getImportAnalytics error: ", error);
      return {
        totalImports: 0,
        activeImports: 0,
        totalRevenuePotential: 0,
        avgCommission: 0,
        topCategories: [],
      };
    }
  }
}
