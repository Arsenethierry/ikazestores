/* eslint-disable @typescript-eslint/no-explicit-any */

import EcommerceCatalogUtils from "./ecommerce-catalog";

export interface VariantValue {
    variantId: string;
    variantName: string;
    value: string;
    label?: string;
    additionalPrice?: number;
    colorCode?: string;
}

export interface EncodedVariantOptions {
    includePrice?: boolean;
    includeName?: boolean;
    separator?: string;
    priceSeparator?: string;
    maxLength?: number;
}

export class VariantStringEncoder {
    private static readonly DEFAULT_SEPARATOR = '/';
    private static readonly DEFAULT_PRICE_SEPARATOR = '_';
    private static readonly PRICE_PREFIX = 'price-';
    private static readonly VALUE_SEPARATOR = '-';

    /**
     * Encode variant combinations into string array format for Appwrite storage
     * @param variantValues Object with variantId as key and value as string
     * @param options Encoding options
     * @returns Array of encoded variant strings
     */
    static encodeVariantsToStringArray(
        variantValues: Record<string, string>,
        options: EncodedVariantOptions = {}
    ): string[] {
        const {
            includePrice = true,
            includeName = false,
            priceSeparator = this.DEFAULT_PRICE_SEPARATOR,
            maxLength = 100
        } = options;

        const encodedVariants: string[] = [];

        Object.entries(variantValues).forEach(([variantId, value]) => {
            const template = EcommerceCatalogUtils.getVariantTemplateById(variantId);
            const displayInfo = EcommerceCatalogUtils.getVariantDisplayInfo(variantId, value);

            if (!template) return;

            let encodedString = '';

            // Add variant type (cleaned)
            const variantType = this.cleanString(variantId);
            
            if (includeName) {
                encodedString += `${variantType}${this.VALUE_SEPARATOR}`;
            }

            // Add value (cleaned)
            const cleanValue = this.cleanString(value);
            encodedString += cleanValue;

            // Add price if applicable and requested
            if (includePrice && displayInfo.additionalPrice && displayInfo.additionalPrice !== 0) {
                const priceString = Math.abs(displayInfo.additionalPrice).toString();
                const pricePrefix = displayInfo.additionalPrice > 0 ? 'plus' : 'minus';
                encodedString += `${priceSeparator}${this.PRICE_PREFIX}${pricePrefix}${priceString}`;
            }

            // Truncate if too long
            if (encodedString.length > maxLength) {
                encodedString = encodedString.substring(0, maxLength);
            }

            encodedVariants.push(encodedString);
        });

        return encodedVariants;
    }

    /**
     * Encode multiple variant combinations for a product with variants
     * @param productCombinations Array of product combinations
     * @param basePrice Base product price
     * @param options Encoding options
     * @returns Array of objects with combination info and encoded strings
     */
    static encodeProductCombinations(
        productCombinations: any[],
        basePrice: number = 0,
        options: EncodedVariantOptions = {}
    ): Array<{
        combinationId: string;
        variantStrings: string[];
        combinationString: string;
        finalPrice: number;
        sku: string;
    }> {
        return productCombinations.map((combination, index) => {
            const variantStrings = this.encodeVariantsToStringArray(
                combination.variantValues,
                options
            );

            // Create a single combination string
            const combinationString = variantStrings.join(options.separator || this.DEFAULT_SEPARATOR);

            return {
                combinationId: combination.id || `combo-${index}`,
                variantStrings,
                combinationString,
                finalPrice: combination.price || basePrice,
                sku: combination.sku || ''
            };
        });
    }

    /**
     * Create search-friendly variant tags
     * @param variantValues Variant values object
     * @returns Array of searchable tags
     */
    static createVariantSearchTags(variantValues: Record<string, string>): string[] {
        const searchTags: string[] = [];

        Object.entries(variantValues).forEach(([variantId, value]) => {
            const template = EcommerceCatalogUtils.getVariantTemplateById(variantId);
            const displayInfo = EcommerceCatalogUtils.getVariantDisplayInfo(variantId, value);

            if (!template) return;

            // Add basic variant tag
            const variantType = this.cleanString(variantId.replace(/-/g, ''));
            const variantValue = this.cleanString(value);
            
            searchTags.push(`${variantType}:${variantValue}`);
            
            // Add display name if different
            if (displayInfo.displayName && displayInfo.displayName !== value) {
                const displayName = this.cleanString(displayInfo.displayName);
                searchTags.push(`${variantType}:${displayName}`);
            }

            // Add type-only tag for filtering
            searchTags.push(`has:${variantType}`);

            // Add price range tags for price-based filtering
            if (displayInfo.additionalPrice && displayInfo.additionalPrice !== 0) {
                const priceRange = this.getPriceRangeTag(displayInfo.additionalPrice);
                if (priceRange) {
                    searchTags.push(`pricemod:${priceRange}`);
                }
            }

            // Add color-specific tags
            if (variantId.includes('color') && displayInfo.colorCode) {
                const colorCategory = this.getColorCategory(displayInfo.colorCode);
                searchTags.push(`colorcat:${colorCategory}`);
            }

            // Add size-specific tags
            if (variantId.includes('size')) {
                const sizeCategory = this.getSizeCategory(value);
                searchTags.push(`sizecat:${sizeCategory}`);
            }
        });

        // Remove duplicates and return
        return [...new Set(searchTags)];
    }

    /**
     * Decode variant strings back to readable format
     * @param variantStrings Array of encoded variant strings
     * @param separator Separator used in encoding
     * @returns Decoded variant information
     */
    static decodeVariantStrings(
        variantStrings: string[],
        separator: string = this.DEFAULT_SEPARATOR
    ): Array<{
        variantType: string;
        value: string;
        hasPrice: boolean;
        priceModifier?: number;
    }> {
        return variantStrings.map(variantString => {
            const parts = variantString.split(separator);
            const result: any = {
                variantType: '',
                value: '',
                hasPrice: false
            };

            if (parts.length > 0) {
                const mainPart = parts[0];
                const pricePart = parts.find(part => part.includes(this.PRICE_PREFIX));

                // Extract variant type and value
                if (mainPart.includes(this.VALUE_SEPARATOR)) {
                    const [type, ...valueParts] = mainPart.split(this.VALUE_SEPARATOR);
                    result.variantType = type;
                    result.value = valueParts.join(this.VALUE_SEPARATOR);
                } else {
                    result.value = mainPart;
                }

                // Extract price if present
                if (pricePart) {
                    result.hasPrice = true;
                    const priceMatch = pricePart.match(/price-(plus|minus)(\d+)/);
                    if (priceMatch) {
                        const multiplier = priceMatch[1] === 'plus' ? 1 : -1;
                        result.priceModifier = parseInt(priceMatch[2]) * multiplier;
                    }
                }
            }

            return result;
        });
    }

    /**
     * Generate SKU-compatible variant suffix
     * @param variantValues Variant values object
     * @returns Short variant suffix for SKU
     */
    static generateVariantSKUSuffix(variantValues: Record<string, string>): string {
        const suffixes: string[] = [];

        Object.entries(variantValues).forEach(([variantId, value]) => {
            let suffix = '';

            if (variantId.includes('color')) {
                suffix = this.cleanString(value).substring(0, 3).toUpperCase();
            } else if (variantId.includes('size')) {
                suffix = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            } else if (variantId.includes('storage')) {
                suffix = value.replace(/gb/gi, 'G').replace(/tb/gi, 'T').toUpperCase();
            } else if (variantId.includes('ram')) {
                suffix = value.replace(/gb/gi, 'R').toUpperCase();
            } else {
                suffix = this.cleanString(value).substring(0, 3).toUpperCase();
            }

            if (suffix) {
                suffixes.push(suffix);
            }
        });

        return suffixes.join('-');
    }

    /**
     * Create filter-friendly variant arrays for database queries
     * @param variantValues Variant values object
     * @returns Object with different filtering arrays
     */
    static createFilterArrays(variantValues: Record<string, string>): {
        exactMatch: string[];
        fuzzyMatch: string[];
        typeMatch: string[];
        priceRange: string[];
    } {
        const exactMatch: string[] = [];
        const fuzzyMatch: string[] = [];
        const typeMatch: string[] = [];
        const priceRange: string[] = [];

        Object.entries(variantValues).forEach(([variantId, value]) => {
            const template = EcommerceCatalogUtils.getVariantTemplateById(variantId);
            const displayInfo = EcommerceCatalogUtils.getVariantDisplayInfo(variantId, value);

            if (!template) return;

            const cleanType = this.cleanString(variantId);
            const cleanValue = this.cleanString(value);

            // Exact match: type-value
            exactMatch.push(`${cleanType}-${cleanValue}`);

            // Fuzzy match: just the value for cross-variant search
            fuzzyMatch.push(cleanValue);

            // Type match: just the variant type
            typeMatch.push(cleanType);

            // Price range
            if (displayInfo.additionalPrice && displayInfo.additionalPrice !== 0) {
                const range = this.getPriceRangeTag(displayInfo.additionalPrice);
                if (range) {
                    priceRange.push(range);
                }
            }
        });

        return {
            exactMatch: [...new Set(exactMatch)],
            fuzzyMatch: [...new Set(fuzzyMatch)],
            typeMatch: [...new Set(typeMatch)],
            priceRange: [...new Set(priceRange)]
        };
    }

    // Helper methods
    static cleanString(str: string): string {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '')
            .replace(/[-_]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    private static getPriceRangeTag(price: number): string {
        const absPrice = Math.abs(price);
        if (absPrice < 10) return 'under10';
        if (absPrice < 25) return '10to25';
        if (absPrice < 50) return '25to50';
        if (absPrice < 100) return '50to100';
        if (absPrice < 250) return '100to250';
        return 'over250';
    }

    private static getColorCategory(colorCode: string): string {
        // Simple color categorization based on hex codes
        if (!colorCode || !colorCode.startsWith('#')) return 'other';
        
        const hex = colorCode.toLowerCase();
        
        // Basic color mapping
        const colorMap: Record<string, string> = {
            '#000000': 'black',
            '#ffffff': 'white',
            '#808080': 'gray',
            '#000080': 'blue',
            '#0000ff': 'blue',
            '#ff0000': 'red',
            '#008000': 'green',
            '#ffff00': 'yellow',
            '#ffa500': 'orange',
            '#800080': 'purple',
            '#ffc0cb': 'pink',
            '#a52a2a': 'brown'
        };

        return colorMap[hex] || 'other';
    }

    private static getSizeCategory(size: string): string {
        const sizeStr = size.toLowerCase();
        
        if (['xs', 'xxs', 'xxxs'].includes(sizeStr)) return 'extrasmall';
        if (['s', 'small'].includes(sizeStr)) return 'small';
        if (['m', 'medium'].includes(sizeStr)) return 'medium';
        if (['l', 'large'].includes(sizeStr)) return 'large';
        if (['xl', 'xxl', 'xxxl', 'xlarge'].includes(sizeStr)) return 'extralarge';
        
        // Numeric sizes
        const numSize = parseInt(sizeStr);
        if (!isNaN(numSize)) {
            if (numSize <= 6) return 'small';
            if (numSize <= 10) return 'medium';
            if (numSize <= 14) return 'large';
            return 'extralarge';
        }
        
        return 'other';
    }
}

// Usage Examples and Helper Functions
export class VariantStringHelper {
    /**
     * Complete encoding for Appwrite storage
     * @param productData Product form data
     * @returns Appwrite-ready variant data
     */
    static prepareForAppwrite(productData: any): {
        hasVariants: boolean;
        variantTypes: string[];
        variantCombinations: Array<{
            id: string;
            variantStrings: string[];
            combinationString: string;
            searchTags: string[];
            filterArrays: any;
            price: number;
            sku: string;
            quantity?: number;
        }>;
        allVariantTags: string[];
    } {
        const result = {
            hasVariants: productData.hasVariants || false,
            variantTypes: [] as string[],
            variantCombinations: [] as any[],
            allVariantTags: [] as string[]
        };

        if (!productData.hasVariants || !productData.productCombinations) {
            return result;
        }

        // Get all variant types
        if (productData.variants) {
            result.variantTypes = productData.variants.map((v: any) => 
                VariantStringEncoder.cleanString(v.id)
            );
        }

        // Process each combination
        productData.productCombinations.forEach((combination: any) => {
            const variantStrings = VariantStringEncoder.encodeVariantsToStringArray(
                combination.variantValues,
                { includePrice: true, includeName: true }
            );

            const searchTags = VariantStringEncoder.createVariantSearchTags(
                combination.variantValues
            );

            const filterArrays = VariantStringEncoder.createFilterArrays(
                combination.variantValues
            );

            const combinationString = variantStrings.join('/');

            result.variantCombinations.push({
                id: combination.id,
                variantStrings,
                combinationString,
                searchTags,
                filterArrays,
                price: combination.price,
                sku: combination.sku,
                quantity: combination.quantity
            });

            // Collect all tags
            result.allVariantTags.push(...searchTags);
        });

        // Remove duplicate tags
        result.allVariantTags = [...new Set(result.allVariantTags)];

        return result;
    }

    /**
     * Generate Appwrite query filters for variant search
     * @param searchCriteria Search criteria
     * @returns Appwrite query conditions
     */
    static generateAppwriteFilters(searchCriteria: {
        variantType?: string;
        variantValue?: string;
        priceRange?: string;
        colorCategory?: string;
        sizeCategory?: string;
    }): string[] {
        const filters: string[] = [];

        if (searchCriteria.variantType) {
            filters.push(`variantTypes.contains("${searchCriteria.variantType}")`);
        }

        if (searchCriteria.variantValue) {
            filters.push(`allVariantTags.contains("${searchCriteria.variantValue}")`);
        }

        if (searchCriteria.priceRange) {
            filters.push(`allVariantTags.contains("pricemod:${searchCriteria.priceRange}")`);
        }

        if (searchCriteria.colorCategory) {
            filters.push(`allVariantTags.contains("colorcat:${searchCriteria.colorCategory}")`);
        }

        if (searchCriteria.sizeCategory) {
            filters.push(`allVariantTags.contains("sizecat:${searchCriteria.sizeCategory}")`);
        }

        return filters;
    }
}

export default VariantStringEncoder;