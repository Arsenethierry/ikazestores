import { z } from "zod";
import { CardProvider, OnlinePaymentProvider, PaymentMethodType } from "../constants";

export const ProductSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(5, {
        message: "Title must be at least 5 characters long",
    }),
    description: z.string().min(40, {
        message: "Description must be at least 40 characters long",
    }),
    price: z.coerce
        .number({ invalid_type_error: "Price must be a number" })
        .positive({ message: "Price must be a positive number" }),
    storeId: z.string(),
    images: z.array(z.any())
        .refine(files => files.length > 0, {
            message: "At least 1 image is required"
        }),
    storeLat: z.number().optional(),
    storeLong: z.number().optional(),
    storeOriginCountry: z.string(),
    categoryId: z.string().min(1, { message: "Category is required" }),
    subcategoryIds: z.array(z.string()).optional(),
    colorImages: z.array(z.object({
        colorHex: z.string(),
        images: z.array(z.any()),
        colorName: z.string()
    }))
})

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
    productId: z.string()
})

export const CategorySchema = z.object({
    categoryName: z.string().min(2, { message: "Category name is required" }).max(50, { message: "Category name must not exceed 20 characters long" }),
    icon: z.custom<File>()
        .refine(file => file instanceof File, {
            message: "Icon thumbnail is required"
        }),
    storeId: z.string().nullable(),
    createdBy: z.string()
});


export const UpdateCategoryForm = z.object({
    categoryName: z.string().max(50, { message: "Category name must not exceed 20 characters long" }).optional(),
    icon: z.custom<File>().optional(),
    oldFileId: z.string().optional().nullable(),
    iconUrl: z.string().optional(),
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