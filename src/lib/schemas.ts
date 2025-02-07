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
    storeBanner: z.custom<File[]>().optional(),
    storeLogo: z.custom<File[]>().optional()
});