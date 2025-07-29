import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { VariantConfig } from "@/features/variants management/variant-config";
import { CreateProductSchema } from "@/lib/schemas/products-schems";
import { VariantTemplate } from "@/lib/types/catalog-types";
import { UseFormReturn } from "react-hook-form";
import { ProductCombinations } from "../product-combinations";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
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
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>
                        Product Variants Configuration
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Configure product variants like size, color, storage, etc. Each combination will be stored in the product_combinations collection.
                    </p>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="hasVariants"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        This product has variants
                                    </FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Enable to add variants like size, color, storage, etc.
                                    </p>
                                </div>
                            </FormItem>
                        )}
                    />

                    {form.watch('hasVariants') && (
                        <div className="mt-6">
                            <VariantConfig
                                control={form.control}
                                variantTemplates={availableVariants}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {form.watch("hasVariants") && (
                <>
                    <ProductCombinations
                        control={form.control}
                        basePrice={form.watch("basePrice") || 0}
                        baseSku={form.watch("sku") || ''}
                        variants={form.watch("variants")}
                        onRegenerateAll={generateVariantCombinations}
                    />

                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={generateVariantCombinations}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Generate Combinations
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}