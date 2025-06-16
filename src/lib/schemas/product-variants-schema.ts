import { z } from "zod";

export enum VariantType {
    SELECT = 'select',
    BOOLEAN = 'boolean',
    TEXT = 'text',
    NUMBER = 'number',
    MULTISELECT = 'multiselect',
    COLOR = 'color',
    RANGE = 'range'
};

export const VariantOptionSchema = z.object({
    value: z.string().min(1, "Option value is required"),
    label: z.string().optional(),
    additionalPrice: z.number().default(0),
    hex: z.string().optional(), // For color variants
    image: z.instanceof(File).optional(),
    sortOrder: z.number().default(0),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true)
});

export const VariantTemplateSchema = z.object({
    name: z.string().min(1, "Template name is required"),
    description: z.string().optional(),
    type: z.nativeEnum(VariantType),
    isRequired: z.boolean().default(false),
    categoryIds: z.array(z.string()).optional(),
    productTypeId: z.string().optional(),
    options: z.array(VariantOptionSchema).optional(),
    defaultValue: z.string().optional(),
    storeId: z.string().nullable().optional(),
    createdBy: z.string(),
    isActive: z.boolean().default(true),
    minSelections: z.number().min(0).default(0),
    maxSelections: z.number().min(1).optional(),
    allowCustomValues: z.boolean().default(false),
});

export const ProductTypeSchema = z.object({
    name: z.string().min(1, "Product type name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    storeId: z.string().optional(),
    createdBy: z.string().min(1, "Created by is required"),
});

export const UpdateProductTypeSchema = z.object({
    productTypeId: z.string().min(1, "Product type ID is required"),
    name: z.string().min(2, { message: "Type name must be at least 2 characters" }).optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const ProductTypeByIdSchema = z.object({
    productTypeId: z.string().min(1, "Product type ID is required"),
});

export const DeleteProductTypeSchema = z.object({
    productTypeId: z.string().min(1, "Product type ID is required"),
});

export const ProductVariantInstanceSchema = z.object({
    productId: z.string(),
    variantTemplateId: z.string(),
    selectedOptions: z.array(z.string()),
    customValue: z.string().optional(),
    additionalPrice: z.number().default(0),
    sku: z.string().optional(),
    stock: z.number().default(0),
    images: z.array(z.string()).optional(),
    isEnabled: z.boolean().default(true),
});

export const VariantCombinationSchema = z.object({
    id: z.string(),
    variantValues: z.record(z.array(z.string())),
    basePrice: z.number(),
    finalPrice: z.number(),
    additionalPrices: z.record(z.number()).optional(),
    sku: z.string().optional(),
    inventoryQuantity: z.number().optional(),
    isActive: z.boolean().optional(),
    displayName: z.string().optional(),
    shortDescription: z.string().optional(),
    availability: z.enum(['in_stock', 'out_of_stock']).optional(),
});

export const ProductFilterSchema = z.object({
    storeId: z.string().optional(),
    categoryId: z.string().optional(),
    productTypeId: z.string().optional(),
    variants: z.array(z.object({
        templateId: z.string(),
        values: z.array(z.string()).optional(),
        range: z.object({
            min: z.number().optional(),
            max: z.number().optional()
        }).optional()
    })).optional(),
    priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional()
    }).optional(),
    inStock: z.boolean().optional(),
    featured: z.boolean().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'created_desc', 'created_asc']).optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
});

export const BulkVariantGenerationSchema = z.object({
    productId: z.string(),
    variantTemplates: z.array(z.object({
        templateId: z.string(),
        selectedOptions: z.array(z.string()),
    })),
    basePrice: z.number(),
    generateSKUs: z.boolean().default(true),
    skuPrefix: z.string().optional(),
});

export type VariantCombinationType = z.infer<typeof VariantCombinationSchema>