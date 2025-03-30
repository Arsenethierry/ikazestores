import { z } from "zod";
import { CardProvider, OnlinePaymentProvider, PaymentMethodType, UserRole } from "./constants";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Required"),
});

export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, { message: 'Password must be at least 8 characters' }).max(265, { message: "Password must be less than 265 characters" }),
    confirmPassword: z
        .string()
        .min(1, { message: 'Please confirm your password' }),
    fullName: z.string().min(1, "Required"),
    phoneNumber: z.string().min(10),
    role: z.nativeEnum(UserRole),
}).superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Password does not match with confirmed password",
            path: ['confirmPassword']
        })
    }
})

export const verifyEmilSchema = z.object({
    secret: z.string().min(1, "Required"),
    userId: z.string().min(1, "Required"),
});

export const InitiatePasswordRecoverySchema = z.object({
    email: z.string().email(),
});

export const CompletePasswordRecoverySchema = z.object({
    secret: z.string(),
    userId: z.string(),
    newPassword: z.string()
});

export const createPhysicalStoreFormSchema = z.object({
    storeName: z.string().min(1).max(255),
    description: z.string().max(255).optional(),
    storeBio: z.string().max(255).optional(),
    storeLogo: z.custom<File>(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().max(500).optional(),
    country: z.string().min(1)
});

export const createVirtualStoreFormSchema = z.object({
    storeName: z.string().min(1).max(500),
    desccription: z.string().max(255).optional(),
    storeBio: z.string().max(255).optional(),
    storeDomain: z.string().min(2).max(50),
    storeBanner: z.custom<File[]>(),
    storeLogo: z.custom<File>(),
    operatingCountries: z.array(z.object({
        value: z.string(),
        label: z.string()
    })).min(1, { message: "Select at least one operating country" })
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
    oldFileId: z.string().optional().nullable(),
});

export const UpdatePhysicalStoreFormSchema = z.object({
    storeId: z.string().min(1),
    storeName: z.string().min(1).max(255).optional(),
    desccription: z.string().max(500).optional(),
    storeBio: z.string().max(255).optional(),
    storeLogo: z.custom<File[]>().optional(),
    storeLogoUrl: z.string().optional(),
    storeLogoId: z.string().optional(),
    oldFileId: z.string().optional().nullable(),
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