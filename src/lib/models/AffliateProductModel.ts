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
  Discounts,
  ProductColors,
  ProductCombinations,
  Products,
} from "../types/appwrite-types";
import {
  CreateAffiliateImportSchema,
  UpdateAffiliateImportSchema,
} from "../schemas/products-schems";
import { getAuthState } from "../user-permission";
import { ProductModel } from "./ProductModel";
import { OriginalProductTypes, VirtualProductTypes } from "../types";
import { VirtualStore } from "./virtual-store";
import { DiscountModel } from "./DiscountModel";
import { DiscountCalculator } from "../helpers/discount-calculator";

export interface VirtualStoreCombination extends ProductCombinations {
  finalPrice: number;
  commission: number;
}
export class AffiliateProductModel extends BaseModel<AffiliateProductImports> {
  constructor() {
    super(AFFILIATE_PRODUCT_IMPORTS_COLLECTION_ID);
  }

  private get discountModel() {
    return new DiscountModel();
  }

  private get originalProduct() {
    return new ProductModel();
  }

  private get virtualStore() {
    return new VirtualStore();
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
    try {
      const virtualProduct = await this.findById(productId, {});
      if (!virtualProduct) return null;

      const originalProduct = await this.originalProduct.findProductWithColors(
        virtualProduct.productId
      );
      if (!originalProduct) return null;

      const virtualStoreData = await this.virtualStore.findById(
        virtualProduct.virtualStoreId,
        {}
      );
      if (!virtualStoreData) return null;

      // Get best discount for this product
      const discount = await this.discountModel.getBestDiscountForProduct(
        virtualProduct.productId,
        virtualProduct.physicalStoreId,
        originalProduct.basePrice
      );

      // Calculate price with discount
      const priceBreakdown = DiscountCalculator.calculatePrice(
        originalProduct.basePrice,
        virtualProduct.commission,
        discount
      );

      return {
        ...virtualProduct,
        name: originalProduct.name,
        description: originalProduct.description,
        shortDescription: originalProduct.shortDescription || undefined,
        sku: originalProduct.sku,
        images: originalProduct.images || [],
        tags: originalProduct.tags?.length ? originalProduct.tags : null,

        // Price information
        price: priceBreakdown.finalPrice,
        basePrice: isAdmin
          ? originalProduct.basePrice
          : virtualProduct.commission,
        commission: virtualProduct.commission,

        // Discount breakdown
        priceBreakdown: {
          originalPrice: priceBreakdown.originalPriceWithCommission,
          finalPrice: priceBreakdown.finalPrice,
          discountAmount: priceBreakdown.discountAmount,
          discountPercentage: priceBreakdown.discountPercentage,
          hasDiscount: priceBreakdown.hasDiscount,
          activeDiscount: priceBreakdown.activeDiscount,
        },
        finalPrice: priceBreakdown.finalPrice,
        originalPrice: priceBreakdown.originalPriceWithCommission,
        savings: priceBreakdown.totalSavings,
        hasDiscount: priceBreakdown.hasDiscount,
        discount: discount || undefined,

        currency: originalProduct.currency,
        status: originalProduct.status,
        hasVariants: originalProduct.hasVariants,
        virtualStore: virtualStoreData,
        colors:
          originalProduct.colors.length > 0 ? originalProduct.colors : null,
        categoryId: originalProduct.categoryId,
        subcategoryId: originalProduct.subcategoryId,
        productTypeId: originalProduct.productTypeId,
        physicalStoreCountry: originalProduct.storeCountry,
        physicalStoreLatitude: originalProduct.storeLatitude,
        physicalStoreLongitude: originalProduct.storeLongitude,
        physicalStoreId: originalProduct.physicalStoreId,
      } as VirtualProductTypes;
    } catch (error) {
      console.error("findVirtualProductById error:", error);
      return null;
    }
  }

  async getVirtualStoreProducts(
    virtualStoreId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<VirtualProductTypes>> {
    try {
      const virtualProducts = await this.findByVirtualStore(
        virtualStoreId,
        options
      );

      if (virtualProducts.documents.length === 0) {
        return {
          documents: [],
          total: 0,
          hasMore: false,
          limit: 25,
          offset: 0,
        };
      }

      const productIds = [
        ...new Set(virtualProducts.documents.map((vp) => vp.productId)),
      ];

      const physicalStoreIds = [
        ...new Set(virtualProducts.documents.map((vp) => vp.physicalStoreId)),
      ];

      const originalProductsMap = await this.fetchOriginalProductsMap(
        productIds
      );

      const productPrices = new Map<string, number>();
      originalProductsMap.forEach((product, productId) => {
        productPrices.set(productId, product.basePrice);
      });

      const [discountsMap, virtualStoreData] = await Promise.all([
        this.fetchDiscountsForStores(
          physicalStoreIds,
          productIds,
          productPrices
        ),
        this.virtualStore.findById(virtualStoreId, {}),
      ]);


      console.log("dddddD: ,", discountsMap)

      const enrichedProducts = virtualProducts.documents
        .map((virtualProduct) => {
          const originalProduct = originalProductsMap.get(
            virtualProduct.productId
          );
          if (!originalProduct) return null;

          const discount = discountsMap.get(virtualProduct.productId) || null;

          const priceBreakdown = DiscountCalculator.calculatePrice(
            originalProduct.basePrice,
            virtualProduct.commission,
            discount
          );

          return {
            ...virtualProduct,
            name: originalProduct.name,
            description: originalProduct.description,
            shortDescription: originalProduct.shortDescription,
            sku: originalProduct.sku,
            images: originalProduct.images || [],
            tags: originalProduct.tags?.length ? originalProduct.tags : null,

            // Price fields
            price: priceBreakdown.finalPrice,
            basePrice: originalProduct.basePrice,
            commission: virtualProduct.commission,

            priceBreakdown: {
              originalPrice: priceBreakdown.originalPriceWithCommission,
              finalPrice: priceBreakdown.finalPrice,
              discountAmount: priceBreakdown.discountAmount,
              discountPercentage: priceBreakdown.discountPercentage,
              hasDiscount: priceBreakdown.hasDiscount,
              activeDiscount: priceBreakdown.activeDiscount,
            },
            finalPrice: priceBreakdown.finalPrice,
            originalPrice: priceBreakdown.originalPriceWithCommission,
            savings: priceBreakdown.totalSavings,
            hasDiscount: priceBreakdown.hasDiscount,
            discount: discount || undefined,

            currency: originalProduct.currency,
            status: originalProduct.status,
            hasVariants: originalProduct.hasVariants,
            virtualStore: virtualStoreData,
            colors:
              originalProduct.colors.length > 0 ? originalProduct.colors : null,
            categoryId: originalProduct.categoryId,
            subcategoryId: originalProduct.subcategoryId,
            productTypeId: originalProduct.productTypeId,
            physicalStoreCountry: originalProduct.storeCountry,
            physicalStoreLatitude: originalProduct.storeLatitude,
            physicalStoreLongitude: originalProduct.storeLongitude,
            physicalStoreId: originalProduct.physicalStoreId,
          } as VirtualProductTypes;
        })
        .filter((p): p is VirtualProductTypes => p !== null);

      return {
        documents: enrichedProducts,
        total: virtualProducts.total,
        hasMore: virtualProducts.hasMore,
        limit: options.limit || 25,
        offset: options.offset || 0,
      };
    } catch (error) {
      console.error("getVirtualStoreProducts error:", error);
      return {
        documents: [],
        total: 0,
        hasMore: false,
        limit: options.limit || 25,
        offset: options.offset || 0,
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
    data: any
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

  private async fetchOriginalProductsMap(
    productIds: string[]
  ): Promise<Map<string, Products & { colors: ProductColors[] }>> {
    const map = new Map();
    await Promise.all(
      productIds.map(async (productId) => {
        const product = await this.originalProduct.findProductWithColors(
          productId
        );
        if (product) map.set(productId, product);
      })
    );
    return map;
  }

  private async fetchDiscountsForStores(
    physicalStoreIds: string[],
    productIds: string[],
    productPrices: Map<string, number>
  ): Promise<Map<string, Discounts | null>> {
    const allDiscounts = new Map<string, Discounts | null>();

    await Promise.all(
      physicalStoreIds.map(async (storeId) => {
        const storeDiscounts =
          await this.discountModel.getBestDiscountsForProducts(
            productIds,
            storeId,
            productPrices
          );

        storeDiscounts.forEach((discount, productId) => {
          const existingDiscount = allDiscounts.get(productId);
          if (!existingDiscount) {
            allDiscounts.set(productId, discount);
          } else if (discount) {
            const basePrice = productPrices.get(productId) || 0;
            const bestDiscount = DiscountCalculator.getBestDiscount(
              basePrice,
              existingDiscount,
              discount
            );
            allDiscounts.set(productId, bestDiscount);
          }
        });
      })
    );

    return allDiscounts;
  }
}
