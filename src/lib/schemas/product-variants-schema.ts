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

export enum VariantScope {
    SYSTEM = 'system',
    STORE = 'store',
    PRODUCT = 'product'
}

export const VariantOptionSchema = z.object({
    value: z.string().min(1, "Value is required"),
    label: z.string().optional(),
    additionalPrice: z.number().default(0),
    sortOrder: z.number().optional(),
    image: z.any().optional(),
    metadata: z.record(z.any()).optional(),
});

export const VariantTemplateSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    type: z.nativeEnum(VariantType),
    isRequired: z.boolean().default(false),
    defaultValue: z.string().optional(),
    priceModifier: z.number().optional(),
    productType: z.string(),
    options: z.array(VariantOptionSchema).optional(),
    storeId: z.string().nullable(),
    createdBy: z.string(),
    scope: z.nativeEnum(VariantScope).default(VariantScope.STORE),
    isFilterable: z.boolean().default(true),
    filterOrder: z.number().optional(),
    filterGroup: z.string().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    step: z.number().optional(),
});

export const ProductTypeSchema = z.object({
    name: z.string().min(2, { message: "Type name must be at least 2 characters" }),
    description: z.string().optional(),
    storeId: z.string().nullable(),
    createdBy: z.string(),
    defaultVariantTemplates: z.array(z.string()).optional(),
    categoryId: z.string().min(1, "Category is required"),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
});

export const UpdateProductTypeSchema = z.object({
    productTypeId: z.string(),
    name: z.string().min(2, { message: "Type name must be at least 2 characters" }).optional(),
    description: z.string().optional(),
    defaultVariantTemplates: z.array(z.string()).optional(),
});

export const VariantGroupSchema = z.object({
    name: z.string().min(2, { message: "Group name must be at least 2 characters" }),
    description: z.string().optional(),
    productType: z.string().optional(),
    variants: z.array(z.string()),
    createdBy: z.string(),
    storeId: z.string().nullable(),
});

export const ProductVariantSchema = z.object({
    productId: z.string(),
    variantTemplateId: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    additionalPrice: z.coerce.number().default(0),
    sku: z.string().optional(),
    stock: z.coerce.number().default(0),
    images: z.array(z.any()).optional(),
    isEnabled: z.boolean().default(true),
});

export const VariantCombinationSchema = z.object({
    productId: z.string(),
    sku: z.string().optional(),
    variantValues: z.array(
        z.object({
            variantTemplateId: z.string(),
            value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
        })
    ),
    price: z.coerce.number(),
    compareAtPrice: z.coerce.number().optional(),
    stock: z.coerce.number().default(0),
    images: z.array(z.string()).optional(),
    active: z.boolean().default(true),
});

export const GenerateCombinationsSchema = z.object({
    productId: z.string(),
    variants: z.array(z.object({
        variantId: z.string(),
        options: z.array(z.object({
            optionId: z.string(),
            value: z.string(),
            additionalPrice: z.number().optional()
        }))
    }))
});

export const FilterQuerySchema = z.object({
    storeId: z.string().optional(),
    productType: z.string().optional(),
    category: z.string().optional(),
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
    sortBy: z.string().optional(),
    page: z.number().default(1),
    limit: z.number().default(20)
});