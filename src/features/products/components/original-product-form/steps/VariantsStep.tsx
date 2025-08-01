import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VariantConfig } from "@/features/variants management/variant-config";
import { CreateProductSchema } from "@/lib/schemas/products-schems";
import { VariantTemplate } from "@/lib/types/catalog-types";
import { UseFormReturn } from "react-hook-form";
import { ProductCombinations } from "../product-combinations";
import { RefreshCw, AlertCircle, Package, Info, Settings } from "lucide-react";
import { useMemo } from "react";
import z from "zod";

type ProductFormData = z.infer<typeof CreateProductSchema>;

interface VariantsStepProps {
    form: UseFormReturn<ProductFormData>;
    availableVariants: VariantTemplate[];
    generateVariantCombinations: () => void;
}

export const VariantsStep: React.FC<VariantsStepProps> = ({
    form,
    availableVariants,
    generateVariantCombinations
}) => {
    const hasVariants = form.watch('hasVariants');
    const variants = form.watch('variants') || [];

    const nonColorVariants = useMemo(() => {
        return variants.filter((variant: any) => {
            if (!variant) return false;
            const name = variant.name?.toLowerCase() || '';
            const type = variant.type?.toLowerCase() || '';
            const templateId = variant.templateId?.toLowerCase() || '';
            const colorKeywords = ['color', 'colour', 'hue', 'shade', 'tint', 'paint'];
            return !colorKeywords.some(keyword =>
                name.includes(keyword) ||
                type.includes(keyword) ||
                templateId.includes(keyword)
            );
        });
    }, [variants]);

    const hasNonColorVariantsConfigured = nonColorVariants.length > 0;
    const hasValidConfiguration = hasVariants && hasNonColorVariantsConfigured;

    const handleGenerateCombinations = () => {
        if (!hasVariants || !hasNonColorVariantsConfigured) {
            return;
        }
        generateVariantCombinations();
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Catalog Variants Configuration
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Configure product variants like size, storage, material, etc. Color variants are managed in the Images step.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">Enable Catalog Variants</span>
                            </div>
                            <FormField
                                control={form.control}
                                name="hasVariants"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    if (!checked) {
                                                        form.setValue('variants', []);
                                                        form.setValue('productCombinations', []);
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Add variants from catalog templates (e.g., Size, Storage, Material, Weight, etc.)
                        </p>
                        {hasVariants && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                                {nonColorVariants.length} variants configured
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {hasVariants && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Configure Catalog Variants
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Select and configure variants from your catalog templates.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <VariantConfig
                            control={form.control}
                            variantTemplates={availableVariants}
                        />
                    </CardContent>
                </Card>
            )}

            {hasVariants && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Catalog Variants Summary
                    </h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">Catalog Variants</span>
                            <Badge variant="secondary">{nonColorVariants.length}</Badge>
                        </div>
                        {nonColorVariants.length > 0 ? (
                            <ul className="text-sm text-blue-700 ml-6">
                                {nonColorVariants.map((variant: any, index: number) => (
                                    <li key={index}>• {variant.name} ({variant.values?.length || 0} options)</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-blue-600 ml-6">No catalog variants configured yet</p>
                        )}
                    </div>
                </div>
            )}

            {hasValidConfiguration && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                        <p><strong>Variant Processing:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li><strong>Catalog variants</strong> will generate automatic combinations with pricing and inventory</li>
                            <li>Click "Generate Combinations" to create variant combinations for inventory management</li>
                            <li><strong>Color variants</strong> will be managed separately in the Images step</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {hasVariants && hasNonColorVariantsConfigured && (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateCombinations}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Generate Combinations
                    </Button>
                </div>
            )}

            {hasVariants && hasNonColorVariantsConfigured && (
                <ProductCombinations
                    control={form.control}
                    basePrice={form.watch("basePrice") || 0}
                    baseSku={form.watch("sku") || ''}
                    variants={nonColorVariants}
                    onRegenerateAll={handleGenerateCombinations}
                />
            )}

            {!hasVariants && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4">
                                <Package className="h-12 w-12 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="font-medium">No Catalog Variants Configured</h3>
                            <p className="text-sm text-muted-foreground">
                                This product will use the base configuration without catalog variants.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Enable catalog variants above to add product variations like size, material, etc.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {hasVariants && !hasValidConfiguration && (
                <Card>
                    <CardContent className="p-6">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please configure at least one catalog variant option to enable variant combinations.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};