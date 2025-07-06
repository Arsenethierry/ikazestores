import { catalogData } from "@/data/catalog-data";
import { ProductCombination } from "@/lib/schemas/product-variants-schema";
import { Category, ProductType, ProductVariant, Subcategory, VariantOption, VariantTemplate } from "@/lib/types/catalog-types";

export function getCategories(): Category[] {
    return catalogData.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        subcategories: cat.subcategories?.map(sub => ({
            id: sub.id,
            name: sub.name,
            productTypes: sub.productTypes || []
        }))
    }));
}

export function getCategoryById(categoryId: string): Category | null {
    const category = catalogData.categories.find(cat => cat.id === categoryId);
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
};

export function getSubcategoryById(categoryId: string, subcategoryId: string): Subcategory | null {
    const category = getCategoryById(categoryId);
    if (!category?.subcategories) return null;
    return category.subcategories.find(sub => sub.id === subcategoryId) || null;
};

export function getProductTypes(): ProductType[] {
    const productTypes: ProductType[] = [];

    catalogData.categories.forEach(category => {
        category.subcategories?.forEach(subcategory => {
            subcategory.productTypes.forEach(productType => {
                const productTypeId = `${category.id}-${subcategory.id}-${productType}`;
                productTypes.push({
                    id: productTypeId,
                    name: formatProductTypeName(productType),
                    description: `${subcategory.name} product type`,
                    categoryId: category.id,
                    defaultVariantTemplates: getDefaultVariantTemplatesForProductType(
                        category.id,
                        productType
                    )
                })
            })
        })
    });

    return productTypes;
};

export function getProductTypesByCategory(categoryId: string): ProductType[] {
    return getProductTypes().filter((type: ProductType) => type.categoryId === categoryId);
}

export function getProductTypeById(productTypeId: string): ProductType | null {
    return getProductTypes().find((type: ProductType) => type.id === productTypeId) || null;
}

export function getVariantTemplates(): VariantTemplate[] {
    return Object.values(catalogData.variantTemplates).map((template) => {
        let group: string | undefined;
        for (const [groupName, variantIds] of Object.entries(catalogData.variantDisplayGroups)) {
            if (variantIds.includes(template.id)) {
                group = groupName
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                break;
            }
        }
        if (!group) {
            for (const [categoryName, variantIds] of Object.entries(catalogData.variantCategories)) {
                if (variantIds.includes(template.id)) {
                    group = categoryName
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    break;
                }
            }
        }
        group = group || 'Other';

        let type: 'text' | 'color' | 'range' | 'number' | 'select';
        switch (template.inputType) {
            case 'color':
                type = 'color';
                break;
            case 'text':
                type = 'text';
                break;
            case 'boolean':
            case 'select':
            case 'multiselect':
                type = 'select';
                break;
            default:
                const isNumerical = template.options?.every(opt => !isNaN(Number(opt.value)));
                type = isNumerical ? 'range' : 'select';
        }

        let minValue: number | undefined;
        let maxValue: number | undefined;
        let step: number | undefined;
        let unit: string | undefined;

        if (type === 'range') {
            const values = template.options
                ?.map(opt => Number(opt.value))
                .filter(val => !isNaN(val))
                .sort((a, b) => a - b);
            if (values?.length) {
                minValue = values[0];
                maxValue = values[values.length - 1];

                const diffs = values
                    .slice(1)
                    .map((val, i) => val - values[i])
                    .filter(diff => diff > 0);
                step = diffs.length ? Math.min(...diffs) : 1;
            }
            if (template.id.includes('spf')) {
                unit = 'SPF';
            } else if (template.id.includes('volume')) {
                unit = 'ml';
            } else if (template.id.includes('battery')) {
                unit = 'hours';
            } else if (template.id.includes('weight')) {
                unit = 'lbs';
            }
        }

        const categoryIds: string[] = [];
        const productTypeIds: string[] = [];
        const subcategoryIds: string[] = [];
        Object.entries(catalogData.productTypeVariantMapping).forEach(([categoryId, mappings]) => {
            Object.entries(mappings).forEach(([productType, variantIds]) => {
                if (variantIds.includes(template.id)) {
                    categoryIds.push(categoryId);
                    productTypeIds.push(`${categoryId}-${productType}`);
                    const parts = productType.split('-');
                    if (parts.length > 1) {
                        subcategoryIds.push(`${categoryId}-${parts[0]}`);
                    }
                }
            });
        });

        return {
            id: template.id,
            name: template.name,
            description: template.description,
            inputType: type,
            isRequired: template.isRequired,
            categoryIds: categoryIds.length ? categoryIds : undefined,
            productTypeIds: productTypeIds.length ? productTypeIds : undefined,
            subcategoryIds: subcategoryIds.length ? subcategoryIds : undefined,
            variantOptions: template.options?.map((option) => ({
                value: option.value,
                label: option.name || option.value,
                additionalPrice: option.additionalPrice,
                colorCode: 'colorCode' in option ? option.colorCode : undefined,
                metadata: { count: 0 },
            })) || [],
            minValue,
            maxValue,
            step,
            unit,
            group,
        };
    })
};

export function getProductTypesBySubcategory(categoryId: string, subcategoryId: string): ProductType[] {
    const subcategory = getSubcategoryById(categoryId, subcategoryId);
    if (!subcategory) return [];

    const productTypes: ProductType[] = [];
    subcategory.productTypes.forEach(productType => {
        const productTypeId = `${categoryId}-${subcategoryId}-${productType}`;
        productTypes.push({
            id: productTypeId,
            name: formatProductTypeName(productType),
            description: `${subcategory.name} product type`,
            categoryId: categoryId,
            subcategoryId: subcategoryId,
            defaultVariantTemplates: getDefaultVariantTemplatesForProductType(
                categoryId,
                productType
            )
        });
    });

    return productTypes;
};

export function getVariantTemplatesForProductType(productTypeId: string): VariantTemplate[] {
    const parts = productTypeId.split('-');
    if (parts.length < 3) {
        console.warn(`Invalid productTypeId format: ${productTypeId}`);
        return [];
    }
    const categoryId = parts[0];
    const subcategoryId = parts[1];
    const actualProductType = parts.slice(2).join('-');

    const productType = getProductTypeById(productTypeId);
    if (!productType) {
        console.warn(`Product type not found: ${productTypeId}`);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const mapping = catalogData.productTypeVariantMapping?.[categoryId as keyof typeof catalogData.productTypeVariantMapping]?.[actualProductType] || [];
    return getVariantTemplates().filter(template => {
        if (mapping.includes(template.id)) {
            return true;
        }

        const matchesCategory = template.categoryIds?.includes(categoryId) ?? false;
        const matchesSubcategory = template.subcategoryIds?.includes(`${categoryId}-${subcategoryId}`) ?? false;
        const matchesProductType = template.productTypeIds?.includes(productTypeId) ?? false;

        return (matchesCategory || matchesSubcategory || matchesProductType) && mapping.length === 0;
    });
}

export function getRecommendedVariantTemplates(productTypeId: string): VariantTemplate[] {
    const templates = getVariantTemplatesForProductType(productTypeId);
    return templates.sort((a, b) => {
        if (a.isRequired && !b.isRequired) return -1;
        if (!a.isRequired && b.isRequired) return 1;

        const commonVariants = ['color', 'size', 'material', 'storage', 'ram', 'condition'];
        const aIsCommon = commonVariants.some(variant => a.id.includes(variant));
        const bIsCommon = commonVariants.some(variant => b.id.includes(variant));

        if (aIsCommon && !bIsCommon) return -1;
        if (!aIsCommon && bIsCommon) return 1;

        return a.name.localeCompare(b.name);
    })
}

export function getVariantTemplateById(templateId: string): VariantTemplate | null {
    return getVariantTemplates().find(template => template.id === templateId) || null;
};

export function createVariantString(variantId: string, value: string): string {
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
        variantType = variantId.split('-')[0] || 'variant';
    }

    const cleanValue = value.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '');

    return `${variantType}-${cleanValue}`;
};

export function generateVariantStrings(variantValues: Record<string, string>): string[] {
    return Object.entries(variantValues).map(([variantId, value]) =>
        createVariantString(variantId, value)
    );
}

export function generateCombinationsWithStrings(
    variants: ProductVariant[],
    basePrice: number,
    baseSku: string
): ProductCombination[] {
    const combinations: ProductCombination[] = [];

    if (variants.length === 0) {
        return combinations;
    }

    const variantValues: VariantOption[][] = variants
        .filter((v) => !!v && v.values.length > 0)
        .map(v => v.values);

    if (variantValues.length === 0) {
        return combinations;
    }

    function cartesianProduct(arrays: VariantOption[][]): VariantOption[][] {
        return arrays.reduce<VariantOption[][]>(
            (acc, curr) => {
                const result: VariantOption[][] = [];
                acc.forEach(a => {
                    curr.forEach(b => {
                        result.push([...a, b]);
                    });
                });
                return result;
            },
            [[]]
        );
    }

    const products = cartesianProduct(variantValues);

    products.forEach((combination, index) => {
        const variantValuesMap: Record<string, string> = {};
        combination.forEach((value, variantIndex) => {
            variantValuesMap[variants[variantIndex].templateId] = value.value;
        });

        const calculatedPrice = calculateVariantPrice(basePrice, variantValuesMap);
        const generatedSKU = generateVariantSKU(baseSku, variantValuesMap);

        const combinationData: ProductCombination = {
            id: `combination-${index}`,
            variantValues: variantValuesMap,
            sku: generatedSKU,
            price: calculatedPrice,
            quantity: 0,
            isDefault: index === 0,
            variantStrings: generateVariantStrings(variantValuesMap),
        };

        combinations.push(combinationData);
    });

    return combinations;
}

export function filterCombinations(
    combinations: ProductCombination[],
    filters: Record<string, string[]>
): ProductCombination[] {
    return combinations.filter(combo => {
        if (!combo.variantStrings) return false;

        return Object.entries(filters).every(([variantType, allowedValues]) => {
            return allowedValues.some(value => {
                const targetString = `${variantType}-${value.toLowerCase()}`;
                return combo.variantStrings!.includes(targetString);
            });
        });
    });
}

export function getUniqueVariantValues(combinations: ProductCombination[]): Record<string, string[]> {
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

    const result: Record<string, string[]> = {};
    Object.entries(uniqueValues).forEach(([variantType, valuesSet]) => {
        result[variantType] = Array.from(valuesSet).sort();
    });

    return result;
}

export function generateVariantSKU(baseSKU: string, variantValues: Record<string, string>): string {
    const suffixes: string[] = [];

    Object.entries(variantValues).forEach(([variantId, value]) => {
        const template = getVariantTemplateById(variantId);
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

export function calculateVariantPrice(basePrice: number, variantValues: Record<string, string>): number {
    let totalPrice = basePrice;

    Object.entries(variantValues).forEach(([variantId, value]) => {
        const template = getVariantTemplateById(variantId);
        if (template?.variantOptions) {
            const option = template.variantOptions.find((opt) => opt.value === value);
            if (option?.additionalPrice) {
                totalPrice += option.additionalPrice;
            }
        }
    });

    return Math.max(0, totalPrice);
}

function formatProductTypeName(productType: string): string {
    return productType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getDefaultVariantTemplatesForProductType(
    categoryId: string,
    productType: string
): string[] {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const mapping = catalogData.productTypeVariantMapping?.[categoryId]?.[productType];
    return mapping || [];
}