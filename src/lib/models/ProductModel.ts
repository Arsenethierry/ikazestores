import { ID, Query } from "node-appwrite";
import { AppwriteRollback } from "../actions/rollback";
import {
  createAdminClient,
  createDocumentPermissions,
  createSessionClient,
} from "../appwrite";
import {
  BaseModel,
  PaginationResult,
  QueryFilter,
  QueryOptions,
} from "../core/database";
import {
  DATABASE_ID,
  PRODUCT_VARIANT_OPTIONS_COLLECTION_ID,
  PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
  PRODUCTS_BUCKET_ID,
  PRODUCTS_COLLECTION_ID,
  VARIANT_COMBINATIONS_COLLECTION_ID,
} from "../env-config";
import {
  CreateColorVariantData,
  CreateProductSchema,
  ProductCombinationSchema,
  UpdateProductSchema,
} from "../schemas/products-schems";
import {
  ProductColors,
  ProductCombinations,
  Products,
} from "../types/appwrite/appwrite";
import { getAuthState } from "../user-permission";
import { ProductsStorageService } from "./storage-models";
import { extractFileIdFromUrl } from "../utils";
import { ColorVariantsModel } from "./ColorVariantsModel";

export class ProductModel extends BaseModel<Products> {
  constructor() {
    super(PRODUCTS_COLLECTION_ID);
  }

  private get storageService() {
    return new ProductsStorageService();
  }

  private get colorVariantsModel() {
    return new ColorVariantsModel();
  }

  async findProductById(productId: string): Promise<Products | null> {
    return await this.findById(productId, {});
  }

  async findProductWithColors(
    productId: string
  ): Promise<(Products & { colors: ProductColors[] }) | null> {
    const product = await this.findById(productId, {});
    if (!product) {
      return null;
    }
    const colorsResult = await this.colorVariantsModel.findByProduct(productId);
    return {
      ...product,
      colors: colorsResult.documents,
    };
  }

  async findByPhysicalStore(
    physicalStoreId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Products>> {
    const filters: QueryFilter[] = [
      { field: "physicalStoreId", operator: "equal", value: physicalStoreId },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async findDropshippingEnabledProducts(
    options: QueryOptions = {}
  ): Promise<PaginationResult<Products>> {
    const filters: QueryFilter[] = [
      { field: "isDropshippingEnabled", operator: "equal", value: true },
      { field: "status", operator: "equal", value: "active" },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async findByCategory(
    categoryId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Products>> {
    const filters: QueryFilter[] = [
      { field: "categoryId", operator: "equal", value: categoryId },
      { field: "status", operator: "equal", value: "active" },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async findByStatus(
    status: "active" | "draft" | "archived",
    options: QueryOptions = {}
  ): Promise<PaginationResult<Products>> {
    const filters: QueryFilter[] = [
      { field: "status", operator: "equal", value: status },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async searchProducts(
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Products>> {
    const filters: QueryFilter[] = [
      { field: "name", operator: "contains", value: searchTerm },
      { field: "status", operator: "equal", value: "active" },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async getProductsCombinations(
    productId: string,
    options: {
      limit?: number;
      offset?: number;
      activeOnly?: boolean;
      orderBy?: string;
      orderType?: "asc" | "desc";
    } = {}
  ): Promise<{
    success: boolean;
    combinations: ProductCombinations[];
    total: number;
    hasMore: boolean;
    error?: string;
  }> {
    try {
      const {
        limit = 50,
        offset = 0,
        activeOnly = true,
        orderBy = "$createdAt",
        orderType = "asc",
      } = options;
      const { databases } = await createSessionClient();
      if (!productId) {
        return {
          success: true,
          combinations: [],
          total: 0,
          hasMore: false,
        };
      }

      const queries = [
        Query.equal("productId", productId),
        Query.limit(limit),
        Query.offset(offset),
      ];

      if (orderType === "desc") {
        queries.push(Query.orderDesc(orderBy));
      } else {
        queries.push(Query.orderAsc(orderBy));
      }

      if (activeOnly) {
        queries.push(Query.equal("isActive", true));
      }

      const result = await databases.listDocuments<ProductCombinations>(
        DATABASE_ID,
        VARIANT_COMBINATIONS_COLLECTION_ID,
        queries
      );

      return {
        success: true,
        combinations: result.documents,
        total: result.total,
        hasMore: offset + result.documents.length < result.total,
      };
    } catch (error) {
      console.error("getProductsCombinations error: ", error);
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

  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Products>> {
    const filters: QueryFilter[] = [
      { field: "basePrice", operator: "greaterThanEqual", value: minPrice },
      { field: "basePrice", operator: "lessThanEqual", value: maxPrice },
      { field: "status", operator: "equal", value: "active" },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async findNearbyProducts(
    southWest: { lat: number; lng: number },
    northEast: { lat: number; lng: number },
    options: QueryOptions = {}
  ): Promise<PaginationResult<Products>> {
    const filters: QueryFilter[] = [
      { field: "storeLatitude", operator: "greaterThan", value: southWest.lat },
      { field: "storeLatitude", operator: "lessThan", value: northEast.lat },
      {
        field: "storeLongitude",
        operator: "greaterThan",
        value: southWest.lng,
      },
      { field: "storeLongitude", operator: "lessThan", value: northEast.lng },
      { field: "status", operator: "equal", value: "active" },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async getFeaturedProducts(
    options: QueryOptions = {}
  ): Promise<PaginationResult<Products>> {
    const filters: QueryFilter[] = [
      { field: "featured", operator: "equal", value: true },
      { field: "status", operator: "equal", value: "active" },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
      orderBy: "$createdAt",
      orderType: "desc",
    });
  }

  async getProductsByTag(
    tag: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Products>> {
    const filters: QueryFilter[] = [
      { field: "tags", operator: "contains", value: tag },
      { field: "status", operator: "equal", value: "active" },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async createProduct(
    data: CreateProductSchema
  ): Promise<Products | { error: string }> {
    const { databases, storage: storageAdmin } = await createAdminClient();
    const rollback = await new AppwriteRollback(storageAdmin, databases);

    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      // Validate combination prices
      if (
        data.hasVariants &&
        data.productCombinations &&
        data.productCombinations.length > 0
      ) {
        const invalidCombinations = data.productCombinations.filter(
          (combo) => combo.basePrice < 0
        );

        if (invalidCombinations.length > 0) {
          return { error: "All variant combinations must have valid prices" };
        }
      }

      const documentPermissions = createDocumentPermissions({
        userId: user.$id,
      });
      const imageUrls: string[] = [];

      // Upload main product images
      if (data.images && data.images.length > 0) {
        for (const image of data.images) {
          const uploadedImage = await this.storageService.uploadFile(image);
          await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);

          const imageUrl = await this.storageService.getFileUrl(
            uploadedImage.$id,
            "view"
          );
          imageUrls.push(imageUrl);
        }
      }

      // Create main product document
      const productId = ID.unique();
      const productData = {
        physicalStoreId: data.physicalStoreId,
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription || "",
        sku: data.sku,
        basePrice: data.basePrice,
        currency: data.currency,
        status: data.status,
        featured: data.featured,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        productTypeId: data.productTypeId,
        tags: data.tags || [],
        images: imageUrls,
        hasVariants: data.hasVariants || false,
        isDropshippingEnabled: data.isDropshippingEnabled || false,
        createdBy: user.$id,
        storeLatitude: data.storeLatitude || 0,
        storeLongitude: data.storeLongitude || 0,
        storeCountry: data.storeCountry,
        totalStock: data.totalStock,
        stockStatus: data.stockStatus ?? ("in_stock" as const),

        // denormalized fields
        categoryName: data.denormalized?.categoryName,
        subcategoryName: data.denormalized?.subcategoryName,
        productTypeName: data.denormalized?.productTypeName,
        categoryPath: data.denormalized?.categoryPath,
        categoryIds: data.denormalized?.categoryIds?.map((id) => id),
        availableVariantTypes: data.denormalized?.availableVariantTypes?.map(
          (type) => type
        ),
        availableVariantValues: data.denormalized?.availableVariantValues?.map(
          (value) => value
        ),
        availableColorCodes: data.denormalized?.availableColorCodes?.map(
          (color) => color
        ),
        searchText: data.denormalized?.searchText,
        searchKeywords: data.denormalized?.searchKeywords?.map(
          (keyword) => keyword
        ),
        viewCount: data.denormalized?.viewCount,
        orderCount: data.denormalized?.orderCount,
        saveCount: data.denormalized?.saveCount,
        rating: data.denormalized?.rating,
        reviewCount: data.denormalized?.reviewCount,
        popularityScore: data.denormalized?.popularityScore,
      };

      const newProduct = await databases.createDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId,
        productData,
        documentPermissions
      );

      await rollback.trackDocument(PRODUCTS_COLLECTION_ID, newProduct.$id);

      // Create color variants if enabled
      if (
        data.enableColors &&
        data.colorVariants &&
        data.colorVariants.length > 0
      ) {
        for (const colorVariant of data.colorVariants) {
          const colorResult = await this.colorVariantsModel.createColorVariant(
            {
              ...colorVariant,
              productId,
            },
            user.$id
          );

          if ("error" in colorResult) {
            console.error(
              `Failed to create color variant: ${colorResult.error}`
            );
            throw new Error(colorResult.error);
          }
        }
      }

      // Create catalog variants (non-color)
      if (data.hasVariants && data.variants && data.variants.length > 0) {
        const nonColorVariants = data.variants.filter((variant) => {
          const name = variant.name?.toLowerCase() || "";
          const type = variant.type?.toLowerCase() || "";
          const colorKeywords = ["color", "colour", "hue", "shade", "tint"];
          return !colorKeywords.some(
            (keyword) => name.includes(keyword) || type.includes(keyword)
          );
        });

        // Create variant documents and their options
        for (const variant of nonColorVariants) {
          const variantId = ID.unique();

          // Create the variant document
          await databases.createDocument(
            DATABASE_ID,
            PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
            variantId,
            {
              productId,
              catalogVariantTemplateId: variant.templateId,
              variantName: variant.name,
              inputType: variant.type,
              values: JSON.stringify(variant.values),
            }
          );
          await rollback.trackDocument(
            PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
            variantId
          );

          // Create variant options
          // if (variant.values && variant.values.length > 0) {
          //   for (const option of variant.values) {
          //     const optionId = ID.unique();
          //     await databases.createDocument(
          //       DATABASE_ID,
          //       PRODUCT_VARIANT_OPTIONS_COLLECTION_ID,
          //       optionId,
          //       {
          //         variantId,
          //         value: option.value || "",
          //         label: option.label || option.value || "",
          //         colorCode: option.colorCode || "",
          //         additionalPrice: option.additionalPrice || 0,
          //         isDefault: option.isDefault || false,
          //       }
          //     );
          //     await rollback.trackDocument(
          //       PRODUCT_VARIANT_OPTIONS_COLLECTION_ID,
          //       optionId
          //     );
          //   }
          // }
        }
      }

      // Create variant combinations
      if (
        data.hasVariants &&
        data.productCombinations &&
        data.productCombinations.length > 0
      ) {
        let totalStock = 0;

        for (const combination of data.productCombinations) {
          const combinationId = ID.unique();

          // Upload combination-specific images
          const combinationImageUrls: string[] = [];
          if (combination.images && combination.images.length > 0) {
            for (const image of combination.images) {
              if (image instanceof File) {
                const uploadedImage = await this.storageService.uploadFile(
                  image
                );
                await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);
                const imageUrl = await this.storageService.getFileUrl(
                  uploadedImage.$id,
                  "view"
                );
                combinationImageUrls.push(imageUrl);
              }
            }
          }

          // Create combination document
          await databases.createDocument(
            DATABASE_ID,
            VARIANT_COMBINATIONS_COLLECTION_ID,
            combinationId,
            {
              productId,
              variantStrings: combination.variantStrings || [],
              sku: combination.sku,
              basePrice: combination.basePrice,
              stockQuantity: combination.stockQuantity || 0,
              isActive: combination.isActive !== false,
              weight: combination.weight || 0,
              dimensions: combination.dimensions || "",
              images: combinationImageUrls,
              variantValues: JSON.stringify(combination.variantValues),
            },
            documentPermissions
          );
          await rollback.trackDocument(
            VARIANT_COMBINATIONS_COLLECTION_ID,
            combinationId
          );

          // Track stock
          totalStock += combination.stockQuantity || 0;
        }

        // Update product with total stock
        await databases.updateDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          productId,
          {
            totalStock,
            stockStatus:
              totalStock > 10
                ? "in_stock"
                : totalStock > 0
                ? "low_stock"
                : "out_of_stock",
          }
        );
      } else {
        // No variants, set default stock
        await databases.updateDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          productId,
          {
            totalStock: 1,
            stockStatus: "in_stock",
          }
        );
      }

      // Fetch and return the complete product
      const completeProduct = await databases.getDocument<Products>(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId
      );

      return completeProduct;
    } catch (error) {
      console.error("createProduct error: ", error);
      await rollback.rollback();

      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to create product" };
    }
  }

  async updateProduct(
    productId: string,
    data: UpdateProductSchema
  ): Promise<Products | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const existingProduct = await this.findById(productId, {});
      if (!existingProduct) {
        return { error: "Product not found" };
      }

      const updatedProduct = await this.update(productId, data);
      return updatedProduct;
    } catch (error) {
      console.error("updateProduct error: ", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update product" };
    }
  }

  async deleteProducts(
    productIds: string[]
  ): Promise<{ success?: string; error?: string }> {
    const { databases, storage } = await createSessionClient();

    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const batchSize = 5;
      for (let i = 0; i < productIds.length; i += batchSize) {
        await Promise.all(
          productIds.slice(i, i + batchSize).map(async (productId) => {
            const product = await databases.getDocument<Products>(
              DATABASE_ID,
              PRODUCTS_COLLECTION_ID,
              productId
            );

            const colorVariantsResult =
              await this.colorVariantsModel.deleteColorVariantsByProduct(
                productId
              );
            if ("error" in colorVariantsResult) {
              console.error(
                `Failed to delete color variants: ${colorVariantsResult.error}`
              );
            }

            if (product.images && product.images.length > 0) {
              await Promise.all(
                product.images.map(async (imageUrl: string) => {
                  const fileId = extractFileIdFromUrl(imageUrl);
                  if (fileId) {
                    await storage.deleteFile(PRODUCTS_BUCKET_ID, fileId);
                  }
                })
              );
            }

            const combinations = await databases.listDocuments(
              DATABASE_ID,
              VARIANT_COMBINATIONS_COLLECTION_ID,
              [Query.equal("productId", productId)]
            );

            await Promise.all(
              combinations.documents.map(async (combination) => {
                if (combination.images && combination.images.length > 0) {
                  await Promise.all(
                    combination.images.map(async (imageUrl: string) => {
                      const fileId = extractFileIdFromUrl(imageUrl);
                      if (fileId) {
                        await storage.deleteFile(PRODUCTS_BUCKET_ID, fileId);
                      }
                    })
                  );
                }

                await databases.deleteDocument(
                  DATABASE_ID,
                  VARIANT_COMBINATIONS_COLLECTION_ID,
                  combination.$id
                );
              })
            );

            const variants = await databases.listDocuments(
              DATABASE_ID,
              PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
              [Query.equal("productId", productId)]
            );

            await Promise.all(
              variants.documents.map(async (variant) => {
                // const options = await databases.listDocuments(
                //   DATABASE_ID,
                //   PRODUCT_VARIANT_OPTIONS_COLLECTION_ID,
                //   [Query.equal("variantId", variant.$id)]
                // );

                // for (const option of options.documents) {
                //   await databases.deleteDocument(
                //     DATABASE_ID,
                //     PRODUCT_VARIANT_OPTIONS_COLLECTION_ID,
                //     option.$id
                //   );
                // }

                await databases.deleteDocument(
                  DATABASE_ID,
                  PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
                  variant.$id
                );
              })
            );

            await databases.deleteDocument(
              DATABASE_ID,
              PRODUCTS_COLLECTION_ID,
              productId
            );
          })
        );
      }

      return {
        success: `${productIds.length} product(s) deleted successfully!`,
      };
    } catch (error) {
      console.error("deleteProducts error: ", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete product(s)" };
    }
  }

  async getProductColors(productId: string) {
    return await this.colorVariantsModel.findByProduct(productId);
  }

  async removeColorFromProduct(colorVariantId: string) {
    return await this.colorVariantsModel.deleteColorVariant(colorVariantId);
  }

  async toggleFeatured(
    productId: string
  ): Promise<Products | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const existingProduct = await this.findProductById(productId);
      if (!existingProduct) {
        return { error: "Access denied" };
      }

      const updatedProduct = await this.update(productId, {
        featured: !existingProduct.featured,
      });

      return updatedProduct;
    } catch (error) {
      console.error("toggleFeatured error: ", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to toggle featured status" };
    }
  }

  async getProductStats(storeId: string): Promise<
    | {
        totalProducts: number;
        activeProducts: number;
        draftProducts: number;
        archivedProducts: number;
        featuredProducts: number;
        dropshippingEnabled: number;
        totalValue: number;
        averagePrice: number;
      }
    | { error: string }
  > {
    try {
      const result = await this.findByPhysicalStore(storeId, {
        limit: 10000,
      });

      const products = result.documents;
      const activeProducts = products.filter(
        (p) => p.status === "active"
      ).length;
      const draftProducts = products.filter((p) => p.status === "draft").length;
      const archivedProducts = products.filter(
        (p) => p.status === "archived"
      ).length;
      const featuredProducts = products.filter((p) => p.featured).length;
      const dropshippingEnabled = products.filter(
        (p) => p.isDropshippingEnabled
      ).length;

      const totalValue = products.reduce(
        (sum, product) => sum + product.basePrice,
        0
      );
      const averagePrice =
        products.length > 0 ? totalValue / products.length : 0;

      return {
        totalProducts: products.length,
        activeProducts,
        draftProducts,
        archivedProducts,
        featuredProducts,
        dropshippingEnabled,
        totalValue,
        averagePrice,
      };
    } catch (error) {
      console.error("getProductStats error: ", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to get product statistics" };
    }
  }
}
