import { z } from "zod";

// ============================================
// Base Schemas
// ============================================

export const DenormalizedFieldsSchema = z.object({
  categoryName: z.string().optional(),
  subcategoryName: z.string().optional(),
  productTypeName: z.string().optional(),
  categoryPath: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),

  variantCount: z.number().optional(),
  availableVariantTypes: z.array(z.string()).optional(),
  availableVariantValues: z.array(z.string()).optional(),

  availableColorCodes: z.array(z.string()).optional(),
  searchText: z.string().optional(),
  searchKeywords: z.array(z.string()).optional(),
  normalizedName: z.string().optional(),

  // Popularity / aggregates
  viewCount: z.number().default(0),
  orderCount: z.number().default(0),
  saveCount: z.number().default(0),
  rating: z.number().default(0),
  reviewCount: z.number().default(0),
  popularityScore: z.number().default(0),
});

export const VariantValueSchema = z.object({
  value: z.string().min(1, "Value is required"),
  label: z.string().min(1, "Label is required"),
  colorCode: z.string().optional(),
  additionalPrice: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export const VariantSchema = z.object({
  $id: z.string(),
  templateId: z.string().min(1, "Template ID is required"),
  name: z.string().min(1, "Variant name is required"),
  type: z.enum([
    "text",
    "color",
    "range",
    "number",
    "select",
    "multiselect",
    "boolean",
  ]),
  values: z.array(VariantValueSchema).min(1, "At least one value is required"),
  required: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const ProductCombinationSchema = z.object({
  variantStrings: z.array(z.string()).optional(),
  sku: z.string().min(1, "SKU is required"),
  basePrice: z.number().min(0, "Price must be positive"),
  stockQuantity: z.number().min(0, "Stock must be non-negative").optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.string().optional(),
  images: z.array(z.instanceof(File)).optional(),
  variantValues: z.record(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const ColorVariantSchema = z.object({
  $id: z.string(),
  colorName: z.string().min(1, "Color name is required"),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color code"),
  images: z.array(z.instanceof(File)).min(1, "At least one image required"),
  additionalPrice: z.number().min(0).optional(),
  isDefault: z.boolean().optional(),
});

export const CreateAffiliateImportSchema = z.object({
  virtualStoreId: z.string().min(1, "Virtual store ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  commission: z
    .number()
    .min(0, "Commission must be greater than or equal to 0"),
  selectedCombinations: z.array(z.string()).optional().default([]), // Array of combination IDs to import
  customCombinationPricing: z
    .array(
      z.object({
        combinationId: z.string(),
        customCommission: z.number().min(0, "Custom commission must be ≥ 0"),
      })
    )
    .optional(),
});

export const UpdateAffiliateImportSchema = z.object({
  commission: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Step Validation Schemas
// ============================================

export const BasicInfoStepSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().optional(),
  sku: z.string().min(3, "SKU is required"),
  basePrice: z.number().min(0, "Price must be positive"),
  currency: z.string(),
  status: z.enum(["active", "draft", "archived"]),
  featured: z.boolean(),
  isDropshippingEnabled: z.boolean(),
});

export const CategoryStepSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().min(1, "Subcategory is required"),
  productTypeId: z.string().min(1, "Product type is required"),
  tags: z.array(z.string()).optional(),
});

export const VariantsStepSchema = z
  .object({
    hasVariants: z.boolean(),
    variants: z.array(VariantSchema).optional(),
    productCombinations: z.array(ProductCombinationSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.hasVariants) return true;

      // Check if there are non-color variants
      const hasNonColorVariants = data.variants?.some((variant) => {
        const name = variant.name?.toLowerCase() || "";
        const type = variant.type?.toLowerCase() || "";
        const colorKeywords = ["color", "colour", "hue", "shade", "tint"];
        return !colorKeywords.some(
          (keyword) => name.includes(keyword) || type.includes(keyword)
        );
      });

      if (!hasNonColorVariants) return true;

      // If has non-color variants, need combinations
      return data.productCombinations && data.productCombinations.length > 0;
    },
    {
      message: "Product combinations are required when variants are enabled",
      path: ["productCombinations"],
    }
  );

export const ImagesStepSchema = z
  .object({
    images: z
      .array(z.instanceof(File))
      .min(1, "At least one image is required")
      .max(10, "Maximum 10 images allowed"),
    enableColors: z.boolean(),
    colorVariants: z.array(ColorVariantSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.enableColors) return true;
      return data.colorVariants && data.colorVariants.length > 0;
    },
    {
      message: "At least one color variant is required when colors are enabled",
      path: ["colorVariants"],
    }
  )
  .refine(
    (data) => {
      if (!data.enableColors || !data.colorVariants) return true;
      return data.colorVariants.some((c) => c.isDefault);
    },
    {
      message: "At least one color must be set as default",
      path: ["colorVariants"],
    }
  )
  .refine(
    (data) => {
      if (!data.enableColors || !data.colorVariants) return true;
      const names = data.colorVariants.map((c) => c.colorName.toLowerCase());
      return new Set(names).size === names.length;
    },
    {
      message: "Color names must be unique",
      path: ["colorVariants"],
    }
  );

// ============================================
// Main Product Creation Schema
// ============================================

export const CreateProductSchema = z
  .object({
    // Basic Info
    name: z.string().min(3, "Product name must be at least 3 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    shortDescription: z.string().optional(),
    sku: z.string().min(3, "SKU is required"),
    basePrice: z.number().min(0, "Price must be positive"),
    currency: z.string(),
    status: z.enum(["active", "draft", "archived"]),
    stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock"]),
    totalStock: z.number().default(1),
    featured: z.boolean(),
    isDropshippingEnabled: z.boolean(),

    // Category Info
    categoryId: z.string().min(1, "Category is required"),
    subcategoryId: z.string().min(1, "Subcategory is required"),
    productTypeId: z.string().min(1, "Product type is required"),
    tags: z.array(z.string()).optional(),

    // Store Info
    physicalStoreId: z.string().min(1, "Store ID is required"),
    storeLatitude: z.number(),
    storeLongitude: z.number(),
    storeCountry: z.string().min(1, "Store country is required"),

    // Variants
    hasVariants: z.boolean(),
    variants: z.array(VariantSchema).optional(),
    productCombinations: z.array(ProductCombinationSchema).optional(),

    // Images & Colors
    images: z
      .array(z.instanceof(File))
      .min(1, "At least one image is required")
      .max(10, "Maximum 10 images allowed"),
    enableColors: z.boolean(),
    hasColorVariants: z.boolean().optional(),
    colorVariants: z.array(ColorVariantSchema).optional(),

    // Denormalized block (readonly in UI but persisted)
    denormalized: DenormalizedFieldsSchema.optional(),
  })
  .refine(
    (data) => {
      if (!data.hasVariants) return true;

      const hasNonColorVariants = data.variants?.some((variant) => {
        const name = variant.name?.toLowerCase() || "";
        const type = variant.type?.toLowerCase() || "";
        const colorKeywords = ["color", "colour", "hue", "shade", "tint"];
        return !colorKeywords.some(
          (keyword) => name.includes(keyword) || type.includes(keyword)
        );
      });

      if (!hasNonColorVariants) return true;
      return data.productCombinations && data.productCombinations.length > 0;
    },
    {
      message: "Product combinations are required when variants are enabled",
      path: ["productCombinations"],
    }
  )
  .refine(
    (data) => {
      if (!data.productCombinations || data.productCombinations.length === 0)
        return true;
      const skus = data.productCombinations.map((c) => c.sku);
      return new Set(skus).size === skus.length;
    },
    {
      message: "Product combination SKUs must be unique",
      path: ["productCombinations"],
    }
  )
  .refine(
    (data) => {
      if (!data.productCombinations || data.productCombinations.length === 0)
        return true;
      return data.productCombinations.some((c) => c.isDefault);
    },
    {
      message: "At least one combination must be set as default",
      path: ["productCombinations"],
    }
  )
  .refine(
    (data) => {
      if (!data.enableColors) return true;
      return data.colorVariants && data.colorVariants.length > 0;
    },
    {
      message: "At least one color variant is required when colors are enabled",
      path: ["colorVariants"],
    }
  )
  .refine(
    (data) => {
      if (!data.enableColors || !data.colorVariants) return true;
      return data.colorVariants.some((c) => c.isDefault);
    },
    {
      message: "At least one color must be set as default",
      path: ["colorVariants"],
    }
  )
  .refine(
    (data) => {
      if (!data.enableColors || !data.colorVariants) return true;
      const names = data.colorVariants.map((c) => c.colorName.toLowerCase());
      return new Set(names).size === names.length;
    },
    {
      message: "Color names must be unique",
      path: ["colorVariants"],
    }
  )
  .refine(
    (data) => {
      if (!data.enableColors || !data.colorVariants) return true;
      const colorsWithoutImages = data.colorVariants.filter(
        (c) => !c.images || c.images.length === 0
      );
      return colorsWithoutImages.length === 0;
    },
    {
      message: "All color variants must have at least one image",
      path: ["colorVariants"],
    }
  );

// ============================================
// Update Product Schema
// ============================================

export const UpdateProductSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  shortDescription: z.string().optional(),
  sku: z.string().min(3).optional(),
  basePrice: z.number().min(0).optional(),
  currency: z.string().optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  featured: z.boolean().optional(),
  isDropshippingEnabled: z.boolean().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  productTypeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hasVariants: z.boolean().optional(),
  variants: z.array(VariantSchema).optional(),
  productCombinations: z.array(ProductCombinationSchema.extend({
  $id: z.string().optional(),
})).optional(),
  images: z.array(z.instanceof(File)).optional(),
  enableColors: z.boolean().optional(),
  hasColorVariants: z.boolean().optional(),
  colorVariants: z.array(ColorVariantSchema).optional(),
  denormalized: DenormalizedFieldsSchema.partial().optional(),
});

export const BulkUpdateProductStatusSchema = z.object({
  productIds: z.array(z.string()).min(1),
  status: z.enum(["active", "draft", "archived"]),
});

// ============================================
// Delete Product Schema
// ============================================

export const DeleteProductSchema = z.object({
  productIds: z.union([
    z.string().min(1, "Product ID is required"),
    z.array(z.string().min(1, "Product ID is required")),
  ]),
});

export const VirtualStoreProductFiltersSchema = z.object({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    minFinalPrice: z.number().min(0).optional(),
    maxFinalPrice: z.number().min(0).optional(),
    minCommission: z.number().min(0).max(100).optional(),
    maxCommission: z.number().min(0).max(100).optional(),
    featured: z.boolean().optional(),
    tags: z.array(z.string()).optional()
});
// ============================================
// Color Variant Schemas
// ============================================

export const CreateColorVariantData = z.object({
  productId: z.string().min(1, "Product ID is required"),
  colorName: z.string().min(1, "Color name is required"),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color code"),
  images: z.array(z.instanceof(File)).min(1, "At least one image required"),
  additionalPrice: z.number().min(0).optional(),
  isDefault: z.boolean().optional(),
});

export const UpdateColorVariantData = z.object({
  colorName: z.string().min(1).optional(),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  newImages: z.array(z.instanceof(File)).optional(),
  removeImageIds: z.array(z.string()).optional(),
  additionalPrice: z.number().min(0).optional(),
  isDefault: z.boolean().optional(),
});

export const ColorVariantUpdateSchema = z.object({
  colorName: z.string().min(1).optional(),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  additionalPrice: z.number().min(0).optional(),
  isDefault: z.boolean().optional(),
  images: z.array(z.string()).optional(), // URLs
});

export const SaveItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export const RemoveSavedItemSchema = z.object({
  savedItemId: z.string().min(1, "Saved item ID is required"),
});

// ============================================
// Type Exports
// ============================================

export type CreateProductSchema = z.infer<typeof CreateProductSchema>;
export type UpdateProductSchema = z.infer<typeof UpdateProductSchema>;
export type DeleteProductSchema = z.infer<typeof DeleteProductSchema>;
export type VariantSchema = z.infer<typeof VariantSchema>;
export type VariantValueSchema = z.infer<typeof VariantValueSchema>;
export type ProductCombinationSchema = z.infer<typeof ProductCombinationSchema>;
export interface UpdateCombinationData extends Partial<Omit<ProductCombinationSchema, "$id">> {}
export type ColorVariantSchema = z.infer<typeof ColorVariantSchema>;
export type CreateColorVariantData = z.infer<typeof CreateColorVariantData>;
export type UpdateColorVariantData = z.infer<typeof UpdateColorVariantData>;
export type ColorVariantUpdateSchema = z.infer<typeof ColorVariantUpdateSchema>;
export type VirtualStoreProductFilters = z.infer<typeof ColorVariantUpdateSchema>;
export type CreateAffiliateImportSchema = z.infer<typeof CreateAffiliateImportSchema>;

// Step schemas
export type BasicInfoStepSchema = z.infer<typeof BasicInfoStepSchema>;
export type CategoryStepSchema = z.infer<typeof CategoryStepSchema>;
export type VariantsStepSchema = z.infer<typeof VariantsStepSchema>;
export type ImagesStepSchema = z.infer<typeof ImagesStepSchema>;
