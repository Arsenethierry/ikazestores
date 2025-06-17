/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { catalogData } from "@/data/catalog-data";
import { Category, ProductType, Subcategory, VariantOption, VariantTemplate } from "../../lib/types";

// Simple types for variant handling
interface VariantValue {
    value: string;
    label?: string;
    colorCode?: string;
    additionalPrice?: number;
    isDefault?: boolean;
}

interface Variant {
    id: string;
    name: string;
    type: 'text' | 'color' | 'select' | 'boolean' | 'multiselect';
    values: VariantValue[];
    required: boolean;
}

interface ProductCombination {
    id: string;
    variantValues: Record<string, string>;
    sku: string;
    price: number;
    quantity?: number;
    isDefault?: boolean;
    // Simple variant strings for filtering
    variantStrings?: string[];
}

/**
 * E-commerce Catalog Utility with simple variant string formatting for filtering
 */
export class EcommerceCatalogUtils {
    private static data = catalogData;

    // ===== CORE CATALOG METHODS =====

    /**
     * Get all categories
     */
    static getCategories(): Category[] {
        return this.data.categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            subcategories: cat.subcategories?.map(sub => ({
                id: sub.id,
                name: sub.name,
                productTypes: sub.productTypes || []
            }))
        }));
    }

    /**
     * Get category by ID
     */
    static getCategoryById(categoryId: string): Category | null {
        const category = this.data.categories.find(cat => cat.id === categoryId);
        if (!category) return null;

        return {
            id: category.id,
            name: category.name,
            subcategories: category.subcategories?.map(sub => ({
                id: sub.id,
                name: sub.name,
                productTypes: sub.productTypes || []
            }))
        };
    }

    /**
     * Get subcategory by ID
     */
    static getSubcategoryById(categoryId: string, subcategoryId: string): Subcategory | null {
        const category = this.getCategoryById(categoryId);
        if (!category?.subcategories) return null;

        return category.subcategories.find(sub => sub.id === subcategoryId) || null;
    }

    /**
     * Generate product types from catalog data
     */
    static getProductTypes(): ProductType[] {
        const productTypes: ProductType[] = [];

        this.data.categories.forEach(category => {
            category.subcategories?.forEach(subcategory => {
                subcategory.productTypes.forEach(productType => {
                    const productTypeId = `${category.id}-${subcategory.id}-${productType}`;
                    productTypes.push({
                        id: productTypeId,
                        name: this.formatProductTypeName(productType),
                        description: `${subcategory.name} product type`,
                        categoryId: category.id,
                        defaultVariantTemplates: this.getDefaultVariantTemplatesForProductType(
                            category.id,
                            subcategory.id,
                            productType
                        ),
                    });
                });
            });
        });

        return productTypes;
    }

    /**
     * Get product types filtered by category
     */
    static getProductTypesByCategory(categoryId: string): ProductType[] {
        return this.getProductTypes().filter(type => type.categoryId === categoryId);
    }

    /**
     * Get product type by ID
     */
    static getProductTypeById(productTypeId: string): ProductType | null {
        return this.getProductTypes().find(type => type.id === productTypeId) || null;
    }

    /**
     * Get all variant templates from catalog data
     */
    static getVariantTemplates(): VariantTemplate[] {
        return this.data.variantTemplates.map(template => ({
            id: template.id,
            name: template.name,
            description: template.description,
            inputType: template.inputType as 'select' | 'multiselect' | 'color' | 'boolean' | 'text',
            isRequired: template.isRequired,
            categoryIds: template.categoryIds,
            productTypeIds: template.productTypeIds,
            subcategoryIds: template.subcategoryIds,
            options: template.options?.map((option: VariantOption) => ({
                value: option.value,
                name: option.name,
                additionalPrice: option.additionalPrice,
                colorCode: option.colorCode
            }))
        }));
    }

    static getProductTypesBySubcategory(categoryId: string, subcategoryId: string): ProductType[] {
        const subcategory = this.getSubcategoryById(categoryId, subcategoryId);
        if (!subcategory) return [];

        const productTypes: ProductType[] = [];

        subcategory.productTypes.forEach(productType => {
            const productTypeId = `${categoryId}-${subcategoryId}-${productType}`;
            productTypes.push({
                id: productTypeId,
                name: this.formatProductTypeName(productType),
                description: `${subcategory.name} product type`,
                categoryId: categoryId,
                subcategoryId: subcategoryId,
                defaultVariantTemplates: this.getDefaultVariantTemplatesForProductType(
                    categoryId,
                    subcategoryId,
                    productType
                )
            });
        });

        return productTypes;
    }
    /**
     * Get variant templates applicable to a specific product type
     */
    static getVariantTemplatesForProductType(productTypeId: string): VariantTemplate[] {
        const productType = this.getProductTypeById(productTypeId);
        if (!productType) return [];

        // Extract the actual product type name from the full ID
        const parts = productTypeId.split('-');
        const categoryId = parts[0];
        const subcategoryId = parts[1];
        const actualProductType = parts.slice(2).join('-');

        // Get templates based on mapping
        // @ts-ignore
        const mapping = this.data.productTypeVariantMapping?.[categoryId]?.[actualProductType] || [];

        return this.getVariantTemplates().filter(template => {
            // Check direct mapping first (most specific)
            if (mapping.includes(template.id)) return true;

            // Check if template is applicable to this subcategory
            const matchesSubcategory = !template.subcategoryIds?.length ||
                template.subcategoryIds.includes(subcategoryId);

            // Check if template is applicable to this category
            const matchesCategory = !template.categoryIds?.length ||
                template.categoryIds.includes(categoryId);

            // Check if template is applicable to this product type
            const matchesProductType = !template.productTypeIds?.length ||
                template.productTypeIds.includes(productTypeId);

            return matchesCategory && matchesSubcategory && matchesProductType;
        });
    }
    /**
     * Get recommended variant templates based on product type with smart sorting
     */
    static getRecommendedVariantTemplates(productTypeId: string): VariantTemplate[] {
        const templates = this.getVariantTemplatesForProductType(productTypeId);

        // Sort by relevance
        return templates.sort((a, b) => {
            // Required templates first
            if (a.isRequired && !b.isRequired) return -1;
            if (!a.isRequired && b.isRequired) return 1;

            // Prioritize common variants
            const commonVariants = ['color', 'size', 'material', 'storage', 'ram', 'condition'];
            const aIsCommon = commonVariants.some(variant => a.id.includes(variant));
            const bIsCommon = commonVariants.some(variant => b.id.includes(variant));

            if (aIsCommon && !bIsCommon) return -1;
            if (!aIsCommon && bIsCommon) return 1;

            // Sort by name
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get variant template by ID
     */
    static getVariantTemplateById(templateId: string): VariantTemplate | null {
        return this.getVariantTemplates().find(template => template.id === templateId) || null;
    }

    // ===== VARIANT STRING FORMATTING METHODS =====

    /**
     * Create simple variant string for filtering
     * Examples:
     * - Size Large -> "size-l"
     * - Color White -> "color-white"
     * - Material Cotton -> "material-cotton"
     * - Storage 128GB -> "storage-128gb"
     */
    static createVariantString(variantId: string, value: string): string {
        // Determine variant type from ID
        let variantType = '';

        if (variantId.includes('size')) {
            variantType = 'size';
        } else if (variantId.includes('color')) {
            variantType = 'color';
        } else if (variantId.includes('material')) {
            variantType = 'material';
        } else if (variantId.includes('storage')) {
            variantType = 'storage';
        } else if (variantId.includes('ram')) {
            variantType = 'ram';
        } else if (variantId.includes('brand')) {
            variantType = 'brand';
        } else if (variantId.includes('condition')) {
            variantType = 'condition';
        } else if (variantId.includes('style')) {
            variantType = 'style';
        } else if (variantId.includes('fit')) {
            variantType = 'fit';
        } else if (variantId.includes('capacity')) {
            variantType = 'capacity';
        } else {
            // Fallback: extract base variant type
            variantType = variantId.split('-')[0] || 'variant';
        }

        // Clean and normalize the value
        const cleanValue = value.toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove special characters
            .replace(/\s+/g, ''); // Remove spaces

        return `${variantType}-${cleanValue}`;
    }

    /**
     * Generate array of variant strings for a product combination
     * Example: ["size-l", "color-white", "material-cotton"]
     */
    static generateVariantStrings(variantValues: Record<string, string>): string[] {
        return Object.entries(variantValues).map(([variantId, value]) =>
            this.createVariantString(variantId, value)
        );
    }

    /**
     * Generate all variant combinations with simple string formatting
     */
    static generateCombinationsWithStrings(variants: Variant[], basePrice: number, baseSku: string): ProductCombination[] {
        const combinations: ProductCombination[] = [];

        if (variants.length === 0) {
            return combinations;
        }

        const variantValues = variants.map(v => v.values);

        // Cartesian product function
        function cartesianProduct(arrays: any[][]): any[][] {
            return arrays.reduce((acc, curr) => {
                const result: any[] = [];
                acc.forEach(a => {
                    curr.forEach(b => {
                        result.push([...a, b]);
                    });
                });
                return result;
            }, [[]]);
        }

        if (variantValues.every(v => v.length > 0)) {
            const products = cartesianProduct(variantValues);

            products.forEach((combination, index) => {
                const variantValuesMap: Record<string, string> = {};
                combination.forEach((value, variantIndex) => {
                    variantValuesMap[variants[variantIndex].id] = value.value;
                });

                const calculatedPrice = this.calculateVariantPrice(basePrice, variantValuesMap);
                const generatedSKU = this.generateVariantSKU(baseSku, variantValuesMap);

                const combinationData: ProductCombination = {
                    id: `combination-${index}`,
                    variantValues: variantValuesMap,
                    sku: generatedSKU,
                    price: calculatedPrice,
                    quantity: 0,
                    isDefault: index === 0,

                    // Generate simple variant strings for filtering
                    variantStrings: this.generateVariantStrings(variantValuesMap)
                };

                combinations.push(combinationData);
            });
        }

        return combinations;
    }

    /**
     * Filter combinations by variant criteria
     * Example usage:
     * filterCombinations(combinations, { size: ['l', 'xl'], color: ['white', 'black'] })
     */
    static filterCombinations(
        combinations: ProductCombination[],
        filters: Record<string, string[]>
    ): ProductCombination[] {
        return combinations.filter(combo => {
            if (!combo.variantStrings) return false;

            // Check if combination matches all filter criteria
            return Object.entries(filters).every(([variantType, allowedValues]) => {
                // Check if any of the combination's variant strings match the filter
                return allowedValues.some(value => {
                    const targetString = `${variantType}-${value.toLowerCase()}`;
                    return combo.variantStrings!.includes(targetString);
                });
            });
        });
    }

    /**
     * Get unique variant values from combinations for filter options
     */
    static getUniqueVariantValues(combinations: ProductCombination[]): Record<string, string[]> {
        const uniqueValues: Record<string, Set<string>> = {};

        combinations.forEach(combo => {
            if (combo.variantStrings) {
                combo.variantStrings.forEach(variantString => {
                    const [variantType, value] = variantString.split('-');
                    if (!uniqueValues[variantType]) {
                        uniqueValues[variantType] = new Set();
                    }
                    uniqueValues[variantType].add(value);
                });
            }
        });

        // Convert Sets to arrays
        const result: Record<string, string[]> = {};
        Object.entries(uniqueValues).forEach(([variantType, valuesSet]) => {
            result[variantType] = Array.from(valuesSet).sort();
        });

        return result;
    }

    static calculateVariantPrice(basePrice: number, variantValues: Record<string, string>): number {
        let totalPrice = basePrice;

        Object.entries(variantValues).forEach(([variantId, value]) => {
            const template = this.getVariantTemplateById(variantId);
            if (template?.options) {
                const option = template.options.find(opt => opt.value === value);
                if (option?.additionalPrice) {
                    totalPrice += option.additionalPrice;
                }
            }
        });

        return Math.max(0, totalPrice);
    }

    static generateVariantSKU(baseSKU: string, variantValues: Record<string, string>): string {
        const suffixes: string[] = [];

        Object.entries(variantValues).forEach(([variantId, value]) => {
            const template = this.getVariantTemplateById(variantId);
            if (template) {
                let suffix = '';
                if (variantId.includes('color')) {
                    suffix = value.substring(0, 3).toUpperCase();
                } else if (variantId.includes('size')) {
                    suffix = value.toUpperCase();
                } else if (variantId.includes('storage')) {
                    suffix = value.replace('gb', 'G').replace('tb', 'T').toUpperCase();
                } else if (variantId.includes('ram')) {
                    suffix = value.replace('gb', 'R').toUpperCase();
                } else {
                    suffix = value.substring(0, 3).toUpperCase();
                }
                suffixes.push(suffix);
            }
        });

        return suffixes.length > 0 ? `${baseSKU}-${suffixes.join('-')}` : baseSKU;
    }

    static getVariantDisplayInfo(variantId: string, value: string): {
        displayName: string;
        colorCode?: string;
        additionalPrice?: number;
    } {
        const template = this.getVariantTemplateById(variantId);
        if (!template?.options) {
            return { displayName: value };
        }

        const option = template.options.find(opt => opt.value === value);
        if (!option) {
            return { displayName: value };
        }

        return {
            displayName: option.name || value,
            colorCode: option.colorCode,
            additionalPrice: option.additionalPrice
        };
    }

    private static formatProductTypeName(productType: string): string {
        return productType
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private static getDefaultVariantTemplatesForProductType(
        categoryId: string,
        subcategoryId: string,
        productType: string
    ): string[] {
        // @ts-ignore
        const mapping = this.data.productTypeVariantMapping?.[categoryId]?.[productType];
        return mapping || [];
    }
}

export default EcommerceCatalogUtils;