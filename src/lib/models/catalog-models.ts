import {
  BaseModel,
  CacheOptions,
  PaginationResult,
  QueryFilter,
  QueryOptions,
} from "../core/database";
import {
  CATALOG_PRODUCT_TYPE_VARIANTS_COLLECTION_ID,
  CATALOG_PRODUCT_TYPES_COLLECTION_ID,
  CATALOG_VARIANT_OPTIONS_COLLECTION_ID,
  CATALOG_VARIANT_TEMPLATES_COLLECTION_ID,
  CATEGORIES_COLLECTION_ID,
  SUB_CATEGORIES_ID,
} from "../env-config";
import {
  CatalogProductTypes,
  CatalogProductTypeVariants,
  CatalogVariantOptions,
  CatalogVariantTemplates,
  ProductCategories,
  Subcategories,
} from "../types/appwrite/appwrite";

export interface CategoryFilters {
  storeId?: string;
  isActive?: boolean;
  categoryName?: string;
  slug?: string;
  createdBy?: string;
}

export interface CategoryCreateData {
  categoryName: string;
  slug: string;
  storeId?: string;
  iconUrl?: string;
  iconFileId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryUpdateData {
  categoryName?: string;
  slug?: string;
  iconUrl?: string;
  iconFileId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryQueryOptions extends QueryOptions {
  includeInactive?: boolean;
  cache?: CacheOptions;
}

export class CategoryModel extends BaseModel<ProductCategories> {
  constructor() {
    super(CATEGORIES_COLLECTION_ID);
  }

  async findById(
    categoryId: string,
    options: { cache?: CacheOptions } = {}
  ): Promise<ProductCategories | null> {
    return super.findById(categoryId, options);
  }

  async createCategory(
    data: CategoryCreateData,
    userId: string
  ): Promise<ProductCategories> {
    const categoriesData = {
      ...data,
      createdBy: userId,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    };

    return this.create(categoriesData, userId);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.delete(id);
  }

  async findCategories(
    filters: CategoryFilters = {},
    options: CategoryQueryOptions = {}
  ): Promise<PaginationResult<ProductCategories>> {
    const queryFilters: QueryFilter[] = [];

    if (filters.storeId) {
      queryFilters.push({
        field: "storeId",
        operator: "equal",
        value: filters.storeId,
      });
    }

    if (filters.isActive !== undefined && !options.includeInactive) {
      queryFilters.push({
        field: "isActive",
        operator: "equal",
        value: filters.isActive,
      });
    } else if (!options.includeInactive) {
      queryFilters.push({ field: "isActive", operator: "equal", value: true });
    }

    if (filters.categoryName) {
      queryFilters.push({
        field: "categoryName",
        operator: "contains",
        value: filters.categoryName,
      });
    }

    if (filters.slug) {
      queryFilters.push({
        field: "slug",
        operator: "equal",
        value: filters.slug,
      });
    }

    if (filters.createdBy) {
      queryFilters.push({
        field: "createdBy",
        operator: "equal",
        value: filters.createdBy,
      });
    }

    const queryOptions: QueryOptions = {
      ...options,
      filters: queryFilters,
      orderBy: options.orderBy,
      orderType: options.orderType || "asc",
    };

    return this.findMany(queryOptions);
  }

  async getStoreCategories(
    storeId: string,
    options: CategoryQueryOptions = {}
  ): Promise<PaginationResult<ProductCategories>> {
    const result = await this.findCategories(
      { storeId },
      {
        ...options,
        limit: options.limit || 1000,
      }
    );

    return result;
  }

  async getActiveCategories(
    options: QueryOptions = {}
  ): Promise<PaginationResult<ProductCategories>> {
    return this.findMany({
      ...options,
      filters: [{ field: "isActive", operator: "equal", value: true }],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async getCategoryBySlug(slug: string): Promise<ProductCategories | null> {
    return this.findOne([{ field: "slug", operator: "equal", value: slug }]);
  }

  async searchCategories(
    searchTerm: string,
    storeId?: string,
    options: CategoryQueryOptions = {}
  ): Promise<PaginationResult<ProductCategories>> {
    const filters: CategoryFilters = { categoryName: searchTerm };
    if (storeId) filters.storeId = storeId;

    return this.findCategories(filters, options);
  }

  async validateUniqueSlug(slug: string, excludeId?: string): Promise<boolean> {
    const filters: QueryFilter[] = [
      { field: "slug", operator: "equal", value: slug },
    ];

    if (excludeId) {
      filters.push({ field: "$id", operator: "notEqual", value: excludeId });
    }

    const existing = await this.findOne(filters);
    return !existing;
  }
}

export class CatalogSubcategoryModel extends BaseModel<Subcategories> {
  constructor() {
    super(SUB_CATEGORIES_ID);
  }

  async createSubcategory(
    data: {
      subCategoryName: string;
      categoryId: string;
      slug: string;
      iconUrl?: string;
      iconFileId?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
    userId: string
  ): Promise<Subcategories> {
    const subcategoryData = {
      ...data,
      createdBy: userId,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    };

    return this.create(subcategoryData, userId);
  }

  async getSubcategoriesByCategory(
    categoryId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<Subcategories>> {
    return this.findMany({
      ...options,
      filters: [
        { field: "categoryId", operator: "equal", value: categoryId },
        { field: "isActive", operator: "equal", value: true },
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async getSubcategoryBySlug(
    categoryId: string,
    slug: string
  ): Promise<Subcategories | null> {
    return this.findOne([
      { field: "categoryId", operator: "equal", value: categoryId },
      { field: "slug", operator: "equal", value: slug },
    ]);
  }

  async getSubcategoryById(id: string): Promise<Subcategories | null> {
    return this.findById(id, {});
  }

  async validateUniqueSlug(
    categoryId: string,
    slug: string,
    excludeId?: string
  ): Promise<boolean> {
    const filters: QueryFilter[] = [
      { field: "categoryId", operator: "equal", value: categoryId },
      { field: "slug", operator: "equal", value: slug },
    ];

    if (excludeId) {
      filters.push({ field: "$id", operator: "notEqual", value: excludeId });
    }

    const existing = await this.findOne(filters);
    return !existing;
  }
}

export class CatalogProductTypeModel extends BaseModel<CatalogProductTypes> {
  constructor() {
    super(CATALOG_PRODUCT_TYPES_COLLECTION_ID);
  }

  async createProductType(
    data: {
      productTypeName: string;
      subcategoryId: string;
      categoryId: string;
      slug: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
    userId: string
  ): Promise<CatalogProductTypes> {
    const productTypeData = {
      ...data,
      createdBy: userId,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    };

    return this.create(productTypeData, userId);
  }

  async getProductTypesBySubcategory(
    subcategoryId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogProductTypes>> {
    return this.findMany({
      ...options,
      filters: [
        { field: "subcategoryId", operator: "equal", value: subcategoryId },
        { field: "isActive", operator: "equal", value: true },
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async getProductTypesByCategory(
    categoryId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogProductTypes>> {
    return this.findMany({
      ...options,
      filters: [
        { field: "categoryId", operator: "equal", value: categoryId },
        { field: "isActive", operator: "equal", value: true },
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async getProductTypeBySlug(
    subcategoryId: string,
    slug: string
  ): Promise<CatalogProductTypes | null> {
    return this.findOne([
      { field: "subcategoryId", operator: "equal", value: subcategoryId },
      { field: "slug", operator: "equal", value: slug },
    ]);
  }

  async getProductTypeById(id: string): Promise<CatalogProductTypes | null> {
    return this.findById(id, {});
  }

  async validateUniqueSlug(
    subcategoryId: string,
    slug: string,
    excludeId?: string
  ): Promise<boolean> {
    const filters: QueryFilter[] = [
      { field: "subcategoryId", operator: "equal", value: subcategoryId },
      { field: "slug", operator: "equal", value: slug },
    ];

    if (excludeId) {
      filters.push({ field: "id", operator: "notEqual", value: excludeId });
    }

    const existing = await this.findOne(filters);
    return !existing;
  }
}

export class CatalogVariantTemplateModel extends BaseModel<CatalogVariantTemplates> {
  constructor() {
    super(CATALOG_VARIANT_TEMPLATES_COLLECTION_ID);
  }

  async createVariantTemplate(
    data: {
      variantTemplateName: string;
      description?: string;
      inputType:
        | "text"
        | "color"
        | "range"
        | "number"
        | "select"
        | "multiselect"
        | "boolean";
      isRequired?: boolean;
      categoryIds?: string[];
      subcategoryIds?: string[];
      productTypeIds?: string[];
      sortOrder?: number;
      isActive?: boolean;
    },
    userId: string
  ): Promise<CatalogVariantTemplates> {
    const templateData = {
      ...data,
      createdBy: userId,
      isRequired: data.isRequired ?? false,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    };

    return this.create(templateData, userId);
  }

  async getAllVariantTemplates(
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogVariantTemplates>> {
    return this.findMany({
      ...options,
      filters: [
        { field: "isActive", operator: "equal", value: true },
        ...(options.filters || [])
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async searchVariantTemplates(
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogVariantTemplates>> {
    return this.findMany({
      ...options,
      filters: [
        { field: "variantTemplateName", operator: "contains", value: searchTerm },
        { field: "isActive", operator: "equal", value: true },
        ...(options.filters || [])
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async validateUniqueTemplateName(
    templateName: string,
    excludeId?: string
  ): Promise<boolean> {
    const filters: QueryFilter[] = [
      { field: "variantTemplateName", operator: "equal", value: templateName },
    ];

    if (excludeId) {
      filters.push({ field: "$id", operator: "notEqual", value: excludeId });
    }

    const existing = await this.findOne(filters);
    return !existing;
  }

  async getVariantTemplatesForProductType(
    productTypeId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogVariantTemplates>> {
    return this.findMany({
      ...options,
      filters: [
        { field: "productTypeIds", operator: "contains", value: productTypeId },
        { field: "isActive", operator: "equal", value: true },
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async getVariantTemplatesForCategory(
    categoryId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogVariantTemplates>> {
    return this.findMany({
      ...options,
      filters: [
        { field: "categoryIds", operator: "contains", value: categoryId },
        { field: "isActive", operator: "equal", value: true },
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async getGlobalVariantTemplates(
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogVariantTemplates>> {
    return this.findMany({
      ...options,
      filters: [
        { field: "categoryIds", operator: "isNull" },
        { field: "subcategoryIds", operator: "isNull" },
        { field: "productTypeIds", operator: "isNull" },
        { field: "isActive", operator: "equal", value: true },
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async getVariantTemplateById(
    id: string
  ): Promise<CatalogVariantTemplates | null> {
    return this.findById(id, {});
  }
}

export class CatalogVariantOptionModel extends BaseModel<CatalogVariantOptions> {
  constructor() {
    super(CATALOG_VARIANT_OPTIONS_COLLECTION_ID);
  }

  async getOptionById(id: string): Promise<CatalogVariantOptions | null> {
    return this.findById(id, {});
  }

  async getDefaultOptionForTemplate(
    variantTemplateId: string
  ): Promise<CatalogVariantOptions | null> {
    return this.findOne([
      {
        field: "variantTemplateId",
        operator: "equal",
        value: variantTemplateId,
      },
      { field: "isDefault", operator: "equal", value: true },
      { field: "isActive", operator: "equal", value: true },
    ]);
  }

  async setDefaultOption(
    variantTemplateId: string,
    optionId: string
  ): Promise<void> {
    const allOptions = await this.getAllOptionsForTemplate(variantTemplateId);
    
    for (const option of allOptions.documents) {
      if (option.isDefault && option.$id !== optionId) {
        await this.update(option.$id, { isDefault: false });
      }
    }

    await this.update(optionId, { isDefault: true });
  }

  async getAllOptionsForTemplate(
    variantTemplateId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogVariantOptions>> {
    return this.findMany({
      ...options,
      filters: [
        {
          field: "variantTemplateId",
          operator: "equal",
          value: variantTemplateId,
        },
        ...(options.filters || [])
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async createVariantOption(data: {
    variantTemplateId: string;
    value: string;
    label: string;
    colorCode?: string;
    additionalPrice?: number;
    isDefault?: boolean;
    sortOrder?: number;
    isActive?: boolean;
    userId: string;
  }): Promise<CatalogVariantOptions> {
    const optionData = {
      ...data,
      additionalPrice: data.additionalPrice ?? 0,
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    };

    return this.create(optionData, data.userId);
  }

  async getOptionsForTemplate(
    variantTemplateId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogVariantOptions>> {
    return this.findMany({
      ...options,
      filters: [
        {
          field: "variantTemplateId",
          operator: "equal",
          value: variantTemplateId,
        },
        { field: "isActive", operator: "equal", value: true },
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async validateUniqueValue(
    variantTemplateId: string,
    value: string,
    excludeId?: string
  ): Promise<boolean> {
    const filters: QueryFilter[] = [
      {
        field: "variantTemplateId",
        operator: "equal",
        value: variantTemplateId,
      },
      { field: "value", operator: "equal", value: value },
    ];

    if (excludeId) {
      filters.push({ field: "$id", operator: "notEqual", value: excludeId });
    }

    const existing = await this.findOne(filters);
    return !existing;
  }
}

export class CatalogProductTypeVariantModel extends BaseModel<CatalogProductTypeVariants> {
  constructor() {
    super(CATALOG_PRODUCT_TYPE_VARIANTS_COLLECTION_ID);
  }

  async getAssignmentById(id: string): Promise<CatalogProductTypeVariants | null> {
    return this.findById(id, {});
  }

  async assignVariantToProductType(
    data: {
      productTypeId: string;
      variantTemplateId: string;
      isRequired?: boolean;
      sortOrder?: number;
    },
    userId: string
  ): Promise<CatalogProductTypeVariants> {
    const assignmentData = {
      ...data,
      createdBy: userId,
      isRequired: data.isRequired ?? false,
      sortOrder: data.sortOrder ?? 0,
    };

    return this.create(assignmentData, userId);
  }

  async getVariantsForProductType(
    productTypeId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogProductTypeVariants>> {
    return this.findMany({
      ...options,
      filters: [
        { field: "productTypeId", operator: "equal", value: productTypeId },
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }

  async removeVariantFromProductType(
    productTypeId: string,
    variantTemplateId: string
  ): Promise<void> {
    const assignment = await this.findOne([
      { field: "productTypeId", operator: "equal", value: productTypeId },
      {
        field: "variantTemplateId",
        operator: "equal",
        value: variantTemplateId,
      },
    ]);

    if (assignment) {
      await this.delete(assignment.$id);
    }
  }

  async checkVariantAssignment(
    productTypeId: string,
    variantTemplateId: string
  ): Promise<boolean> {
    const assignment = await this.findOne([
      { field: "productTypeId", operator: "equal", value: productTypeId },
      {
        field: "variantTemplateId",
        operator: "equal",
        value: variantTemplateId,
      },
    ]);

    return !!assignment;
  }

  async updateVariantAssignment(
    productTypeId: string,
    variantTemplateId: string,
    updateData: {
      isRequired?: boolean;
      sortOrder?: number;
    }
  ): Promise<CatalogProductTypeVariants | null> {
    const assignment = await this.findOne([
      { field: "productTypeId", operator: "equal", value: productTypeId },
      {
        field: "variantTemplateId",
        operator: "equal",
        value: variantTemplateId,
      },
    ]);

    if (assignment) {
      return this.update(assignment.$id, updateData);
    }

    return null;
  }

  async getProductTypesUsingVariant(
    variantTemplateId: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<CatalogProductTypeVariants>> {
    return this.findMany({
      ...options,
      filters: [
        {
          field: "variantTemplateId",
          operator: "equal",
          value: variantTemplateId,
        },
      ],
      orderBy: "sortOrder",
      orderType: "asc",
    });
  }
}
