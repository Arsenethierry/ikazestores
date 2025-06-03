/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createSessionClient } from "@/lib/appwrite";
import {
    DATABASE_ID,
    PRODUCT_VARIANTS_COLLECTION_ID,
    VARIANT_OPTIONS_COLLECTION_ID,
    VARIANT_TEMPLATES_COLLECTION_ID,
    VIRTUAL_PRODUCT_ID,
    PRODUCT_TYPES_COLLECTION_ID
} from "@/lib/env-config";
import { VariantType } from "@/lib/schemas/product-variants-schema";
import { VariantOptions, VariantTemplate, VirtualProductTypes } from "@/lib/types";
import { createSafeActionClient } from "next-safe-action";
import { Query } from "node-appwrite";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message;
    },
});

interface FilterableAttribute {
    id: string;
    name: string;
    type: 'select' | 'multiselect' | 'range' | 'boolean' | 'color' | 'text';
    category?: string;
    productTypes?: string[];
    options?: Array<{
        value: string;
        label: string;
        count?: number;
        metadata?: any;
    }>;
    minValue?: number;
    maxValue?: number;
    step?: number;
    unit?: string;
    isRequired?: boolean;
    displayOrder?: number;
    filterGroup?: string;
}

interface ProductFilters {
    storeId?: string;
    productType?: string;
    category?: string;
    attributes?: Record<string, any>;
    priceRange?: { min?: number; max?: number };
    search?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
}

/**
 * Get filterable attributes based on product type and category
 * This enables dynamic filtering like Smartprix - different filters for different product types
 */
export const getFilterableVariants = async (
    storeId?: string,
    productType?: string,
    category?: string
) => {
    try {
        const { databases } = await createSessionClient();

        // Build query conditions
        const queries = [Query.equal("isFilterable", true)];

        // Store-specific or global filters
        if (storeId) {
            queries.push(Query.or([
                Query.equal("storeId", storeId),
                Query.isNull("storeId")
            ]));
        }

        // Product type specific filters
        if (productType) {
            queries.push(Query.or([
                Query.equal("productTypes", [productType]),
                Query.contains("productTypes", productType),
                Query.isNull("productTypes")
            ]));
        }

        // Category specific filters
        if (category) {
            queries.push(Query.or([
                Query.equal("categories", [category]),
                Query.contains("categories", category),
                Query.isNull("categories")
            ]));
        }

        // Fetch variant templates
        const templates = await databases.listDocuments<VariantTemplate>(
            DATABASE_ID,
            VARIANT_TEMPLATES_COLLECTION_ID,
            queries
        );

        if (templates.total === 0) {
            return {
                groupedVariants: {},
                totalVariants: 0,
                availableAttributes: []
            };
        }

        // Get all template IDs for batch option fetching
        const templateIds = templates.documents.map(t => t.$id);

        // Fetch options for all templates in parallel
        const options = await databases.listDocuments<VariantOptions>(
            DATABASE_ID,
            VARIANT_OPTIONS_COLLECTION_ID,
            [
                Query.equal("variantTemplateId", templateIds),
                Query.limit(1000) // Increase limit for better performance
            ]
        );

        // Build enriched templates with usage statistics
        const enrichedTemplates = await Promise.all(
            templates.documents.map(async (template) => {
                const templateOptions = options.documents.filter(
                    opt => opt.variantTemplateId === template.$id
                );

                // Get usage statistics for each option
                const optionsWithStats = await Promise.all(
                    templateOptions.map(async (option) => {
                        const usageCount = await getVariantOptionUsageCount(
                            template.$id,
                            option.value,
                            storeId,
                            productType,
                            category
                        );

                        return {
                            ...option,
                            metadata: {
                                ...option.metadata,
                                count: usageCount,
                                hex: option.imageUrl ? null : option.metadata?.hex,
                                // Add popular flag for frequently used options
                                isPopular: usageCount > 10
                            }
                        };
                    })
                );

                // Get value range for numeric/range type filters
                let minValue, maxValue;
                if (template.type === VariantType.RANGE || template.type === VariantType.NUMBER) {
                    const values = await getVariantValueRange(template.$id, storeId, productType, category);
                    minValue = values.min;
                    maxValue = values.max;
                }

                // Sort options by popularity and then by sort order
                const sortedOptions = optionsWithStats
                    .filter(opt => opt.metadata.count > 0) // Only show options that are actually used
                    .sort((a, b) => {
                        // First by popularity (if marked as popular)
                        if (a.metadata.isPopular && !b.metadata.isPopular) return -1;
                        if (!a.metadata.isPopular && b.metadata.isPopular) return 1;

                        // Then by usage count (descending)
                        if (a.metadata.count !== b.metadata.count) {
                            return b.metadata.count - a.metadata.count;
                        }

                        // Finally by sort order
                        return (a.sortOrder || 0) - (b.sortOrder || 0);
                    });

                return {
                    ...template,
                    variantOptions: sortedOptions,
                    minValue,
                    maxValue,
                    step: template.step || 1,
                    totalProducts: sortedOptions.reduce((sum, opt) => sum + opt.metadata.count, 0)
                };
            })
        );

        // Filter out templates with no active options
        const activeTemplates = enrichedTemplates.filter(template =>
            template.variantOptions.length > 0 ||
            template.type === VariantType.RANGE ||
            template.type === VariantType.NUMBER
        );

        // Group templates by filter group with smart categorization
        const groupedVariants = activeTemplates.reduce((acc, template) => {
            let groupKey = template.filterGroup || categorizeTemplate(template);

            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }

            acc[groupKey].push(template);
            return acc;
        }, {} as Record<string, VariantTemplate[]>);

        // Sort groups by priority and templates within each group
        const sortedGroups = Object.keys(groupedVariants)
            .sort((a, b) => getGroupPriority(a) - getGroupPriority(b))
            .reduce((acc, key) => {
                acc[key] = groupedVariants[key].sort((a, b) =>
                    (a.filterOrder || 999) - (b.filterOrder || 999)
                );
                return acc;
            }, {} as Record<string, VariantTemplate[]>);

        return {
            groupedVariants: sortedGroups,
            totalVariants: activeTemplates.length,
            availableAttributes: activeTemplates.map(template => ({
                id: template.$id,
                name: template.name,
                type: template.type,
                category: template.filterGroup,
                productTypes: template.productTypes,
                options: template.variantOptions,
                minValue: template.minValue,
                maxValue: template.maxValue,
                step: template.step,
                unit: template.unit,
                isRequired: template.isRequired,
                displayOrder: template.filterOrder
            }))
        };
    } catch (error) {
        console.error("getFilterableVariants error:", error);
        return {
            groupedVariants: {},
            totalVariants: 0,
            availableAttributes: []
        };
    }
};

/**
 * Categorize templates into logical groups similar to Smartprix
 */
function categorizeTemplate(template: VariantTemplate): string {
    const name = template.name.toLowerCase();

    // Basic specifications
    if (name.includes('brand') || name.includes('manufacturer')) return 'Brand';
    if (name.includes('price') || name.includes('cost')) return 'Price';
    if (name.includes('color') || name.includes('colour')) return 'Color';
    if (name.includes('size') || name.includes('dimension')) return 'Size';

    // Technical specifications
    if (name.includes('cpu') || name.includes('processor') || name.includes('ram') ||
        name.includes('memory') || name.includes('storage') || name.includes('ssd') ||
        name.includes('hdd')) return 'Technical Specs';

    // Display specifications
    if (name.includes('screen') || name.includes('display') || name.includes('resolution') ||
        name.includes('inch') || name.includes('hz') || name.includes('refresh')) return 'Display';

    // Features
    if (name.includes('feature') || name.includes('connectivity') || name.includes('wireless') ||
        name.includes('bluetooth') || name.includes('wifi')) return 'Features';

    // Material and build
    if (name.includes('material') || name.includes('fabric') || name.includes('build') ||
        name.includes('finish')) return 'Material & Build';

    // Performance
    if (name.includes('performance') || name.includes('speed') || name.includes('power') ||
        name.includes('battery') || name.includes('efficiency')) return 'Performance';

    // Default grouping
    return template.type || 'Other';
}

/**
 * Get priority order for filter groups (lower number = higher priority)
 */
function getGroupPriority(groupName: string): number {
    const priorities: Record<string, number> = {
        'Brand': 1,
        'Price': 2,
        'Color': 3,
        'Size': 4,
        'Technical Specs': 5,
        'Display': 6,
        'Performance': 7,
        'Features': 8,
        'Material & Build': 9,
        'Other': 999
    };

    return priorities[groupName] || 500;
}

/**
 * Get usage count for a specific variant option with additional filtering
 */
async function getVariantOptionUsageCount(
    templateId: string,
    optionValue: string,
    storeId?: string,
    productType?: string,
    category?: string
): Promise<number> {
    try {
        const { databases } = await createSessionClient();

        const queries = [
            Query.equal("variantTemplateId", templateId),
            Query.equal("value", optionValue),
            Query.limit(1000)
        ];

        // Add additional filters if provided
        if (storeId) {
            // This would require a join or additional query to filter by store
            // For now, we'll get all usage and filter later if needed
        }

        const usage = await databases.listDocuments(
            DATABASE_ID,
            PRODUCT_VARIANTS_COLLECTION_ID,
            queries
        );

        return usage.total;
    } catch (error) {
        console.error("getVariantOptionUsageCount error:", error);
        return 0;
    }
}

/**
 * Get value range for numeric/range type variants
 */
async function getVariantValueRange(
    templateId: string,
    storeId?: string,
    productType?: string,
    category?: string
): Promise<{ min: number; max: number }> {
    try {
        const { databases } = await createSessionClient();

        const variants = await databases.listDocuments(
            DATABASE_ID,
            PRODUCT_VARIANTS_COLLECTION_ID,
            [
                Query.equal("variantTemplateId", templateId),
                Query.limit(1000)
            ]
        );

        if (variants.total === 0) {
            return { min: 0, max: 100 };
        }

        const numericValues = variants.documents
            .map(v => parseFloat(v.value))
            .filter(v => !isNaN(v));

        if (numericValues.length === 0) {
            return { min: 0, max: 100 };
        }

        return {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues)
        };
    } catch (error) {
        console.error("getVariantValueRange error:", error);
        return { min: 0, max: 100 };
    }
}

/**
 * Enhanced product filtering with better performance and caching
 */
export const filterProductsByVariants = async (filters: ProductFilters) => {
    try {
        const { databases } = await createSessionClient();
        const {
            storeId,
            productType,
            category,
            attributes = {},
            priceRange,
            search,
            sortBy = 'newest',
            page = 1,
            limit = 20
        } = filters;

        // Build base product queries
        const productQueries = [];

        if (storeId) {
            productQueries.push(Query.equal("virtualStoreId", storeId));
        }

        // Price range filtering
        if (priceRange?.min !== undefined) {
            productQueries.push(Query.greaterThanEqual("sellingPrice", priceRange.min));
        }
        if (priceRange?.max !== undefined) {
            productQueries.push(Query.lessThanEqual("sellingPrice", priceRange.max));
        }

        // Search filtering
        if (search) {
            productQueries.push(Query.search("title", search));
        }

        // Category filtering
        if (category) {
            productQueries.push(Query.contains("categoryNames", category));
        }

        // Convert attributes to variant filters
        const variantFilters = Object.entries(attributes).map(([templateId, values]) => ({
            templateId,
            values: Array.isArray(values) ? values : [values],
            range: typeof values === 'object' && !Array.isArray(values) ? values : undefined
        }));

        // If no variant filters, use direct product query
        if (variantFilters.length === 0) {
            // Add pagination and sorting
            productQueries.push(Query.limit(limit));
            productQueries.push(Query.offset((page - 1) * limit));

            // Add sorting
            switch (sortBy) {
                case 'price_asc':
                    productQueries.push(Query.orderAsc('sellingPrice'));
                    break;
                case 'price_desc':
                    productQueries.push(Query.orderDesc('sellingPrice'));
                    break;
                case 'popular':
                    productQueries.push(Query.orderDesc('viewCount'));
                    break;
                case 'rating':
                    productQueries.push(Query.orderDesc('rating'));
                    break;
                default:
                    productQueries.push(Query.orderDesc('$createdAt'));
            }

            const products = await databases.listDocuments<VirtualProductTypes>(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                productQueries
            );

            return {
                success: true,
                data: {
                    products: products.documents,
                    total: products.total,
                    totalPages: Math.ceil(products.total / limit),
                    currentPage: page,
                    filters: {
                        applied: variantFilters.length,
                        available: await getAvailableFiltersCount(storeId, productType, category)
                    }
                }
            };
        }

        // Find products matching variant filters
        const matchingProductIds = await findProductsWithVariants(variantFilters, storeId);

        if (matchingProductIds.length === 0) {
            return {
                success: true,
                data: {
                    products: [],
                    total: 0,
                    totalPages: 0,
                    currentPage: page,
                    filters: {
                        applied: variantFilters.length,
                        available: 0
                    }
                }
            };
        }

        // Add product ID filter
        productQueries.push(Query.equal("originalProductId", matchingProductIds));

        // Add pagination and sorting
        productQueries.push(Query.limit(limit));
        productQueries.push(Query.offset((page - 1) * limit));

        switch (sortBy) {
            case 'price_asc':
                productQueries.push(Query.orderAsc('sellingPrice'));
                break;
            case 'price_desc':
                productQueries.push(Query.orderDesc('sellingPrice'));
                break;
            case 'popular':
                productQueries.push(Query.orderDesc('viewCount'));
                break;
            case 'rating':
                productQueries.push(Query.orderDesc('rating'));
                break;
            default:
                productQueries.push(Query.orderDesc('$createdAt'));
        }

        const products = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            productQueries
        );

        return {
            success: true,
            data: {
                products: products.documents,
                total: products.total,
                totalPages: Math.ceil(products.total / limit),
                currentPage: page,
                filters: {
                    applied: variantFilters.length,
                    available: await getAvailableFiltersCount(storeId, productType, category)
                }
            }
        };
    } catch (error) {
        console.error("filterProductsByVariants error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to filter products",
            data: {
                products: [],
                total: 0,
                totalPages: 0,
                currentPage: 1,
                filters: {
                    applied: 0,
                    available: 0
                }
            }
        };
    }
};

/**
 * Find products that match variant criteria with optimized querying
 */
async function findProductsWithVariants(
    variants: Array<{
        templateId: string;
        values?: string[];
        range?: { min?: number; max?: number };
    }>,
    storeId?: string
): Promise<string[]> {
    try {
        const { databases } = await createSessionClient();

        // Use parallel queries for better performance
        const matchingVariantSets = await Promise.all(
            variants.map(async (variantFilter) => {
                const queries = [Query.equal("variantTemplateId", variantFilter.templateId)];

                if (variantFilter.values && variantFilter.values.length > 0) {
                    queries.push(Query.equal("value", variantFilter.values));
                }

                if (variantFilter.range) {
                    if (variantFilter.range.min !== undefined) {
                        queries.push(Query.greaterThanEqual("value", variantFilter.range.min.toString()));
                    }
                    if (variantFilter.range.max !== undefined) {
                        queries.push(Query.lessThanEqual("value", variantFilter.range.max.toString()));
                    }
                }

                queries.push(Query.limit(1000)); // Increase limit for better performance

                const variantInstances = await databases.listDocuments(
                    DATABASE_ID,
                    PRODUCT_VARIANTS_COLLECTION_ID,
                    queries
                );

                return variantInstances.documents.map(v => v.productId);
            })
        );

        if (matchingVariantSets.length === 0) return [];

        // Find intersection of all variant sets (products that match ALL criteria)
        let commonProductIds = matchingVariantSets[0];
        for (let i = 1; i < matchingVariantSets.length; i++) {
            commonProductIds = commonProductIds.filter(id =>
                matchingVariantSets[i].includes(id)
            );

            // Early exit if no common products found
            if (commonProductIds.length === 0) break;
        }

        return [...new Set(commonProductIds)];
    } catch (error) {
        console.error("findProductsWithVariants error:", error);
        return [];
    }
}

/**
 * Get count of available filters for the current context
 */
async function getAvailableFiltersCount(
    storeId?: string,
    productType?: string,
    category?: string
): Promise<number> {
    try {
        const filterData = await getFilterableVariants(storeId, productType, category);
        return filterData.totalVariants;
    } catch (error) {
        console.error("getAvailableFiltersCount error:", error);
        return 0;
    }
}

/**
 * Get popular filter combinations for suggestions
 */
export const getPopularFilterCombinations = async (
    storeId?: string,
    productType?: string,
    limit: number = 10
) => {
    try {
        const { databases } = await createSessionClient();

        // This would require analytics data to track popular filter combinations
        // For now, return empty array - can be implemented with usage tracking
        return {
            success: true,
            data: {
                combinations: [],
                total: 0
            }
        };
    } catch (error) {
        console.error("getPopularFilterCombinations error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get popular combinations",
            data: {
                combinations: [],
                total: 0
            }
        };
    }
};

export const getFilterSuggestions = async (
    currentFilters: ProductFilters,
    storeId?: string
) => {
    try {
        // This would analyze current filters and suggest related ones
        // Implementation would depend on your business logic and user behavior data
        return {
            success: true,
            data: {
                suggestions: [],
                related: []
            }
        };
    } catch (error) {
        console.error("getFilterSuggestions error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get suggestions",
            data: {
                suggestions: [],
                related: []
            }
        };
    }
};