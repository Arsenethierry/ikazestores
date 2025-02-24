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
    storeName: z.string().min(1).max(255),
    desccription: z.string().max(255).optional(),
    storeBio: z.string().max(255).optional(),
    storeDomain: z.string().min(2).max(50),
    storeBanner: z.custom<File[]>(),
    storeLogo: z.custom<File>()
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