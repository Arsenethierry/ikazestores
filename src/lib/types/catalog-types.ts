export interface Category {
    id: string;
    name: string;
    storeId?: string | null;
    subcategories?: Subcategory[];
}

export interface Subcategory {
    id: string;
    name: string;
    productTypes: string[];
    categoryId: string;
    storeId?: string | null,
}

export interface ProductType {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    subcategoryId?: string;
    defaultVariantTemplates: string[];
}

export interface VariantOption {
    value: string;
    label: string;
    additionalPrice?: number;
    colorCode?: string;
    metadata?: {
        count: number;
    };
}

export interface VariantTemplate {
    id: string;
    name: string;
    description: string;
    inputType: "boolean" | "text" | "color" | "range" | "number" | "select" | "multiselect";
    isRequired: boolean;
    categoryIds?: string[];
    productTypeIds?: string[];
    subcategoryIds?: string[];
    variantOptions: VariantOption[];
    minValue?: number;
    maxValue?: number;
    step?: number;
    unit?: string;
    group?: string;
}
export interface ProductVariant {
    templateId: string;
    name: string;
    type: 'boolean' | 'color' | 'text' | 'select' | 'range' | 'number' | 'multiselect';
    values: VariantOption[]; // Use VariantOption directly instead of VariantValue
    required: boolean;
    sortOrder?: number;
}
export interface VariantType {
    id: string;
    values: VariantOption[];
}

export interface CatalogData {
    categories: Category[];
    variantTemplates: Record<string, {
        id: string;
        name: string;
        description: string;
        inputType: string;
        isRequired: boolean;
        options?: Array<{
            value: string;
            name?: string;
            additionalPrice?: number;
            colorCode?: string;
        }>;
    }>;
    productTypeVariantMapping: Record<string, Record<string, string[]>>;
    variantCategories: Record<string, string[]>;
    requiredVariantsByCategory: Record<string, string[]>;
    compatibilityMatrix: Record<string, {
        incompatible?: string[];
        required?: string[];
        recommended?: string[];
    }>;
    variantDisplayGroups: Record<string, string[]>;
};