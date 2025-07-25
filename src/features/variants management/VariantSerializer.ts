import colorsData from '@/data/products-colors.json';

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
    compareAtPrice?: number;
    quantity?: number;
    weight?: number;
    barcode?: string;
    images?: any[];
    isDefault?: boolean;
}

export class VariantSerializer {
    private static readonly SEPARATOR = '|';
    private static readonly KEY_VALUE_SEPARATOR = ':';
    private static readonly VARIANT_SEPARATOR = ';';

    static serializeVariantValue(variantId: string, variantValue: VariantValue): string {
        const parts = [
            variantId,
            variantValue.value,
            variantValue.label || '',
            (variantValue.additionalPrice || 0).toString(),
            variantValue.colorCode || '',
            (variantValue.isDefault || false).toString()
        ];
        return parts.join(this.KEY_VALUE_SEPARATOR);
    }

    static deserializeVariantValue(serialized: string): { variantId: string; variantValue: VariantValue } {
        const parts = serialized.split(this.KEY_VALUE_SEPARATOR);

        return {
            variantId: parts[0],
            variantValue: {
                value: parts[1],
                label: parts[2] || undefined,
                additionalPrice: parseFloat(parts[3]) || 0,
                colorCode: parts[4] || undefined,
                isDefault: parts[5] === 'true'
            }
        };
    }

    static serializeVariantCombination(variantValues: Record<string, string>, variants: Variant[]): string {
        const serializedValues: string[] = [];

        Object.entries(variantValues).forEach(([variantId, value]) => {
            const variant = variants.find(v => v.id === variantId);
            if (!variant) return;

            const variantValue = variant.values.find(v => v.value === value);
            if (!variantValue) {
                // Create a basic variant value if not found
                const basicValue: VariantValue = {
                    value,
                    label: value,
                    additionalPrice: 0,
                    isDefault: false
                };
                serializedValues.push(this.serializeVariantValue(variantId, basicValue));
            } else {
                serializedValues.push(this.serializeVariantValue(variantId, variantValue));
            }
        });

        return serializedValues.join(this.VARIANT_SEPARATOR);
    }

    static deserializeVariantCombination(serialized: string): Record<string, VariantValue> {
        if (!serialized) return {};

        const result: Record<string, VariantValue> = {};
        const variantParts = serialized.split(this.VARIANT_SEPARATOR);

        variantParts.forEach(part => {
            if (part.trim()) {
                const { variantId, variantValue } = this.deserializeVariantValue(part);
                result[variantId] = variantValue;
            }
        });

        return result;
    }

    static createSimpleVariantString(variantId: string, value: string): string {
        // Remove common prefixes and normalize
        const cleanVariantId = variantId.replace(/^(size|color|material|storage|ram)-?/, '');
        const cleanValue = value.toLowerCase().replace(/[^a-z0-9]/g, '');

        return `${cleanVariantId}-${cleanValue}`;
    }

    static generateVariantStringArray(variantValues: Record<string, string>): string[] {
        return Object.entries(variantValues).map(([variantId, value]) =>
            this.createSimpleVariantString(variantId, value)
        );
    }

    static serializeProductCombinations(combinations: ProductCombination[]): string[] {
        return combinations.map(combo => {
            const data = {
                id: combo.id,
                variantValues: Object.entries(combo.variantValues).map(([k, v]) => `${k}=${v}`).join(','),
                sku: combo.sku,
                price: combo.price,
                compareAtPrice: combo.compareAtPrice || 0,
                quantity: combo.quantity || 0,
                weight: combo.weight || 0,
                barcode: combo.barcode || '',
                isDefault: combo.isDefault || false
            };

            return Object.entries(data).map(([k, v]) => `${k}:${v}`).join(this.SEPARATOR);
        });
    }

    static deserializeProductCombinations(serializedArray: string[]): ProductCombination[] {
        return serializedArray.map(serialized => {
            const parts = serialized.split(this.SEPARATOR);
            const data: any = {};

            parts.forEach(part => {
                const [key, value] = part.split(':');
                data[key] = value;
            });

            // Parse variant values back to object
            const variantValues: Record<string, string> = {};
            if (data.variantValues) {
                data.variantValues.split(',').forEach((pair: string) => {
                    const [k, v] = pair.split('=');
                    if (k && v) variantValues[k] = v;
                });
            }

            return {
                id: data.id,
                variantValues,
                sku: data.sku,
                price: parseFloat(data.price) || 0,
                compareAtPrice: parseFloat(data.compareAtPrice) || undefined,
                quantity: parseInt(data.quantity) || 0,
                weight: parseFloat(data.weight) || undefined,
                barcode: data.barcode || undefined,
                isDefault: data.isDefault === 'true',
                images: [] // Images would be handled separately
            };
        });
    }

    static matchColorByName(colorName: string): { id: number; name: string; hex: string } | null {
        const normalizedName = colorName.toLowerCase().trim();
        return colorsData.find(color =>
            color.name.toLowerCase() === normalizedName ||
            color.hex.toLowerCase() === normalizedName
        ) || null;
    }

    static generateSearchableTags(variantValues: Record<string, string>): string[] {
        const tags: string[] = [];

        Object.entries(variantValues).forEach(([variantId, value]) => {
            tags.push(value.toLowerCase());

            if (variantId.includes('size')) {
                tags.push(`size-${value.toLowerCase()}`);
            } else if (variantId.includes('color')) {
                tags.push(`color-${value.toLowerCase()}`);
                const colorMatch = this.matchColorByName(value);
                if (colorMatch) {
                    tags.push(`hex-${colorMatch.hex.toLowerCase()}`);
                }
            } else if (variantId.includes('material')) {
                tags.push(`material-${value.toLowerCase()}`);
            } else if (variantId.includes('storage')) {
                tags.push(`storage-${value.toLowerCase()}`);
            } else if (variantId.includes('ram')) {
                tags.push(`ram-${value.toLowerCase()}`);
            }
        });

        return [...new Set(tags)];
    }

    static createVariantHash(variantValues: Record<string, string>): string {
        const sortedEntries = Object.entries(variantValues).sort(([a], [b]) => a.localeCompare(b));
        const hashString = sortedEntries.map(([k, v]) => `${k}-${v}`).join('_');

        let hash = 0;
        for (let i = 0; i < hashString.length; i++) {
            const char = hashString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return Math.abs(hash).toString(36);
    }
}

export class VariantDatabaseAdapter {
    static prepareForDatabase(productData: any): any {
        const prepared = { ...productData };

        if (prepared.variants && Array.isArray(prepared.variants)) {
            prepared.variantsSerialized = prepared.variants.map((variant: Variant) =>
                JSON.stringify({
                    id: variant.id,
                    name: variant.name,
                    type: variant.type,
                    required: variant.required,
                    values: variant.values.map(value => VariantSerializer.serializeVariantValue(variant.id, value))
                })
            );
            delete prepared.variants;
        }

    }

    static restoreFromDatabase(databaseData: any): any {
        const restored = { ...databaseData };

        if (restored.variantsSerialized && Array.isArray(restored.variantsSerialized)) {
            restored.variants = restored.variantsSerialized.map((serialized: string) => {
                const variant = JSON.parse(serialized);
                return {
                    ...variant,
                    values: variant.values.map((valueStr: string) =>
                        VariantSerializer.deserializeVariantValue(valueStr).variantValue
                    )
                };
            });
            delete restored.variantsSerialized;
        }

        if (restored.combinationsSerialized && Array.isArray(restored.combinationsSerialized)) {
            restored.productCombinations = VariantSerializer.deserializeProductCombinations(restored.combinationsSerialized);
            delete restored.combinationsSerialized;
        }

        delete restored.variantSearchTags;
        delete restored.variantStrings;

        return restored;
    }

    static createVariantQueries(filters: Record<string, string[]>) {
        const queries: string[] = [];

        Object.entries(filters).forEach(([variantType, values]) => {
            values.forEach(value => {
                // Create query for simple variant strings
                queries.push(`variantStrings.${variantType}-${value.toLowerCase()}`);

                // Create query for search tags
                queries.push(`variantSearchTags.${variantType}-${value.toLowerCase()}`);
            });
        });

        return queries;
    }
}