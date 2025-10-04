import z from "zod";

const baseCollectionSchema = z.object({
  collectionName: z.string().min(2, {
    message: "Collection name must be at least 2 characters.",
  }),
  description: z
    .string()
    .max(500, {
      message: "Description must not exceed 500 characters.",
    })
    .optional()
    .nullable(),
  type: z.enum(["simple", "grouped"]),
  featured: z.boolean().default(false),
  bannerImage: z.union([z.string().url(), z.instanceof(File)]).optional(),
  storeId: z.string().nullable().optional(),
  createdBy: z.string(),

  heroTitle: z
    .string()
    .max(60, "Title must be at most 60 characters")
    .optional(),
  heroSubtitle: z
    .string()
    .max(80, "Subtitle must be at most 80 characters")
    .optional(),
  heroDescription: z
    .string()
    .max(200, "Description must be at most 200 characters")
    .optional(),
  heroButtonText: z
    .string()
    .max(30, "Button text must be at most 30 characters")
    .optional(),
  heroImage: z.union([z.string().url(), z.instanceof(File)]).optional(),
});

export const CollectionSchema = baseCollectionSchema.refine(
  (data) => {
    if (data.featured) {
      return !!(
        data.heroTitle?.trim() &&
        data.heroSubtitle?.trim() &&
        data.heroDescription?.trim() &&
        data.heroButtonText?.trim() &&
        data.heroImage
      );
    }
    return true;
  },
  {
    message:
      "All hero carousel fields are required when collection is featured",
    path: ["featured"],
  }
);

export const UpdateCollectionForm = baseCollectionSchema.partial().extend({
  collectionId: z.string(),
  oldBannerImageId: z.string().optional(),
});

export const DeleteCollectionSchema = z.object({
  collectionId: z.string(),
  bannerImageId: z.string().optional().nullable(),
});

export const CollectionGroupSchema = z.object({
  id: z.string(),
  groupName: z.string().min(1, "Group name is required"),
  groupImage: z.any().optional(),
  displayOrder: z.number(),
});

export const SaveCollectionGroupsSchema = z.object({
  collectionId: z.string(),
  groups: z.array(CollectionGroupSchema),
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
  oldImageId: z.string().optional(),
});

export const AddProductToCollectionSchema = z.object({
  collectionId: z.string(),
  productsIds: z.array(z.string()),
  groupId: z.string().optional().nullable(),
});

export const RemoveProductFromCollection = z.object({
  collectionId: z.string(),
  productId: z.string(),
  groupId: z.string().optional(),
});

export const CreateCollectionGroup = z.object({
  collectionId: z.string(),
  groupName: z.string().min(1, "Group name is required"),
  groupImageUrl: z.string().optional(),
  displayOrder: z.number().optional(),
});

export type UpdateCollectionSchemaType = z.infer<typeof UpdateCollectionForm>;
export type CreateCollectionSchemaType = z.infer<typeof CollectionSchema>;
export type SaveCollectionGroupsTypes = z.infer<
  typeof SaveCollectionGroupsSchema
>;
