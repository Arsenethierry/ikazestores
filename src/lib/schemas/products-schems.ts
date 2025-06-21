import { z } from "zod";
import { CardProvider, OnlinePaymentProvider, PaymentMethodType } from "../constants";
// import { VariantCombinationSchema } from "./product-variants-schema";
// import { ProductVariantInstanceSchema, VariantCombinationSchema } from "./product-variants-schema";

export const productFormSchema = z.object({
    // Basic Information
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    shortDescription: z.string().optional(),
    sku: z.string().min(1, 'SKU is required'),
    basePrice: z.number().min(0, 'Price must be positive'),
    // quantity: z.number().min(0, 'Quantity must be 0 or greater'),

    // Category & Type
    categoryId: z.string().min(1, 'Category is required'),
    subcategoryId: z.string().min(1, 'Subcategory is required'),
    productTypeId: z.string().min(1, 'Product type is required'),

    // Pricing & Inventory
    // compareAtPrice: z.number().optional().nullable(),
    // costPerItem: z.number().optional(),
    // trackQuantity: z.boolean().default(true),
    // lowStockThreshold: z.number().min(0).optional(),

    // Physical Properties
    // weight: z.number().optional(),
    // dimensions: z.object({
    //     length: z.number().optional(),
    //     width: z.number().optional(),
    //     height: z.number().optional(),
    //     unit: z.string().default('cm')
    // }).optional(),

    // Product Status
    status: z.enum(['active', 'draft', 'archived']).default('active'),
    featured: z.boolean().default(false),

    // SEO
    // seoTitle: z.string().optional(),
    // seoDescription: z.string().optional(),

    // Variants
    hasVariants: z.boolean().default(false),
    variants: z.array(z.object({
        templateId: z.string(),
        name: z.string(),
        type: z.enum(['text', 'color', 'select', 'boolean', 'multiselect']),
        values: z.array(z.object({
            value: z.string(),
            label: z.string().optional(),
            colorCode: z.string().optional(),
            additionalPrice: z.number().optional(),
            isDefault: z.boolean().default(false)
        })),
        required: z.boolean().default(false)
    })).optional(),

    // Product Combinations with variant strings
    productCombinations: z.array(z.object({
        id: z.string(),
        variantValues: z.record(z.string()),
        sku: z.string(),
        price: z.number(),
        quantity: z.number().optional(),
        weight: z.number().optional(),
        barcode: z.string().optional(),
        images: z.array(z.any()).optional(),
        isDefault: z.boolean().default(false),
        // Simple variant strings for filtering - this is what we want!
        variantStrings: z.array(z.string()).optional()
    })).optional(),

    // Images
    images: z.array(z.any()).min(1, 'At least one image is required'),

    // Tags
    tags: z.array(z.string()).default([]),

    // Additional Properties
    brand: z.string().optional(),
    model: z.string().optional(),
});

export const ProductSchemaProps = productFormSchema.extend({
    storeId: z.string(),
    storeLat: z.number().optional(),
    storeLong: z.number().optional(),
    storeOriginCountry: z.string(),
    minOrderQuantity: z.number().default(1)
});

export const UpdateProductSchemaProps = ProductSchemaProps.merge(
    z.object({
        productId: z.string()
    })
)

export const VirtualProductSchema = z.object({
    originalProductId: z.string(),
    purchasePrice: z.coerce
        .number({ invalid_type_error: "Price must be a number" })
        .positive({ message: "Price must be a positive number" }),
    sellingPrice: z.coerce
        .number({ invalid_type_error: "Price must be a number" })
        .positive({ message: "Price must be a positive number" }),
    storeId: z.string(),
    description: z.string(),
    title: z.string(),
    generalImageUrls: z.string().array(),
    createdBy: z.string(),
    currency: z.string()
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
        image: z.string()
    }).array(),
});

export const DeleteProductSchema = z.object({
    productIds: z.union([z.string(), z.array(z.string())]),
})

export const CategorySchema = z.object({
    categoryName: z.string().min(2, { message: "Category name is required" }).max(50, { message: "Category name must not exceed 20 characters long" }),
    icon: z.custom<File>()
        .refine(file => file instanceof File, {
            message: "Icon thumbnail is required"
        }),
    storeId: z.string().nullable(),
    createdBy: z.string(),
    slug: z.string().max(50, { message: "Slug must not exceed 50 characters" }),
    parentCategoryId: z.string().nullable().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0)
});

export const UpdateCategoryForm = z.object({
    categoryName: z.string().max(50, { message: "Category name must not exceed 20 characters long" }).optional(),
    icon: z.custom<File>().optional(),
    oldFileId: z.string().optional().nullable(),
    iconUrl: z.string().optional(),
    slug: z.string().optional()
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

export const CollectionSchema = z.object({
    collectionName: z.string().min(2, {
        message: "Collection name must be at least 2 characters."
    }),
    description: z.string().max(500, {
        message: "Collection name must not exceed 500 characters."
    }).nullable(),
    type: z.enum(["simple", "grouped"]),
    featured: z.boolean().default(false),
    bannerImage: z.any().optional(),
    storeId: z.string().nullable().optional(),
    createdBy: z.string()
});

export const DeleteCollectionSchema = z.object({
    collectionId: z.string(),
    bannerImageId: z.string().optional().nullable()
})

export const UpdateCollectionForm = z.object({
    collectionName: z.string().min(2, {
        message: "Collection name must be at least 2 characters."
    }).optional(),
    description: z.string().optional(),
    type: z.enum(["simple", "grouped"]).optional(),
    featured: z.boolean().optional(),
    bannerImage: z.any().optional(),
    collectionId: z.string().optional()
});

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