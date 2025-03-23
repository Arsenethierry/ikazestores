import { z } from "zod";
import { CardProvider, OnlinePaymentProvider, PaymentMethodType } from "./constants";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Required"),
});

export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Required"),
    username: z.string().min(1, "Required"),
    phoneNumber: z.string().min(10)
});

export const createPhysicalStoreFormSchema = z.object({
    storeName: z.string().min(1).max(255),
    desccription: z.string().max(255).optional(),
    storeBio: z.string().max(255).optional(),
    storeBanner: z.custom<File[]>(),
    storeLogo: z.custom<File>()
});

export const createVirtualStoreFormSchema = z.object({
    storeName: z.string().min(1).max(500),
    desccription: z.string().max(255).optional(),
    storeBio: z.string().max(255).optional(),
    storeDomain: z.string().min(2).max(50),
    storeBanner: z.custom<File[]>(),
    storeLogo: z.custom<File>(),
});
export const updateVirtualStoreFormSchema = z.object({
    storeId: z.string().min(1),
    storeName: z.string().min(1).max(255).optional(),
    desccription: z.string().max(500).optional(),
    storeBio: z.string().max(255).optional(),
    storeDomain: z.string().min(2).max(50).optional(),
    storeBanner: z.custom<File[]>().optional(),
    bannerUrls: z.array(z.string()).optional(),
    bannerIds: z.array(z.string()).optional(),
    storeLogo: z.custom<File[]>().optional(),
    storeLogoUrl: z.string().optional(),
    storeLogoId: z.string().optional(),
    oldFileId: z.string().optional(),
});

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
    images: z.custom<File[]>(),
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

export const CreateOrderSchema = z.object({
    customerId: z.string(),
    orderDate: z.date(),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    totalAmount: z.number(),
    notes: z.string().optional()
})

export const AddToCartSchema = z.object({
    $id: z.string(),
    title: z.string(),
    sellingPrice: z.number(),
    imageUrl: z.string(),
    quantity: z.number().default(1),
});

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