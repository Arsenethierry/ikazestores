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
  operatingCountry: z.string().min(1, "Operating country is required"),
  countryCurrency: z.string(),
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
  operatingCountry: z.string().optional(),
  countryCurrency: z.string().optional(),
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

export const createStoreSubscriberSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Valid email is required"),
  subscribedAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  preferences: z
    .object({
      marketing: z.boolean().default(true),
      orderUpdates: z.boolean().default(true),
      newProducts: z.boolean().default(true),
      promotions: z.boolean().default(true),
    })
    .optional(),
});

export const updateStoreSubscriberSchema = z.object({
  isActive: z.boolean().optional(),
  preferences: z
    .object({
      marketing: z.boolean().optional(),
      orderUpdates: z.boolean().optional(),
      newProducts: z.boolean().optional(),
      promotions: z.boolean().optional(),
    })
    .optional(),
});

export const storeReviewSchema = z.object({
  overallRating: z.number().min(1, "Please select a rating").max(5),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100)
    .optional(),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(2200)
    .optional(),
  customerServiceRating: z.number().min(1).max(5).optional(),
});

export const UpdateStoreReviewSchema = z.object({
  reviewId: z.string().min(1),
  overallRating: z.number().min(1).max(5).optional(),
  title: z.string().min(3).max(100).optional(),
  comment: z.string().min(10).max(2200).optional(),
  customerServiceRating: z.number().min(1).max(5).optional(),
});

export const AddReviewReplySchema = z.object({
  reviewId: z.string().min(1),
  comment: z.string().min(1).max(1000),
  userType: z.enum(["store_owner", "customer"]),
});

export const VoteOnReviewSchema = z.object({
  reviewId: z.string().min(1),
  voteType: z.enum(["helpful", "unhelpful"]),
});

export const createStoreReviewSchema = storeReviewSchema.extend({
  virtualStoreId: z.string(),
});

export type CreateStoreReviewData = z.infer<typeof createStoreReviewSchema>;
export type UpdateStoreReviewData = z.infer<typeof UpdateStoreReviewSchema>;

export type CreateStoreSubscriberInput = z.infer<
  typeof createStoreSubscriberSchema
>;
export type UpdateStoreSubscriberInput = z.infer<
  typeof updateStoreSubscriberSchema
>;
