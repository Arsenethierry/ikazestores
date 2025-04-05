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
    storeOriginCountry: z.string()
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
    imageUrls: z.string().array(),
    createdBy: z.string(),
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
    categoryName: z.string().min(2, { message: "Category name is required" }).max(20, { message: "Category name must not exceed 20 characters long" }),
    icon: z.custom<File>()
        .refine(file => file instanceof File, {
            message: "Icon thumbnail is required"
        }),
});

export const CategoryById = z.object({
    categoryId: z.string()
})