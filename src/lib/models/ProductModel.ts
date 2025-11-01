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
  PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
  PRODUCTS_BUCKET_ID,
  PRODUCTS_COLLECTION_ID,
  VARIANT_COMBINATIONS_COLLECTION_ID,
} from "../env-config";
import {
  CreateColorVariantData,
  CreateProductSchema,
  ProductCombinationSchema,
  UpdateCombinationData,
  UpdateProductSchema,
} from "../schemas/products-schems";
import {
  ProductColors,
  ProductCombinations,
  Products,
} from "../types/appwrite-types";
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

  private get combinationsModel() {
    return new ProductCombinationsModel();
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
      if (!productId) {
        return {
          success: true,
          combinations: [],
          total: 0,
          hasMore: false,
        };
      }

      const result = await this.combinationsModel.findByProduct(productId, {
        limit: options.limit || 50,
        offset: options.offset || 0,
        orderBy: options.orderBy || "$createdAt",
        orderType: options.orderType || "asc",
        activeOnly: options.activeOnly ?? true,
      });

      return {
        success: true,
        combinations: result.documents,
        total: result.total,
        hasMore: result.hasMore,
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
        }
      }

      // Create variant combinations
      if (
        data.hasVariants &&
        data.productCombinations &&
        data.productCombinations.length > 0
      ) {
        for (const combination of data.productCombinations) {
          const result = await this.combinationsModel.createCombination(
            combination,
            productId
          );

          if ("error" in result) {
            throw new Error(result.error);
          }
        }

        // Calculate and update total stock
        const totalStock = await this.combinationsModel.calculateTotalStock(
          productId
        );
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
    const { databases, storage } = await createAdminClient();
    const rollback = new AppwriteRollback(storage, databases);

    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const existingProduct = await this.findById(productId, {});
      if (!existingProduct) {
        return { error: "Product not found" };
      }

      const oldImages = existingProduct.images || [];
      const newImagesFiles =
        data.images?.filter((img) => img instanceof File) || [];
      const existingImageUrls =
        data.images?.filter((img) => typeof img === "string") || [];

      const uploadedImageUrls: string[] = [];
      for (const imageFile of newImagesFiles) {
        const uploaded = await this.storageService.uploadFile(
          imageFile as File
        );
        await rollback.trackFile(PRODUCTS_BUCKET_ID, uploaded.$id);
        const imageUrl = await this.storageService.getFileUrl(
          uploaded.$id,
          "view"
        );
        uploadedImageUrls.push(imageUrl);
      }

      const imagesToDelete = oldImages.filter(
        (url) => !existingImageUrls.includes(url as never)
      );
      for (const imageUrl of imagesToDelete) {
        const fileId = extractFileIdFromUrl(imageUrl);
        if (fileId) await storage.deleteFile(PRODUCTS_BUCKET_ID, fileId);
      }

      const updatedImages = [...existingImageUrls, ...uploadedImageUrls];

      // Update main product document with updated images and other data
      const updateData = { ...data, images: updatedImages };

      await rollback.trackDocument(PRODUCTS_COLLECTION_ID, productId);
      const updatedProduct = await this.update(productId, updateData);

      // Update color variants: remove missing, update existing, create new
      if (data.colorVariants) {
        const existingColors = await this.colorVariantsModel.findByProduct(
          productId
        );
        const incomingColorIds = data.colorVariants
          .map((cv) => cv.$id)
          .filter(Boolean);
        for (const color of existingColors.documents) {
          if (!incomingColorIds.includes(color.$id)) {
            await this.colorVariantsModel.deleteColorVariant(color.$id);
          }
        }
        for (const colorVariant of data.colorVariants) {
          if (colorVariant.$id) {
            await this.colorVariantsModel.updateColorVariant(
              colorVariant.$id,
              colorVariant
            );
          } else {
            const created = await this.colorVariantsModel.createColorVariant(
              { ...colorVariant, productId },
              user.$id
            );
            if ("error" in created) throw new Error(created.error);
          }
        }
      }

      // Update non-color variants similarly
      if (data.variants) {
        const existingVariants = await databases.listDocuments(
          DATABASE_ID,
          PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
          [Query.equal("productId", productId)]
        );
        const incomingVariantIds = data.variants
          .map((v) => v.$id)
          .filter(Boolean);
        for (const variant of existingVariants.documents) {
          if (!incomingVariantIds.includes(variant.$id)) {
            await databases.deleteDocument(
              DATABASE_ID,
              PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
              variant.$id
            );
          }
        }
        for (const variant of data.variants) {
          if (variant.$id) {
            await databases.updateDocument(
              DATABASE_ID,
              PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
              variant.$id,
              {
                catalogVariantTemplateId: variant.templateId,
                variantName: variant.name,
                inputType: variant.type,
                values: JSON.stringify(variant.values),
              }
            );
          } else {
            const variantId = ID.unique();
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
          }
        }
      }

      // Update product combinations using ProductCombinationsModel
      if (data.productCombinations) {
        const existingCombinations = await this.combinationsModel.findByProduct(
          productId,
          { limit: 1000 }
        );

        const incomingComboIds = data.productCombinations
          .map((c) => c.$id)
          .filter(Boolean);

        // Delete combinations not in the incoming list
        for (const combo of existingCombinations.documents) {
          if (!incomingComboIds.includes(combo.$id)) {
            await this.combinationsModel.deleteCombination(combo.$id);
          }
        }

        // Update existing or create new combinations
        for (const combination of data.productCombinations) {
          if (combination.$id) {
            // Update existing combination
            const result = await this.combinationsModel.updateCombination(
              combination.$id,
              combination
            );
            if ("error" in result) {
              throw new Error(result.error);
            }
          } else {
            // Create new combination
            const result = await this.combinationsModel.createCombination(
              combination,
              productId,
            );
            if ("error" in result) {
              throw new Error(result.error);
            }
          }
        }

        // Recalculate total stock
        const totalStock = await this.combinationsModel.calculateTotalStock(
          productId
        );
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
      }

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

            await this.combinationsModel.deleteCombinationsByProduct(productId);

            const variants = await databases.listDocuments(
              DATABASE_ID,
              PRODUCT_VARIANTS_VALUES_COLLECTION_ID,
              [Query.equal("productId", productId)]
            );

            await Promise.all(
              variants.documents.map(async (variant) => {
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

export class ProductCombinationsModel extends BaseModel<ProductCombinations> {
  constructor() {
    super(VARIANT_COMBINATIONS_COLLECTION_ID);
  }

  private get storageService() {
    return new ProductsStorageService();
  }

  async findByProduct(
    productId: string,
    options: QueryOptions & { activeOnly?: boolean } = {}
  ): Promise<PaginationResult<ProductCombinations>> {
    const filters: QueryFilter[] = [
      { field: "productId", operator: "equal", value: productId },
      ...(options.filters || []),
    ];

    if (options.activeOnly) {
      filters.push({ field: "isActive", operator: "equal", value: true });
    }

    return this.findMany({
      ...options,
      filters,
      orderBy: options.orderBy || "$createdAt",
      orderType: options.orderType || "asc",
    });
  }

  async findBySku(sku: string): Promise<ProductCombinations | null> {
    return this.findOne([{ field: "sku", operator: "equal", value: sku }]);
  }

  async findByVariantStrings(
    productId: string,
    variantStrings: string[]
  ): Promise<ProductCombinations | null> {
    const allCombinations = await this.findByProduct(productId);

    return (
      allCombinations.documents.find((combo) => {
        const comboStrings = combo.variantStrings || [];
        return (
          comboStrings.length === variantStrings.length &&
          variantStrings.every((vs) => comboStrings.includes(vs))
        );
      }) || null
    );
  }

  async findLowStock(
    productId: string,
    threshold: number = 10,
    options: QueryOptions = {}
  ): Promise<PaginationResult<ProductCombinations>> {
    const filters: QueryFilter[] = [
      { field: "productId", operator: "equal", value: productId },
      { field: "stockQuantity", operator: "lessThanEqual", value: threshold },
      { field: "stockQuantity", operator: "greaterThan", value: 0 },
      { field: "isActive", operator: "equal", value: true },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async findOutOfStock(
    productId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<ProductCombinations>> {
    const filters: QueryFilter[] = [
      { field: "productId", operator: "equal", value: productId },
      { field: "stockQuantity", operator: "equal", value: 0 },
      ...(options.filters || []),
    ];

    return this.findMany({
      ...options,
      filters,
    });
  }

  async createCombination(
    data: ProductCombinationSchema,
    productId: string
  ): Promise<ProductCombinations | { error: string }> {
    const { storage, databases } = await createAdminClient();
    const rollback = new AppwriteRollback(storage, databases);

    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      // Validate price
      if (data.basePrice < 0) {
        return { error: "Base price must be non-negative" };
      }

      // Check for duplicate SKU
      if (data.sku) {
        const existingSku = await this.findBySku(data.sku);
        if (existingSku) {
          return { error: `SKU "${data.sku}" already exists` };
        }
      }

      const imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        for (const image of data.images) {
          if (image instanceof File) {
            const uploaded = await this.storageService.uploadFile(image);
            await rollback.trackFile(PRODUCTS_BUCKET_ID, uploaded.$id);
            const imageUrl = await this.storageService.getFileUrl(
              uploaded.$id,
              "view"
            );
            imageUrls.push(imageUrl);
          }
        }
      }

      const combinationId = ID.unique();
      const combinationData = {
        productId,
        variantStrings: data.variantStrings || [],
        sku: data.sku,
        basePrice: data.basePrice,
        stockQuantity: data.stockQuantity || 0,
        isActive: data.isActive !== false,
        weight: data.weight || 0,
        dimensions: data.dimensions || "",
        images: imageUrls,
        variantValues: JSON.stringify(data.variantValues),
      };

      const permissions = createDocumentPermissions({ userId: user.$id });
      const newCombination =
        await databases.createDocument<ProductCombinations>(
          DATABASE_ID,
          VARIANT_COMBINATIONS_COLLECTION_ID,
          combinationId,
          combinationData,
          permissions
        );

      await rollback.trackDocument(
        VARIANT_COMBINATIONS_COLLECTION_ID,
        newCombination.$id
      );

      return newCombination;
    } catch (error) {
      console.error("createCombination error:", error);
      await rollback.rollback();

      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to create combination" };
    }
  }

  async updateCombination(
    combinationId: string,
    data: UpdateCombinationData
  ): Promise<ProductCombinations | { error: string }> {
    const { storage } = await createSessionClient();

    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const existingCombination = await this.findById(combinationId, {});
      if (!existingCombination) {
        return { error: "Combination not found" };
      }

      // Validate price if provided
      if (data.basePrice !== undefined && data.basePrice < 0) {
        return { error: "Base price must be non-negative" };
      }

      // Check SKU uniqueness if changed
      if (data.sku && data.sku !== existingCombination.sku) {
        const existingSku = await this.findBySku(data.sku);
        if (existingSku && existingSku.$id !== combinationId) {
          return { error: `SKU "${data.sku}" already exists` };
        }
      }

      // Handle image updates
      let updatedImages = existingCombination.images || [];

      // Process new images
      if (data.images && data.images.length > 0) {
        const newImageUrls: string[] = [];
        for (const img of data.images) {
          if (img instanceof File) {
            const uploaded = await this.storageService.uploadFile(img);
            const imageUrl = await this.storageService.getFileUrl(
              uploaded.$id,
              "view"
            );
            newImageUrls.push(imageUrl);
          } else if (typeof img === "string") {
            newImageUrls.push(img);
          }
        }

        // Delete old images that are not in the new set
        const imagesToDelete = updatedImages.filter(
          (url) => !newImageUrls.includes(url as never)
        );
        for (const imageUrl of imagesToDelete) {
          const fileId = extractFileIdFromUrl(imageUrl);
          if (fileId) {
            await storage.deleteFile(PRODUCTS_BUCKET_ID, fileId);
          }
        }

        updatedImages = newImageUrls;
      }

      // Prepare update data
      const updateData: any = {
        ...data,
        images: updatedImages,
      };

      // Stringify variantValues if provided
      if (data.variantValues) {
        updateData.variantValues = JSON.stringify(data.variantValues);
      }

      const updatedCombination = await this.update(combinationId, updateData);
      return updatedCombination;
    } catch (error) {
      console.error("updateCombination error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update combination" };
    }
  }

  async deleteCombination(
    combinationId: string
  ): Promise<{ success?: string; error?: string }> {
    const { storage } = await createSessionClient();

    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const combination = await this.findById(combinationId, {});
      if (!combination) {
        return { error: "Combination not found" };
      }

      // Delete images
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

      await this.delete(combinationId);

      return { success: "Combination deleted successfully" };
    } catch (error) {
      console.error("deleteCombination error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete combination" };
    }
  }

  /**
   * Delete all combinations for a product
   */
  async deleteCombinationsByProduct(
    productId: string
  ): Promise<{ success?: string; error?: string }> {
    try {
      const combinations = await this.findByProduct(productId, { limit: 1000 });

      if (combinations.documents.length === 0) {
        return { success: "No combinations to delete" };
      }

      // Delete in batches
      const batchSize = 5;
      for (let i = 0; i < combinations.documents.length; i += batchSize) {
        await Promise.all(
          combinations.documents
            .slice(i, i + batchSize)
            .map((combo) => this.deleteCombination(combo.$id))
        );
      }

      return {
        success: `${combinations.documents.length} combination(s) deleted successfully`,
      };
    } catch (error) {
      console.error("deleteCombinationsByProduct error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete combinations" };
    }
  }

  /**
   * Update stock quantity for a combination
   */
  async updateStock(
    combinationId: string,
    quantity: number,
    operation: "set" | "increment" | "decrement" = "set"
  ): Promise<ProductCombinations | { error: string }> {
    try {
      const combination = await this.findById(combinationId, {});
      if (!combination) {
        return { error: "Combination not found" };
      }

      let newStock = quantity;
      if (operation === "increment") {
        newStock = (combination.stockQuantity || 0) + quantity;
      } else if (operation === "decrement") {
        newStock = Math.max(0, (combination.stockQuantity || 0) - quantity);
      }

      return this.update(combinationId, { stockQuantity: newStock });
    } catch (error) {
      console.error("updateStock error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update stock" };
    }
  }

  /**
   * Toggle combination active status
   */
  async toggleActive(
    combinationId: string
  ): Promise<ProductCombinations | { error: string }> {
    try {
      const combination = await this.findById(combinationId, {});
      if (!combination) {
        return { error: "Combination not found" };
      }

      return this.update(combinationId, { isActive: !combination.isActive });
    } catch (error) {
      console.error("toggleActive error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to toggle active status" };
    }
  }

  /**
   * Calculate total stock for a product
   */
  async calculateTotalStock(productId: string): Promise<number> {
    try {
      const combinations = await this.findByProduct(productId, {
        limit: 1000,
        activeOnly: true,
      });

      return combinations.documents.reduce(
        (total, combo) => total + (combo.stockQuantity || 0),
        0
      );
    } catch (error) {
      console.error("calculateTotalStock error:", error);
      return 0;
    }
  }

  /**
   * Get combination statistics for a product
   */
  async getCombinationStats(productId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
    totalStock: number;
    averagePrice: number;
  }> {
    try {
      const allCombinations = await this.findByProduct(productId, {
        limit: 1000,
      });
      const docs = allCombinations.documents;

      const active = docs.filter((c) => c.isActive).length;
      const lowStock = docs.filter(
        (c) =>
          c.isActive &&
          (c.stockQuantity || 0) > 0 &&
          (c.stockQuantity || 0) <= 10
      ).length;
      const outOfStock = docs.filter(
        (c) => (c.stockQuantity || 0) === 0
      ).length;
      const totalStock = docs.reduce(
        (sum, c) => sum + (c.stockQuantity || 0),
        0
      );
      const averagePrice =
        docs.length > 0
          ? docs.reduce((sum, c) => sum + c.basePrice, 0) / docs.length
          : 0;

      return {
        total: docs.length,
        active,
        inactive: docs.length - active,
        lowStock,
        outOfStock,
        totalStock,
        averagePrice,
      };
    } catch (error) {
      console.error("getCombinationStats error:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        lowStock: 0,
        outOfStock: 0,
        totalStock: 0,
        averagePrice: 0,
      };
    }
  }
}
