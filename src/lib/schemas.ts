import { z } from "zod";

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
    initialStoreBannerUrls: z.array(z.string()).optional(),
});
export const updateVirtualStoreFormSchema = z.object({
    storeId: z.string().min(1),
    storeName: z.string().min(1).max(255).optional(),
    desccription: z.string().max(500).optional(),
    storeBio: z.string().max(255).optional(),
    storeDomain: z.string().min(2).max(50).optional(),
    storeBanner: z.custom<File[]>().optional(),
    storeLogo: z.custom<File>().optional()
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