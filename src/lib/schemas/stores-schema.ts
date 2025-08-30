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
  currency: z.string(),
});

export const updatePhysicalStoreFormSchema = z.object({
  storeId: z.string().min(1),
  storeName: z.string().min(1).max(255).optional(),
  description: z.string().max(255).optional(),
  storeBio: z.string().max(255).optional(),
  address: z.string().min(5).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  storeLogo: z.union([z.custom<File>(), z.string()]).optional(),
  storeLogoUrl: z.string().optional(),
  storeLogoId: z.string().optional(),
  oldFileId: z.string().optional().nullable(),
});

export const createVirtualStoreFormSchema = z.object({
  storeName: z.string().min(1).max(500),
  desccription: z.string().max(255).optional(),
  storeBio: z.string().max(255).optional(),
  storeDomain: z.string().min(2).max(50),
  storeBanner: z.custom<File[]>(),
  storeLogo: z.custom<File>(),
  operatingCountries: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .min(1, { message: "Select at least one operating country" }),
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
  storeLogo: z.union([z.custom<File>(), z.string()]).optional(),
  storeLogoUrl: z.string().optional(),
  storeLogoId: z.string().optional(),
  oldFileId: z.string().optional().nullable(),
  operatingCountries: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .min(1, { message: "Select at least one operating country" })
    .optional(),
});

export const CreateStoreReviewDataSchema = z.object({
  virtualStoreId: z.string().min(1, "Virtual Store ID is required"),
  overallRating: z.number().min(1).max(5),
  title: z.string().min(1, "Title is required"),
  comment: z.string().min(1, "Comment is required"),
  productQualityRating: z.number().min(1).max(5),
  customerServiceRating: z.number().min(1).max(5),
  shippingSpeedRating: z.number().min(1).max(5),
  valueForMoneyRating: z.number().min(1).max(5),
  orderId: z.string().optional(),
});
