"use server";

import { createSafeActionClient } from "next-safe-action";
import { authMiddleware } from "./middlewares";
import {
  AssignVariantToProductTypeSchema,
  CatalogCategorySchema,
  CatalogProductTypeSchema,
  CatalogSubcategorySchema,
  CatalogVariantOptionSchema,
  CatalogVariantTemplateSchema,
  UpdateCatalogCategorySchema,
  UpdateCatalogProductTypeSchema,
  UpdateCatalogSubcategorySchema,
  UpdateCatalogVariantOption,
  UpdateCatalogVariantTemplateSchema,
} from "../schemas/catalog-schemas";
import {
  CatalogProductTypeModel,
  CatalogProductTypeVariantModel,
  CatalogSubcategoryModel,
  CatalogVariantOptionModel,
  CatalogVariantTemplateModel,
  CategoryModel,
} from "../models/catalog-models";
import { StoreStorageService } from "../models/storage-models";
import { AppwriteRollback } from "./rollback";
import { STORE_BUCKET_ID } from "../env-config";
import { revalidatePath } from "next/cache";
import z from "zod";
import { createAdminClient } from "../appwrite";

const categoryModel = new CategoryModel();
const subcategoryModel = new CatalogSubcategoryModel();
const productTypeModel = new CatalogProductTypeModel();
const variantTemplateModel = new CatalogVariantTemplateModel();
const variantOptionModel = new CatalogVariantOptionModel();
const productTypeVariantModel = new CatalogProductTypeVariantModel();
const storageService = new StoreStorageService();

const action = createSafeActionClient({
  handleServerError: (error) => {
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

export const createCatalogCategory = action
  .use(authMiddleware)
  .schema(CatalogCategorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user, storage, teams } = ctx;
    const { databases } = await createAdminClient();

    const rollback = new AppwriteRollback(storage, databases, teams);

    try {
      const slugExists = !(await categoryModel.validateUniqueSlug(
        parsedInput.slug
      ));
      if (slugExists) {
        return { error: `Category slug "${parsedInput.slug}" already exists` };
      }

      let iconFileId: string | undefined;
      let iconUrl: string | undefined;

      if (parsedInput.icon) {
        try {
          const uploadedFile = await storageService.uploadFile(
            parsedInput.icon
          );
          await rollback.trackFile(STORE_BUCKET_ID, uploadedFile.$id);

          iconFileId = uploadedFile.$id;
          iconUrl = await storageService.getFileUrl(uploadedFile.$id, "view");
        } catch (error) {
          console.error("Icon upload failed:", error);
          return { error: "Failed to upload category icon" };
        }
      }

      const categoryData = {
        categoryName: parsedInput.categoryName,
        slug: parsedInput.slug,
        description: parsedInput.description,
        iconUrl,
        iconFileId,
        sortOrder: parsedInput.sortOrder,
        isActive: parsedInput.isActive,
      };

      const category = await categoryModel.createCategory(
        categoryData,
        user.$id
      );

      revalidatePath("/admin/sys-admin/catalog/categories");

      return {
        success: "Category created successfully",
        data: category,
      };
    } catch (error) {
      console.error("Create category error:", error);
      await rollback.rollback();
      return {
        error:
          error instanceof Error ? error.message : "Failed to create category",
      };
    }
  });

export const updateCatalogCategory = action
  .use(authMiddleware)
  .schema(UpdateCatalogCategorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user, storage, databases, teams } = ctx;
    const rollback = new AppwriteRollback(storage, databases, teams);

    try {
      const existingCategory = await categoryModel.findById(parsedInput.$id);
      if (!existingCategory) {
        return { error: "Category not found" };
      }

      if (parsedInput.slug && parsedInput.slug !== existingCategory.slug) {
        const slugExists = !(await categoryModel.validateUniqueSlug(
          parsedInput.slug,
          parsedInput.$id
        ));
        if (slugExists) {
          return {
            error: `Category slug "${parsedInput.slug}" already exists`,
          };
        }
      }

      let iconFileId = existingCategory.iconFileId;
      let iconUrl = existingCategory.iconUrl;

      if (parsedInput.icon) {
        try {
          const uploadedFile = await storageService.uploadFile(
            parsedInput.icon
          );
          await rollback.trackFile(STORE_BUCKET_ID, uploadedFile.$id);

          // Delete old icon if exists
          if (parsedInput.oldFileId) {
            await storageService.deleteFile(parsedInput.oldFileId);
          }

          iconFileId = uploadedFile.$id;
          iconUrl = await storageService.getFileUrl(uploadedFile.$id, "view");
        } catch (error) {
          console.error("Icon upload failed:", error);
          return { error: "Failed to upload category icon" };
        }
      }

      const updateData = {
        ...parsedInput,
        iconFileId,
        iconUrl,
      };

      const updatedCategory = await categoryModel.update(
        parsedInput.$id,
        updateData
      );

      revalidatePath("/admin/catalog/categories");
      revalidatePath("/categories");

      return {
        success: "Category updated successfully",
        data: updatedCategory,
      };
    } catch (error) {}
  });

export const deleteCatalogCategory = action
  .use(authMiddleware)
  .schema(z.object({ categoryId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const category = await categoryModel.findById(parsedInput.categoryId);
      if (!category) {
        return { error: "Category not found" };
      }

      const subcategoriesResult =
        await subcategoryModel.getSubcategoriesByCategory(
          parsedInput.categoryId,
          { limit: 1 }
        );

      if (subcategoriesResult.total > 0) {
        return {
          error:
            "Cannot delete category with existing subcategories. Please delete subcategories first.",
        };
      }

      if (category.iconFileId) {
        try {
          await storageService.deleteFile(category.iconFileId);
        } catch (error) {
          console.warn("Failed to delete category icon:", error);
        }
      }

      await categoryModel.deleteCategory(parsedInput.categoryId);

      revalidatePath("/admin/sys-admin/catalog/categories");

      return { success: "Category deleted successfully" };
    } catch (error) {
      console.error("Delete category error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to delete category",
      };
    }
  });

export const getCatalogCategories = async ({
  includeInactive = false,
  limit = 25,
  page,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}) => {
  try {
    const filters: any = {};
    if (search) {
      filters.categoryName = search;
    }

    const result = await categoryModel.findCategories(filters, {
      limit: limit,
      offset: ((page || 1) - 1) * limit,
      includeInactive: includeInactive,
      orderBy: "sortOrder",
      orderType: "asc",
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get categories error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
};

export const createCatalogSubcategory = action
  .use(authMiddleware)
  .schema(CatalogSubcategorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user, storage, teams } = ctx;
    const { databases } = await createAdminClient();
    const rollback = new AppwriteRollback(storage, databases, teams);

    try {
      const parentCategory = await categoryModel.findById(
        parsedInput.categoryId
      );
      if (!parentCategory) {
        return { error: "Parent category not found" };
      }

      const slugExists = !(await subcategoryModel.validateUniqueSlug(
        parsedInput.categoryId,
        parsedInput.slug
      ));
      if (slugExists) {
        return {
          error: `Subcategory slug "${parsedInput.slug}" already exists in this category`,
        };
      }

      let iconFileId: string | undefined;
      let iconUrl: string | undefined;

      if (parsedInput.icon) {
        try {
          const uploadedFile = await storageService.uploadFile(
            parsedInput.icon
          );
          await rollback.trackFile(STORE_BUCKET_ID, uploadedFile.$id);

          iconFileId = uploadedFile.$id;
          iconUrl = await storageService.getFileUrl(uploadedFile.$id, "view");
        } catch (error) {
          console.error("Icon upload failed:", error);
          return { error: "Failed to upload subcategory icon" };
        }
      }

      const subcategoryData = {
        subCategoryName: parsedInput.subCategoryName,
        categoryId: parsedInput.categoryId,
        slug: parsedInput.slug,
        description: parsedInput.description,
        iconUrl,
        iconFileId,
        sortOrder: parsedInput.sortOrder,
        isActive: parsedInput.isActive,
      };

      const subcategory = await subcategoryModel.createSubcategory(
        subcategoryData,
        user.$id
      );

      revalidatePath("/admin/sys-admin/catalog/categories");

      return {
        success: "Subcategory created successfully",
        data: subcategory,
      };
    } catch (error) {
      console.error("Create subcategory error:", error);
      await rollback.rollback();
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create subcategory",
      };
    }
  });

export const updateCatalogSubcategory = action
  .use(authMiddleware)
  .schema(UpdateCatalogSubcategorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user, storage, databases, teams } = ctx;
    const rollback = new AppwriteRollback(storage, databases, teams);

    try {
      const existingSubcategory = await subcategoryModel.getSubcategoryById(
        parsedInput.subcategoryId
      );
      if (!existingSubcategory) {
        return { error: "Subcategory not found" };
      }

      if (
        parsedInput.categoryId &&
        parsedInput.categoryId !== existingSubcategory.categoryId
      ) {
        const parentCategory = await categoryModel.findById(
          parsedInput.categoryId
        );
        if (!parentCategory) {
          return { error: "Parent category not found" };
        }
      }

      if (parsedInput.slug && parsedInput.slug !== existingSubcategory.slug) {
        const categoryIdToCheck =
          parsedInput.categoryId || existingSubcategory.categoryId;
        const slugExists = !(await subcategoryModel.validateUniqueSlug(
          categoryIdToCheck,
          parsedInput.slug,
          parsedInput.subcategoryId
        ));
        if (slugExists) {
          return {
            error: `Subcategory slug "${parsedInput.slug}" already exists in this category`,
          };
        }
      }

      let iconFileId = existingSubcategory.iconFileId;
      let iconUrl = existingSubcategory.iconUrl;

      if (parsedInput.icon) {
        try {
          const uploadedFile = await storageService.uploadFile(
            parsedInput.icon
          );
          await rollback.trackFile(STORE_BUCKET_ID, uploadedFile.$id);

          if (parsedInput.oldFileId) {
            await storageService.deleteFile(parsedInput.oldFileId);
          }

          iconFileId = uploadedFile.$id;
          iconUrl = await storageService.getFileUrl(uploadedFile.$id, "view");
        } catch (error) {
          console.error("Icon upload failed:", error);
          return { error: "Failed to upload subcategory icon" };
        }
      }

      const updateData = {
        ...parsedInput,
        iconFileId,
        iconUrl,
      };

      const updatedSubcategory = await subcategoryModel.update(
        parsedInput.subcategoryId,
        updateData
      );

      revalidatePath("/admin/sys-admin/catalog/categories");

      return {
        success: "Subcategory updated successfully",
        data: updatedSubcategory,
      };
    } catch (error) {
      console.error("Update subcategory error:", error);
      await rollback.rollback();
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update subcategory",
      };
    }
  });

export const deleteCatalogSubcategory = action
  .use(authMiddleware)
  .schema(z.object({ subcategoryId: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const subcategory = await subcategoryModel.getSubcategoryById(
        parsedInput.subcategoryId
      );
      if (!subcategory) {
        return { error: "Subcategory not found" };
      }

      const productTypesResult =
        await productTypeModel.getProductTypesBySubcategory(
          parsedInput.subcategoryId,
          { limit: 1 }
        );

      if (productTypesResult.total > 0) {
        return {
          error:
            "Cannot delete subcategory with existing product types. Please delete product types first.",
        };
      }

      if (subcategory.iconFileId) {
        try {
          await storageService.deleteFile(subcategory.iconFileId);
        } catch (error) {
          console.warn("Failed to delete subcategory icon:", error);
        }
      }

      await subcategoryModel.delete(parsedInput.subcategoryId);

      revalidatePath("/admin/sys-admin/catalog/categories");

      return { success: "Subcategory deleted successfully" };
    } catch (error) {
      console.error("Delete subcategory error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete subcategory",
      };
    }
  });

export const createCatalogProductType = action
  .use(authMiddleware)
  .schema(CatalogProductTypeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    try {
      const parentSubcategory = await subcategoryModel.getSubcategoryById(
        parsedInput.subcategoryId
      );
      if (!parentSubcategory) {
        return { error: "Parent subcategory not found" };
      }

      const slugExists = !(await productTypeModel.validateUniqueSlug(
        parsedInput.subcategoryId,
        parsedInput.slug
      ));
      if (slugExists) {
        return {
          error: `Product type slug "${parsedInput.slug}" already exists in this subcategory`,
        };
      }

      const productTypeData = {
        productTypeName: parsedInput.productTypeName,
        subcategoryId: parsedInput.subcategoryId,
        categoryId: parsedInput.categoryId,
        slug: parsedInput.slug,
        description: parsedInput.description,
        sortOrder: parsedInput.sortOrder,
        isActive: parsedInput.isActive,
      };

      const productType = await productTypeModel.createProductType(
        productTypeData,
        user.$id
      );

      revalidatePath("/admin/catalog/product-types");

      return {
        success: "Product type created successfully",
        data: productType,
      };
    } catch (error) {
      console.error("Create product type error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create product type",
      };
    }
  });

export const updateCatalogProductType = action
  .use(authMiddleware)
  .schema(UpdateCatalogProductTypeSchema)
  .action(async ({ parsedInput }) => {
    try {
      const existingProductType = await productTypeModel.getProductTypeById(
        parsedInput.productTypeId
      );
      if (!existingProductType) {
        return { error: "Product type not found" };
      }

      if (
        parsedInput.subcategoryId &&
        parsedInput.subcategoryId !== existingProductType.subcategoryId
      ) {
        const parentSubcategory = await subcategoryModel.getSubcategoryById(
          parsedInput.subcategoryId
        );
        if (!parentSubcategory) {
          return { error: "Parent subcategory not found" };
        }
      }

      if (parsedInput.slug && parsedInput.slug !== existingProductType.slug) {
        const subcategoryIdToCheck =
          parsedInput.subcategoryId || existingProductType.subcategoryId;
        const slugExists = !(await productTypeModel.validateUniqueSlug(
          subcategoryIdToCheck,
          parsedInput.slug,
          parsedInput.productTypeId
        ));
        if (slugExists) {
          return {
            error: `Product type slug "${parsedInput.slug}" already exists in this subcategory`,
          };
        }
      }

      const updatedProductType = await productTypeModel.update(
        parsedInput.productTypeId,
        parsedInput
      );

      revalidatePath("/admin/catalog/product-types");

      return {
        success: "Product type updated successfully",
        data: updatedProductType,
      };
    } catch (error) {
      console.error("Update product type error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update product type",
      };
    }
  });

export const deleteCatalogProductType = action
  .use(authMiddleware)
  .schema(z.object({ productTypeId: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const productType = await productTypeModel.getProductTypeById(
        parsedInput.productTypeId
      );
      if (!productType) {
        return { error: "Product type not found" };
      }

      const assignedVariantsResult =
        await productTypeVariantModel.getVariantsForProductType(
          parsedInput.productTypeId,
          { limit: 1 }
        );

      if (assignedVariantsResult.total > 0) {
        return {
          error:
            "Cannot delete product type with assigned variants. Please remove variant assignments first.",
        };
      }

      await productTypeModel.delete(parsedInput.productTypeId);

      revalidatePath("/admin/catalog/product-types");

      return { success: "Product type deleted successfully" };
    } catch (error) {
      console.error("Delete product type error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete product type",
      };
    }
  });

export const createCatalogVariantTemplate = action
  .use(authMiddleware)
  .schema(CatalogVariantTemplateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    try {
      const templateData = {
        variantTemplateName: parsedInput.variantTemplateName,
        description: parsedInput.description,
        inputType: parsedInput.inputType,
        isRequired: parsedInput.isRequired,
        categoryIds: parsedInput.categoryIds,
        subcategoryIds: parsedInput.subcategoryIds,
        productTypeIds: parsedInput.productTypeIds,
        sortOrder: parsedInput.sortOrder,
        isActive: parsedInput.isActive,
      };

      const variantTemplate = await variantTemplateModel.createVariantTemplate(
        templateData,
        user.$id
      );

      revalidatePath("/admin/sys-admin/catalog/variant-templates");

      return {
        success: "Variant template created successfully",
        data: variantTemplate,
      };
    } catch (error) {
      console.error("Create variant template error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create variant template",
      };
    }
  });

export const createCatalogVariantOption = action
  .use(authMiddleware)
  .schema(CatalogVariantOptionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    try {
      const parentTemplate = await variantTemplateModel.getVariantTemplateById(
        parsedInput.variantTemplateId
      );
      if (!parentTemplate) {
        return { error: "Parent variant template not found" };
      }

      const valueExists = !(await variantOptionModel.validateUniqueValue(
        parsedInput.variantTemplateId,
        parsedInput.value
      ));
      if (valueExists) {
        return {
          error: `Variant option value "${parsedInput.value}" already exists in this template`,
        };
      }

      const optionData = {
        ...parsedInput,
        userId: user.$id,
      };

      const variantOption = await variantOptionModel.createVariantOption(
        optionData
      );

      revalidatePath("/admin/sys-admin/catalog/variant-templates");

      return {
        success: "Variant option created successfully",
        data: variantOption,
      };
    } catch (error) {
      console.error("Create variant option error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create variant option",
      };
    }
  });

export const assignVariantToProductType = action
  .use(authMiddleware)
  .schema(AssignVariantToProductTypeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    try {
      const productType = await productTypeModel.getProductTypeById(
        parsedInput.productTypeId
      );
      if (!productType) {
        return { error: "Product type not found" };
      }

      const variantTemplate = await variantTemplateModel.getVariantTemplateById(
        parsedInput.variantTemplateId
      );
      if (!variantTemplate) {
        return { error: "Variant template not found" };
      }

      const assignmentExists =
        await productTypeVariantModel.checkVariantAssignment(
          parsedInput.productTypeId,
          parsedInput.variantTemplateId
        );

      if (assignmentExists) {
        return {
          error: "This variant is already assigned to the product type",
        };
      }

      const assignment =
        await productTypeVariantModel.assignVariantToProductType(
          parsedInput,
          user.$id
        );

      revalidatePath("/admin/sys-admin/catalog/product-types");

      return {
        success: "Variant assigned to product type successfully",
        data: assignment,
      };
    } catch (error) {
      console.error("Assign variant to product type error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to assign variant to product type",
      };
    }
  });

export const removeVariantFromProductType = action
  .use(authMiddleware)
  .schema(
    z.object({
      productTypeId: z.string(),
      variantTemplateId: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      await productTypeVariantModel.removeVariantFromProductType(
        parsedInput.productTypeId,
        parsedInput.variantTemplateId
      );

      revalidatePath("/admin/catalog/product-types");

      return { success: "Variant removed from product type successfully" };
    } catch (error) {
      console.error("Remove variant from product type error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove variant from product type",
      };
    }
  });

export const updateCatalogVariantTemplate = action
  .use(authMiddleware)
  .schema(UpdateCatalogVariantTemplateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { templateId, ...updateData } = parsedInput;

    try {
      const existingTemplate =
        await variantTemplateModel.getVariantTemplateById(templateId);
      if (!existingTemplate) {
        return { error: "Variant template not found" };
      }

      const updatedTemplate = await variantTemplateModel.update(
        templateId,
        updateData
      );

      revalidatePath("/admin/sys-admin/catalog/variant-templates");

      return {
        success: "Variant template updated successfully",
        data: updatedTemplate,
      };
    } catch (error) {
      console.error("Update variant template error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update variant template",
      };
    }
  });

export const updateCatalogVariantOption = action
  .use(authMiddleware)
  .schema(UpdateCatalogVariantOption)
  .action(async ({ parsedInput, ctx }) => {
    const { optionId, ...updateData } = parsedInput;

    try {
      const existingOption = await variantOptionModel.findById(optionId, {});
      if (!existingOption) {
        return { error: "Variant option not found" };
      }

      // Validate unique value if being updated
      if (updateData.value && updateData.value !== existingOption.value) {
        const valueExists = !(await variantOptionModel.validateUniqueValue(
          existingOption.variantTemplateId,
          updateData.value,
          optionId
        ));
        if (valueExists) {
          return {
            error: `Variant option value "${updateData.value}" already exists in this template`,
          };
        }
      }

      const updatedOption = await variantOptionModel.update(
        optionId,
        updateData
      );

      revalidatePath("/admin/sys-admin/catalog/variant-templates");

      return {
        success: "Variant option updated successfully",
        data: updatedOption,
      };
    } catch (error) {
      console.error("Update variant option error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update variant option",
      };
    }
  });

export const deleteCatalogVariantOption = action
  .use(authMiddleware)
  .schema(z.object({ optionId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const option = await variantOptionModel.findById(
        parsedInput.optionId,
        {}
      );
      if (!option) {
        return { error: "Variant option not found" };
      }

      await variantOptionModel.delete(parsedInput.optionId);

      revalidatePath("/admin/sys-admin/catalog/variant-templates");

      return { success: "Variant option deleted successfully" };
    } catch (error) {
      console.error("Delete variant option error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete variant option",
      };
    }
  });

export const deleteCatalogVariantTemplate = action
  .use(authMiddleware)
  .schema(z.object({ templateId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const template = await variantTemplateModel.getVariantTemplateById(
        parsedInput.templateId
      );
      if (!template) {
        return { error: "Variant template not found" };
      }

      const productTypeVariantsResult = await productTypeVariantModel.findMany({
        filters: [
          {
            field: "variantTemplateId",
            operator: "equal",
            value: parsedInput.templateId,
          },
        ],
        limit: 1,
      });

      if (productTypeVariantsResult.documents.length > 0) {
        return {
          error:
            "Cannot delete variant template that is assigned to product types. Please remove assignments first.",
        };
      }

      const optionsResult = await variantOptionModel.findMany({
        filters: [
          {
            field: "variantTemplateId",
            operator: "equal",
            value: parsedInput.templateId,
          },
        ],
      });

      for (const option of optionsResult.documents) {
        await variantOptionModel.delete(option.$id);
      }

      await variantTemplateModel.delete(parsedInput.templateId);

      revalidatePath("/admin/sys-admin/catalog/variant-templates");

      return { success: "Variant template deleted successfully" };
    } catch (error) {
      console.error("Delete variant template error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete variant template",
      };
    }
  });

export const getSubcategoriesByCategory = async ({
  categoryId,
}: {
  categoryId: string;
}) => {
  try {
    const result = await subcategoryModel.getSubcategoriesByCategory(
      categoryId,
      {
        limit: 1000,
        orderBy: "sortOrder",
        orderType: "asc",
      }
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get subcategories error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch subcategories",
    };
  }
};

export const getProductTypesBySubcategory = async ({
  subcategoryId,
}: {
  subcategoryId: string;
}) => {
  try {
    const result = await productTypeModel.getProductTypesBySubcategory(
      subcategoryId,
      {
        limit: 1000,
        orderBy: "sortOrder",
        orderType: "asc",
      }
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get product types error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch product types",
    };
  }
};

export const getVariantOptionsForTemplate = async ({
  variantTemplateId,
}: {
  variantTemplateId: string;
}) => {
  try {
    const result = await variantOptionModel.getOptionsForTemplate(
      variantTemplateId,
      {
        limit: 1000,
        orderBy: "sortOrder",
        orderType: "asc",
      }
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get variant options error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch variant options",
    };
  }
};

export const getVariantsForProductType = async ({
  productTypeId,
}: {
  productTypeId: string;
}) => {
  try {
    const result = await productTypeVariantModel.getVariantsForProductType(
      productTypeId,
      {
        limit: 1000,
        orderBy: "sortOrder",
        orderType: "asc",
      }
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get product type variants error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch product type variants",
    };
  }
};
