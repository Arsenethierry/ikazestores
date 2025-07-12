import { z } from "zod";

export const createPhysicalStoreFormSchema = z.object({
    storeName: z.string().min(1).max(255),
    description: z.string().max(255).optional(),
    storeBio: z.string().max(255).optional(),
    storeLogo: z.custom<File>(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().min(5, "Address must be at least 5 characters"),
    country: z.string().min(1, "Country is required"),
    currency: z.string()
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
    currency: z.string().optional()
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