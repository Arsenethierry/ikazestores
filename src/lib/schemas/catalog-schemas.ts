import z from "zod";

export const CatalogCategorySchema = z.object({
  categoryName: z.string().min(1).max(50),
  slug: z.string().min(1).max(50),
  description: z.string().optional(),
  icon: z.instanceof(File).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateCatalogCategorySchema = z.object({
  $id: z.string(),
  categoryName: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon: z.instanceof(File).optional(),
  oldFileId: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const CatalogSubcategorySchema = z.object({
  subCategoryName: z.string().min(1).max(50),
  categoryId: z.string().min(1),
  slug: z.string().min(1).max(50),
  description: z.string().optional(),
  icon: z.instanceof(File).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateCatalogSubcategorySchema = z.object({
  subcategoryId: z.string(),
  $id: z.string(),
  subCategoryName: z.string().min(1).max(200).optional(),
  categoryId: z.string().min(1).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon: z.instanceof(File).optional(),
  oldFileId: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const CatalogProductTypeSchema = z.object({
  productTypeName: z.string().min(1).max(200),
  subcategoryId: z.string().min(1),
  categoryId: z.string().min(1),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateCatalogProductTypeSchema = z.object({
  productTypeId: z.string(),
  $id: z.string(),
  productTypeName: z.string().min(1).max(200).optional(),
  subcategoryId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const CatalogVariantTemplateSchema = z.object({
  variantTemplateName: z.string().min(1).max(200),
  description: z.string().optional(),
  inputType: z.enum([
    "text",
    "color",
    "range",
    "number",
    "select",
    "multiselect",
    "boolean",
  ]),
  isRequired: z.boolean().default(false),
  categoryIds: z.array(z.string()).optional(),
  subcategoryIds: z.array(z.string()).optional(),
  productTypeIds: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const CatalogVariantOptionSchema = z.object({
  variantTemplateId: z.string().min(1),
  value: z.string().min(1).max(200),
  label: z.string().min(1).max(200),
  colorCode: z.string().optional(),
  additionalPrice: z.number().default(0),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const AssignVariantToProductTypeSchema = z.object({
  productTypeId: z.string().min(1),
  variantTemplateId: z.string().min(1),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const UpdateCatalogVariantTemplateSchema = z.object({
  templateId: z.string(),
  variantTemplateName: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  inputType: z
    .enum([
      "text",
      "color",
      "range",
      "number",
      "select",
      "multiselect",
      "boolean",
    ])
    .optional(),
  isRequired: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
  subcategoryIds: z.array(z.string()).optional(),
  productTypeIds: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateCatalogVariantOption = z.object({
  optionId: z.string(),
  variantTemplateId: z.string().optional(),
  value: z.string().min(1).max(200).optional(),
  label: z.string().min(1).max(200).optional(),
  colorCode: z.string().optional(),
  additionalPrice: z.number().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
