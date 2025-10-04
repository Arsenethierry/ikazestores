"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreateProductSchema } from "@/lib/schemas/products-schems";
import { Zap, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useAction } from "next-safe-action/hooks";
import z from "zod";
import { toast } from "sonner";
import { getVariantTemplatesForProductType } from "@/lib/actions/original-products-actions";
import { AsyncCategorySelect, AsyncProductTypeSelect, AsyncSubcategorySelect } from "@/features/catalog/async-catalog-select";
import { CatalogVariantOptions } from "@/lib/types/appwrite/appwrite";

type ProductFormData = z.infer<typeof CreateProductSchema>;

interface SelectOption {
    value: string;
    label: string;
    description?: string | null;
}

interface VariantTemplate {
    id: string;
    name: string;
    description: string | null;
    inputType: string;
    isRequired: boolean;
    sortOrder: number;
    variantOptions: CatalogVariantOptions[];
}

interface CategoryStepProps {
    form: UseFormReturn<ProductFormData>;
    currentTag: string;
    setCurrentTag: (tag: string) => void;
    addTag: () => void;
    removeTag: (tag: string) => void;
    onVariantTemplatesLoaded?: (templates: VariantTemplate[]) => void;
    onCategoryNamesChange?: (names: {
        categoryName?: string;
        subcategoryName?: string;
        productTypeName?: string;
    }) => void;
}

export const CategoryStep: React.FC<CategoryStepProps> = ({
    form,
    currentTag,
    setCurrentTag,
    addTag,
    removeTag,
    onVariantTemplatesLoaded,
    onCategoryNamesChange
}) => {
    const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<SelectOption | null>(null);
    const [selectedProductType, setSelectedProductType] = useState<SelectOption | null>(null);
    const [availableVariants, setAvailableVariants] = useState<VariantTemplate[]>([]);
    const [isLoadingVariants, setIsLoadingVariants] = useState(false);

    const { execute: loadVariantTemplates, result } = useAction(getVariantTemplatesForProductType, {
        onSuccess: ({ data }) => {
            setIsLoadingVariants(false);
            if (data?.success && data.data) {
                setAvailableVariants(data.data as VariantTemplate[]);
                onVariantTemplatesLoaded?.(data.data as VariantTemplate[]);
            }
        },
        onError: ({ error }) => {
            setIsLoadingVariants(false);
            toast.error(error.serverError || "Failed to load variant templates");
        },
    });

    useEffect(() => {
        if (selectedProductType?.value) {
            setIsLoadingVariants(true);
            loadVariantTemplates({ productTypeId: selectedProductType.value });
        } else {
            setAvailableVariants([]);
            onVariantTemplatesLoaded?.([]);
        }
    }, [selectedProductType?.value]);

    const handleCategoryChange = (option: SelectOption | null) => {
        setSelectedCategory(option);
        setSelectedSubcategory(null);
        setSelectedProductType(null);
        setAvailableVariants([]);

        form.setValue('categoryId', option?.value || '');
        form.setValue('subcategoryId', '');
        form.setValue('productTypeId', '');
        form.setValue('variants', []);
        form.setValue('productCombinations', []);

        onCategoryNamesChange?.({
            categoryName: option?.label || undefined,
            subcategoryName: selectedSubcategory?.label || undefined,
            productTypeName: selectedProductType?.label || undefined,
        });
    };

    const handleSubcategoryChange = (option: SelectOption | null) => {
        setSelectedSubcategory(option);
        setSelectedProductType(null);
        setAvailableVariants([]);

        form.setValue('subcategoryId', option?.value || '');
        form.setValue('productTypeId', '');
        form.setValue('variants', []);
        form.setValue('productCombinations', []);

        onCategoryNamesChange?.({
            categoryName: selectedCategory?.label || undefined,
            subcategoryName: option?.label || undefined,
            productTypeName: selectedProductType?.label || undefined,
        });
    };

    const handleProductTypeChange = (option: SelectOption | null) => {
        setSelectedProductType(option);
        form.setValue('productTypeId', option?.value || '');
        form.setValue('variants', []);
        form.setValue('productCombinations', []);

        onCategoryNamesChange?.({
            categoryName: selectedCategory?.label || undefined,
            subcategoryName: selectedSubcategory?.label || undefined,
            productTypeName: option?.label || undefined,
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Product Classification</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Select the appropriate category to get intelligent variant suggestions
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category *</FormLabel>
                                    <FormControl>
                                        <AsyncCategorySelect
                                            value={selectedCategory}
                                            onChange={handleCategoryChange}
                                            placeholder="Search categories..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="subcategoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subcategory *</FormLabel>
                                    <FormControl>
                                        <AsyncSubcategorySelect
                                            categoryId={selectedCategory?.value || null}
                                            value={selectedSubcategory}
                                            onChange={handleSubcategoryChange}
                                            placeholder="Search subcategories..."
                                            isDisabled={!selectedCategory}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="productTypeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Type *</FormLabel>
                                    <FormControl>
                                        <AsyncProductTypeSelect
                                            subcategoryId={selectedSubcategory?.value || null}
                                            value={selectedProductType}
                                            onChange={handleProductTypeChange}
                                            placeholder="Search product types..."
                                            isDisabled={!selectedSubcategory}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {isLoadingVariants && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                            <p className="text-sm text-blue-700">Loading variant templates...</p>
                        </div>
                    )}

                    {!isLoadingVariants && selectedProductType && availableVariants.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-blue-600" />
                                <h4 className="text-sm font-medium text-blue-900">
                                    Smart Variant Suggestions Ready
                                </h4>
                            </div>
                            <p className="text-xs text-blue-700 mb-3">
                                {availableVariants.length} relevant variants available for {selectedProductType.label}.
                                Configure them in the next step.
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {availableVariants.slice(0, 6).map((variant) => (
                                    <Badge key={variant.id} variant="secondary" className="text-xs">
                                        {variant.name}
                                        {variant.isRequired && <span className="text-red-500 ml-1">*</span>}
                                    </Badge>
                                ))}
                                {availableVariants.length > 6 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{availableVariants.length - 6} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {!isLoadingVariants && selectedProductType && availableVariants.length === 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-xs text-yellow-700">
                                No variant templates configured for this product type. You can still create the product
                                without variants or contact an admin to configure variant templates.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Product Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            placeholder="Add a tag"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" onClick={addTag}>Add</Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {form.watch('tags')?.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};