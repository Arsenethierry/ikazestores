import { z } from "zod";
import { CardProvider, OnlinePaymentProvider, PaymentMethodType } from "../constants";
// import { VariantCombinationSchema } from "./product-variants-schema";
import { ColorVariantSchema, VariantCombinationSchema } from "./product-variants-schema";

export const FormVariantValueSchema = z.object({
    id: z.string(),
    value: z.string(),
    label: z.string(),
    additionalPrice: z.number().default(0),
    isDefault: z.boolean().default(false),
    images: z.array(z.string()).default([])
});

export const FormProductVariantSchema = z.object({
    templateId: z.string(),
    name: z.string(),
    type: z.enum(['boolean', 'color', 'text', 'select', 'range', 'number', 'multiselect']),
    values: z.array(FormVariantValueSchema),
    required: z.boolean().default(false)
});

export const ProductCombinationSchema = z.object({
    variantStrings: z.array(z.string()).optional(),
    sku: z.string().min(1, "SKU is required"),
    basePrice: z.number().min(0, "Price must be positive"),
    stockQuantity: z.number().min(1).optional(),
    isActive: z.boolean().default(true),
    weight: z.number().min(0).optional(),
    isDefault: z.boolean().default(false),
    dimensions: z.string().optional(),
    images: z.array(z.instanceof(File)).optional(),
    variantValues: z.record(z.string(), z.any()).optional(),
    colorVariantId: z.string().optional()
});

export const VariantOptionSchema = z.object({
    value: z.string(),
    label: z.string(),
    additionalPrice: z.number().optional().default(0),
    colorCode: z.string().optional(),
    metadata: z.object({
        count: z.number()
    }).optional().default({ count: 0 })
});

export const ProductVariantSchema = z.object({
    templateId: z.string(),
    name: z.string(),
    type: z.enum(['boolean', 'color', 'text', 'select', 'range', 'number', 'multiselect']),
    values: z.array(VariantOptionSchema),
    required: z.boolean().default(false),
    sortOrder: z.number().optional().default(0)
});

export const ColorVariantUpdateSchema = ColorVariantSchema.partial().extend({
    newImages: z.array(z.instanceof(File)).optional(),
    removeImageIds: z.array(z.string())
})

const BaseCreateProductSchema = z.object({
    physicalStoreId: z.string().min(1, "Physical store ID is required"),
    name: z.string().min(1, "Product name is required").max(2200, "Name too long"),
    description: z.string().min(1, "Description is required").max(10000, "Description too long"),
    shortDescription: z.string().max(500, "Short description too long").optional(),
    sku: z.string().min(1, "SKU is required").max(50, "SKU too long"),
    basePrice: z.number().min(0, "Price must be positive"),
    currency: z.string().min(1, "Currency is required").max(20, "Currency code too long"),
    status: z.enum(["active", "draft", "archived"]).default("active"),
    featured: z.boolean().default(false),

    categoryId: z.string().min(1, "Category is required"),
    subcategoryId: z.string().min(1, "Subcategory is required"),
    productTypeId: z.string().min(1, "Product type is required"),
    tags: z.array(z.string()).optional(),

    images: z.array(z.instanceof(File)).min(1, "At least one product image is required"),

    storeLatitude: z.number(),
    storeLongitude: z.number(),
    storeCountry: z.string().min(1, "Store country is required"),

    enableColors: z.boolean().default(false),
    hasVariants: z.boolean().default(false),
    isDropshippingEnabled: z.boolean().default(true),

    colorVariants: z.array(ColorVariantSchema).optional().refine((colors) => {
        if (!colors || colors.length === 0) return true;

        // Ensure at least one default color if colors exist
        const hasDefault = colors.some(color => color.isDefault);
        return hasDefault;
    }, {
        message: "At least one color must be set as default when colors are enabled"
    }),

    variants: z.array(ProductVariantSchema).optional(),

    productCombinations: z.array(ProductCombinationSchema).optional(),

    hasColorVariants: z.boolean().optional()
});

export const CreateProductSchema = BaseCreateProductSchema
    .refine((data) => {
        if (data.enableColors && (!data.colorVariants || data.colorVariants.length === 0)) {
            return false;
        }
        return true;
    }, {
        message: "At least one color variant is required when colors are enabled",
        path: ["colorVariants"]
    })
    .refine((data) => {
        if (data.hasVariants && (!data.variants || data.variants.length === 0)) {
            return false;
        }
        if (data.hasVariants && data.variants) {
            const hasVariantWithValues = data.variants.some(variant =>
                variant.values && variant.values.length > 0
            );
            return hasVariantWithValues;
        }
        return true;
    }, {
        message: "At least one variant with options is required when variants are enabled",
        path: ["variants"]
    })
    .refine((data) => {
        if (data.colorVariants && data.colorVariants.length > 1) {
            const colorNames = data.colorVariants.map(c => c.colorName.toLowerCase());
            const uniqueNames = new Set(colorNames);
            return uniqueNames.size === colorNames.length;
        }
        return true;
    }, {
        message: "Color names must be unique",
        path: ["colorVariants"]
    })
    .refine((data) => {
        if (data.productCombinations && data.productCombinations.length > 1) {
            const skus = data.productCombinations.map(c => c.sku);
            const uniqueSkus = new Set(skus);
            return uniqueSkus.size === skus.length;
        }
        return true;
    }, {
        message: "Product combination SKUs must be unique",
        path: ["productCombinations"]
    });

export const UpdateProductSchema = BaseCreateProductSchema.omit({
    physicalStoreId: true,
    storeLatitude: true,
    storeLongitude: true,
    storeCountry: true
}).partial();

export const CreateAffiliateImportSchema = z.object({
    virtualStoreId: z.string().min(1, "Virtual store ID is required"),
    productId: z.string().min(1, "Product ID is required"),
    commission: z.number().min(0, "Commission must be greater than or equal to 0"),
    selectedCombinations: z.array(z.string()).optional().default([]), // Array of combination IDs to import
    customCombinationPricing: z.array(z.object({
        combinationId: z.string(),
        customCommission: z.number().min(0, "Custom commission must be ≥ 0"),
    })).optional()
});

export const UpdateAffiliateImportSchema = z.object({
    commission: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
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

export const ProductFiltersSchema = z.object({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    physicalStoreId: z.string().optional(),
    status: z.enum(["active", "draft", "archived", "all"]).optional(),
    featured: z.boolean().optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
    dropshippingOnly: z.boolean().optional(),
    hasVariants: z.boolean().optional(),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        radius: z.number().min(0)
    }).optional()
});
export interface CreateColorVariantData extends z.infer<typeof ColorVariantSchema> {
    productId: string;
}
export type UpdateColorVariantData = z.infer<typeof ColorVariantUpdateSchema>;
export type CreateProductSchema = z.infer<typeof CreateProductSchema>;
export type UpdateProductSchema = z.infer<typeof UpdateProductSchema>;
export type ProductCombinationSchema = z.infer<typeof ProductCombinationSchema>;
export type ProductVariantSchema = z.infer<typeof ProductVariantSchema>;
export type VariantOptionSchema = z.infer<typeof VariantOptionSchema>;
export type CreateAffiliateImportSchema = z.infer<typeof CreateAffiliateImportSchema>;
export type UpdateAffiliateImportSchema = z.infer<typeof UpdateAffiliateImportSchema>;
export type VirtualStoreProductFilters = z.infer<typeof VirtualStoreProductFiltersSchema>;
export type ProductFilters = z.infer<typeof ProductFiltersSchema>;

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

export const VirtualProductSchema = z.object({
    originalProductId: z.string(),
    shortDescription: z.string(),
    purchasePrice: z.coerce
        .number({ invalid_type_error: "Price must be a number" })
        .positive({ message: "Price must be a positive number" }),
    sellingPrice: z.coerce
        .number({ invalid_type_error: "Price must be a number" })
        .positive({ message: "Price must be a positive number" }),
    storeId: z.string(),
    description: z.string().min(1, "Description is required"),
    title: z.string().min(1, "Title is required"),
    generalImageUrls: z.array(z.string()).default([]),
    createdBy: z.string(),
    currency: z.string(),
    commission: z.number().min(0, "Commission must be greater than or equal to 0"),
    combinationPrices: z.array(z.object({
        combinationId: z.string(),
        basePrice: z.number(),
        commission: z.number().min(0, "Commission must be ≥ 0"),
        finalPrice: z.number()
    })).default([])
})

export const deleteVirtualProductSchema = z.object({
    productId: z.string(),
    virtualStoreId: z.string(),
})

export const OrderFormSchema = z.object({
    deliveryAddress: z.object({
        $id: z.string().nullable(),
        fullName: z.string().min(2, { message: "Full name is required" }).max(100, { message: "Full name must be at most 100 characters" }),
        phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, { message: "Please enter a valid phone number" }).min(10),
        street: z.string().min(3, { message: "Street must be at least 3 characters" }).max(50, { message: "Street must be at most 50 characters" }).optional(),
        city: z.string().min(3, { message: "City must be at least 3 characters" }).max(50, { message: "City must be at most 50 characters" }).optional(),
        zip: z.string().optional(),
        state: z.string().min(2).max(50).optional(),
        country: z.string().min(2).max(50).optional(),
    }),
    notes: z.string().max(255).optional(),
    customerCurrency: z.string(),
    preferredPaymentMethod: z.object({
        type: z.nativeEnum(PaymentMethodType),
        onlineProvider: z.nativeEnum(OnlinePaymentProvider).optional(),
        cardProvider: z.nativeEnum(CardProvider).optional(),
    }),
    orderDate: z.date().default(() => new Date()),
    isExpressDelivery: z.boolean().default(false), //allows customers to pay extra for faster shipping when they need their items more urgently
})

export const OrderSchema = OrderFormSchema.extend({
    totalAmount: z.number(),
    selectedItems: z.object({
        id: z.string(),
        productId: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        image: z.string(),
        productCurrency: z.string().optional(),
    }).array(),
    customerCurrency: z.string(),
    exchangeRatesSnapshot: z.record(z.string(), z.number()),
    exchangeRatesTimestamp: z.string(),
});

export const DeleteProductSchema = z.object({
    productIds: z.union([z.string(), z.array(z.string())]),
})

export const CategorySchema = z.object({
    storeId: z.string().nullable(),
    categoryName: z.string().min(1, "Category name is required"),
    subcategories: z.array(z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string().optional(),
    })).optional(),
    slug: z.string().min(1, "Slug is required"),
    icon: z.instanceof(File).optional(),
    createdBy: z.string(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().optional(),
    parentCategoryId: z.string().nullable()
});

export const UpdateCategoryForm = z.object({
    categoryId: z.string(),
    storeId: z.string().nullable(),
    categoryName: z.string().min(1, "Category name is required").optional(),
    subcategories: z.array(z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string().optional(),
    })).optional(),
    slug: z.string().min(1, "Slug is required").optional(),
    icon: z.instanceof(File).optional(),
    oldFileId: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
});

export const UpdateCategoryActionSchema = UpdateCategoryForm.extend({
    categoryId: z.string()
})

export const CategoryById = z.object({
    categoryId: z.string()
});

export const SubCategorySchema = z.object({
    parentCategoryIds: z.array(z.string()),
    subCategoryName: z.string().min(2, { message: "Sub category name is required" }).max(50, { message: "Sub category name must not exceed 50 characters long" }),
    icon: z.custom<File>()
        .refine(file => file instanceof File, {
            message: "Icon thumbnail is required"
        }),
    storeId: z.string().nullable(),
    createdBy: z.string()
});

export const UpdateSubCategoryForm = z.object({
    parentCategoryIds: z.array(z.string()).optional(),
    subCategoryName: z.string().max(50, { message: "sub category name must not exceed 50 characters long" }).optional(),
    icon: z.custom<File>().optional(),
    oldFileId: z.string().optional().nullable(),
    iconUrl: z.string().optional(),
});

export const UpdateSubCategoryActionSchema = UpdateSubCategoryForm.extend({
    subCategoryId: z.string()
});

const baseCollectionSchema = z.object({
    collectionName: z.string().min(2, {
        message: "Collection name must be at least 2 characters.",
    }),
    description: z.string().max(500, {
        message: "Description must not exceed 500 characters.",
    }).optional().nullable(),
    type: z.enum(["simple", "grouped"]),
    featured: z.boolean().default(false),
    bannerImage: z.union([z.string().url(), z.instanceof(File)]).optional(),
    storeId: z.string().nullable().optional(),
    createdBy: z.string(),

    heroTitle: z.string().max(60, "Title must be at most 60 characters").optional(),
    heroSubtitle: z.string().max(80, "Subtitle must be at most 80 characters").optional(),
    heroDescription: z.string().max(200, "Description must be at most 200 characters").optional(),
    heroButtonText: z.string().max(30, "Button text must be at most 30 characters").optional(),
    heroImage: z.union([z.string().url(), z.instanceof(File)]).optional(),
});

export const CollectionSchema = baseCollectionSchema.refine((data) => {
    if (data.featured) {
        return !!(
            data.heroTitle?.trim() &&
            data.heroSubtitle?.trim() &&
            data.heroDescription?.trim() &&
            data.heroButtonText?.trim() &&
            data.heroImage
        );
    }
    return true;
}, {
    message: "All hero carousel fields are required when collection is featured",
    path: ["featured"],
});

export const UpdateCollectionForm = baseCollectionSchema.partial().extend({
    collectionId: z.string(),
    oldBannerImageId: z.string().optional()
});

export const DeleteCollectionSchema = z.object({
    collectionId: z.string(),
    bannerImageId: z.string().optional().nullable()
})


export const CollectionGroupSchema = z.object({
    id: z.string(),
    groupName: z.string().min(1, "Group name is required"),
    groupImage: z.any().optional(),
    displayOrder: z.number()
});

export const SaveCollectionGroupsSchema = z.object({
    collectionId: z.string(),
    groups: z.array(CollectionGroupSchema)
});

export const DeleteCollectionGroupSchema = z.object({
    groupId: z.string(),
    collectionId: z.string(),
    imageId: z.string().nullable(),
});

export const UpdateCollectionGroupSchema = z.object({
    groupId: z.string(),
    collectionId: z.string(),
    groupName: z.string().min(1, "Group name is required"),
    groupImage: z.any().optional(),
    displayOrder: z.number(),
    oldImageId: z.string().optional()
});

export const AddProductToCollectionSchema = z.object({
    collectionId: z.string(),
    productsIds: z.array(z.string()),
    groupId: z.string().optional().nullable()
});

export const RemoveProductFromCollection = z.object({
    collectionId: z.string(),
    productId: z.string(),
    groupId: z.string().optional()
});

export const CreateCollectionGroup = z.object({
    collectionId: z.string(),
    groupName: z.string().min(1, "Group name is required"),
    groupImageUrl: z.string().optional(),
    displayOrder: z.number().optional()
});

export const SaveItemSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
});

export const RemoveSavedItemSchema = z.object({
    savedItemId: z.string().min(1, "Saved item ID is required"),
});

export const GetProductsWithVirtualSchema = z.object({
    storeId: z.string().optional(),
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    productTypeId: z.string().optional(),
    status: z.string().optional(),
    featured: z.boolean().optional(),
    search: z.string().optional(),
    tags: z.array(z.string()).optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    sortBy: z.enum(['name', 'price', 'created', 'updated']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    userLat: z.number().optional(),
    userLng: z.number().optional(),
    radiusKm: z.number().optional(),
    combinations: VariantCombinationSchema.optional()
})

export type CreateCollectionSchemaType = z.infer<typeof CollectionSchema>
export type UpdateCollectionSchemaType = z.infer<typeof UpdateCollectionForm>
export type SaveCollectionGroupsTypes = z.infer<typeof SaveCollectionGroupsSchema>