/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductSchema } from "@/lib/schemas/products-schems";
import { CategoryTypes, PhysicalStoreTypes, ProductType, VariantTemplate, VariantOptions } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertCircle,
    ChevronRight,
    DollarSign,
    Eye,
    EyeOff,
    Globe,
    Info,
    Package,
    Save,
    Store,
    Trash2,
    Wand2,
    Copy,
    Settings,
    Box,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createNewProduct, generateVariantCombinations } from "../actions/original-products-actions";
import Image from "next/image";
import { useAction } from "next-safe-action/hooks";
import { VariantCombinationSchema } from "@/lib/schemas/product-variants-schema";

interface ProductFormProps {
    storeData: PhysicalStoreTypes;
    categoriesData: {
        categories: CategoryTypes[];
        error?: string;
    };
    productTypes: ProductType[];
    variantTemplates: VariantTemplate[];
}

export const ProductForm = ({
    storeData,
    categoriesData,
    productTypes,
    variantTemplates,
}: ProductFormProps) => {
    const [currentTab, setCurrentTab] = useState("basic");
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({});
    const [variantCombinations, setVariantCombinations] = useState<z.infer<typeof VariantCombinationSchema>[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [autoGenerateCombinations, setAutoGenerateCombinations] = useState(true);
    const [isGeneratingCombinations, setIsGeneratingCombinations] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const form = useForm<z.infer<typeof ProductSchema>>({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            title: "",
            description: "",
            categoryId: "",
            productTypeId: "",
            basePrice: 0,
            trackInventory: false,
            images: [],
            selectedVariantTemplates: [],
            variantSelections: {},
            storeId: storeData.$id,
            storeLat: storeData.latitude,
            storeLong: storeData.longitude,
            storeOriginCountry: storeData.country,
            isActive: true,
            featured: false,
            tags: [],
            shippingRequired: true,
            minOrderQuantity: 1,
            variantCombinations: [],
        },
    });

    const selectedCategoryId = form.watch("categoryId");
    const selectedProductTypeId = form.watch("productTypeId");
    const basePrice = form.watch("basePrice");
    const compareAtPrice = form.watch("compareAtPrice");
    const trackInventory = form.watch("trackInventory");
    const watchedImages = form.watch("images");

    // Check if variants are enabled based on selected variant templates
    const hasVariants = useMemo(() => {
        return Object.keys(selectedVariants).length > 0;
    }, [selectedVariants]);

    // Available categories filtered by accessibility settings
    const availableCategories = useMemo(() => {
        if (!categoriesData.categories) return [];
        return categoriesData.categories;
    }, [categoriesData.categories]);

    // Filtered product types based on selected category
    const filteredProductTypes = useMemo(() => {
        if (!selectedCategoryId) return [];
        return productTypes.filter(type => type.categoryId === selectedCategoryId);
    }, [selectedCategoryId, productTypes]);

    const applicableVariantTemplates = useMemo(() => {
        if (!selectedProductTypeId) return [];

        const productType = productTypes.find(type => type.$id === selectedProductTypeId);
        if (!productType) return [];

        return variantTemplates.filter(template => {
            // Check if template is applicable to this category
            const matchesCategory = !template.categoryIds?.length ||
                template.categoryIds.includes(selectedCategoryId);

            // Check if template is applicable to this product type
            const matchesProductType = !template.productTypeIds?.length ||
                template.productTypeIds.includes(selectedProductTypeId);

            // Check if it's a default template for this product type
            const isDefault = productType.defaultVariantTemplates?.includes(template.$id);

            return matchesCategory || matchesProductType || isDefault;
        });
    }, [selectedProductTypeId, selectedCategoryId, productTypes, variantTemplates]);

    // Calculate savings percentage
    const savingsPercentage = useMemo(() => {
        if (!compareAtPrice || !basePrice || compareAtPrice <= basePrice) return 0;
        return Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100);
    }, [basePrice, compareAtPrice]);

    // Handle image preview
    useEffect(() => {
        if (watchedImages && watchedImages.length > 0) {
            const urls = Array.from(watchedImages).map(file => URL.createObjectURL(file));
            setPreviewImages(urls);

            return () => {
                urls.forEach(url => URL.revokeObjectURL(url));
            };
        } else {
            setPreviewImages([]);
        }
    }, [watchedImages]);

    // Reset variant state when category changes
    useEffect(() => {
        if (selectedCategoryId) {
            form.setValue("productTypeId", "");
            setSelectedVariants({});
            setVariantCombinations([]);
        }
    }, [selectedCategoryId, form]);

    // Reset variant state when product type changes
    
    useEffect(() => {
        setSelectedVariants({});
        setVariantCombinations([]);
        form.setValue("variantSelections", {});
    }, [selectedProductTypeId, form]);

    // Auto-generate combinations when variants change
    useEffect(() => {
        if (autoGenerateCombinations && hasVariants && Object.keys(selectedVariants).length > 0) {
            handleGenerateCombinations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVariants, autoGenerateCombinations]);

    const handleVariantSelection = useCallback((templateId: string, optionValue: string, selected: boolean) => {
        setSelectedVariants(prev => {
            const template = applicableVariantTemplates.find(t => t.$id === templateId);
            const isMultiSelect = template?.inputType === 'multiselect';

            let newState;
            if (isMultiSelect) {
                const current = prev[templateId] || [];
                if (selected) {
                    newState = { ...prev, [templateId]: [...current, optionValue] };
                } else {
                    newState = { ...prev, [templateId]: current.filter(v => v !== optionValue) };
                }
            } else {
                if (selected) {
                    newState = { ...prev, [templateId]: [optionValue] };
                } else {
                    newState = { ...prev };
                    delete newState[templateId];
                }
            }

            // Update form data immediately
            form.setValue("variantSelections", newState);
            return newState;
        });
    }, [applicableVariantTemplates, form]);

    const handleGenerateCombinations = useCallback(async () => {
        if (!hasVariants || Object.keys(selectedVariants).length === 0) {
            setVariantCombinations([]);
            return;
        }

        setIsGeneratingCombinations(true);
        try {
            const variantInstances = Object.entries(selectedVariants).map(([templateId, selectedOptions]) => ({
                variantTemplateId: templateId,
                selectedOptions,
                isEnabled: true
            }));

            const result = await generateVariantCombinations({
                variantInstances,
                basePrice,
                trackInventory,
                autoGenerateSKU: true,
                skuPrefix: form.getValues("title").slice(0, 3).toUpperCase()
            });

            if (result?.combinations) {
                setVariantCombinations(result.combinations);
            } else if (result?.serverError) {
                toast.error(result.serverError);
            }
        } catch (error) {
            console.error("Error generating combinations:", error);
            toast.error("Failed to generate variant combinations");
        } finally {
            setIsGeneratingCombinations(false);
        }
    }, [hasVariants, selectedVariants, basePrice, trackInventory, form]);

    const updateCombination = useCallback((id: string, updates: Partial<z.infer<typeof VariantCombinationSchema>>) => {
        setVariantCombinations(prev => {
            return prev.map(combo => combo.id === id ? { ...combo, ...updates } : combo);
        });
    }, []);

    const deleteCombination = useCallback((id: string) => {
        setVariantCombinations(prev => {
            return prev.filter(combo => combo.id !== id);
        });
    }, []);

    const duplicateCombination = useCallback((combination: z.infer<typeof VariantCombinationSchema>) => {
        const newCombination = {
            ...combination,
            id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sku: `${combination.sku}-COPY`,
            isActive: false
        };

        setVariantCombinations(prev => {
            return [...prev, newCombination];
        });
    }, []);

    const canProceedToVariants = () => {
        const basicFields = ["title", "description", "categoryId", "productTypeId"];
        return basicFields.every(field => {
            const value = form.getValues(field as any);
            return value && value.length > 0;
        }) && basePrice > 0;
    };

    const { execute: createProductAction, isPending: isSubmitting } = useAction(createNewProduct, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success(data.success)
            } else if (data?.serverError) {
                toast.error(data.serverError)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const onSubmit = async (values: z.infer<typeof ProductSchema>) => {
        try {
            const finalVariantSelections = hasVariants ? selectedVariants : {};

            const finalData = {
                ...values,
                hasVariants: selectedVariants && Object.keys(selectedVariants).length > 0,
                variantSelections: finalVariantSelections,
                variantCombinations
            };

            await createProductAction(finalData);
        } catch (error) {
            console.error("Error creating product:", error);
            toast.error("Failed to create product");
        }
    };

    const renderCategoryOption = (category: CategoryTypes, depth = 0) => {

        return (
            <React.Fragment key={category.$id}>
                <SelectItem value={category.$id}>
                    <div className="flex items-center gap-2">
                        <span style={{ marginLeft: `${depth * 12}px` }}>
                            {category.categoryName}
                        </span>
                    </div>
                </SelectItem>
                {category.children?.map((child: any) => renderCategoryOption(child, depth + 1))}
            </React.Fragment>
        );
    };

    const renderVariantControl = (template: VariantTemplate) => {
        const selectedValues = selectedVariants[template.$id] || [];

        switch (template.inputType) {
            case 'select':
            case 'multiselect':
                return (
                    <div className="space-y-2">
                        {template.options?.map((option: VariantOptions) => (
                            <label key={option.value} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={selectedValues.includes(option.value)}
                                        onCheckedChange={(checked) =>
                                            handleVariantSelection(template.$id, option.value, !!checked)
                                        }
                                    />
                                    <span className="font-medium">{option.name || option.value}</span>
                                    {option.additionalPrice > 0 && (
                                        <Badge variant="outline">+${option.additionalPrice}</Badge>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                );

            case 'color':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {template.options?.map((option: VariantOptions) => (
                            <label key={option.value} className="relative cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(option.value)}
                                    onChange={(e) =>
                                        handleVariantSelection(template.$id, option.value, e.target.checked)
                                    }
                                    className="sr-only"
                                />
                                <div className={`p-3 border-2 rounded-lg text-center transition-all ${selectedValues.includes(option.value)
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                    <div
                                        className="w-8 h-8 rounded-full mx-auto mb-2 border"
                                        style={{ backgroundColor: option.colorCode || '#ccc' }}
                                    />
                                    <span className="text-sm font-medium">{option.name}</span>
                                    {option.additionalPrice > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            +${option.additionalPrice}
                                        </div>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                );

            case 'boolean':
                return (
                    <Switch
                        checked={selectedValues.length > 0}
                        onCheckedChange={(checked) =>
                            handleVariantSelection(template.$id, 'true', checked)
                        }
                    />
                );

            default:
                return (
                    <Input
                        placeholder={`Enter ${template.name.toLowerCase()}...`}
                        onChange={(e) => {
                            if (e.target.value) {
                                handleVariantSelection(template.$id, e.target.value, true);
                            } else {
                                setSelectedVariants(prev => {
                                    const newState = { ...prev };
                                    delete newState[template.$id];
                                    return newState;
                                });
                            }
                        }}
                    />
                );
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Create New Product for {storeData.storeName}
                    </CardTitle>
                    <CardDescription>
                        Add a new product with flexible variants and pricing options
                    </CardDescription>

                    <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                {showAdvanced ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                                {showAdvanced ? "Hide" : "Show"} Advanced Options
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <Card>
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Basic Information</TabsTrigger>
                            <TabsTrigger value="variants" disabled={!canProceedToVariants()}>
                                Properties ({applicableVariantTemplates.length})
                            </TabsTrigger>
                            <TabsTrigger value="combinations" disabled={variantCombinations.length === 0}>
                                Combinations ({variantCombinations.length})
                            </TabsTrigger>
                            <TabsTrigger value="advanced" className={showAdvanced ? "" : "hidden"}>
                                Advanced & SEO
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <TabsContent value="basic" className="space-y-6">
                                    {/* Product Title */}
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product Title *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., iPhone 15 Pro Max" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Keep it clear and descriptive for better search results
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Category and Product Type */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="categoryId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select category" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {availableCategories.map(category => renderCategoryOption(category))}
                                                        </SelectContent>
                                                    </Select>
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
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={!selectedCategoryId}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select product type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {filteredProductTypes.map(type => (
                                                                <SelectItem key={type.$id} value={type.$id}>
                                                                    <div className="flex items-center gap-2">
                                                                        <div>
                                                                            <div className="font-medium">{type.name}</div>
                                                                            {type.description && (
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {type.description}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {!type.storeId && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                <Globe className="w-3 h-3" />
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Pricing Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="basePrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Base Price (USD) *</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                {...field}
                                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>
                                                        Product base price
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="compareAtPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Compare at Price</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                {...field}
                                                                onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>Original price (for discounts)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {showAdvanced && (
                                            <FormField
                                                control={form.control}
                                                name="costPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cost Price</FormLabel>
                                                        <FormControl>
                                                            <div className="flex items-center gap-2">
                                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    step="0.01"
                                                                    {...field}
                                                                    onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormDescription>Your cost (private)</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    {(basePrice > 0 || compareAtPrice) && (
                                        <Card className="bg-muted/50">
                                            <CardContent className="pt-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-2xl font-bold text-green-600">${basePrice.toFixed(2)}</div>
                                                        {compareAtPrice && compareAtPrice > basePrice && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-muted-foreground line-through">
                                                                    ${compareAtPrice.toFixed(2)}
                                                                </span>
                                                                <Badge variant="destructive">{savingsPercentage}% OFF</Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {showAdvanced && form.watch("costPrice") && (
                                                        <div className="text-right">
                                                            <div className="text-sm text-muted-foreground">Profit Margin</div>
                                                            <div className="font-medium">
                                                                {Math.round(((basePrice - (form.watch("costPrice") || 0)) / basePrice) * 100)}%
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="trackInventory"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base flex items-center gap-2">
                                                            <Box className="w-4 h-4" />
                                                            Track Inventory
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Monitor stock levels and receive low stock alerts
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        {trackInventory && !hasVariants && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="sku"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g., IP15-PM-256-BLK" {...field} />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Unique identifier for inventory management
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        {hasVariants && trackInventory && (
                                            <Alert>
                                                <Info className="h-4 w-4" />
                                                <AlertDescription>
                                                    For products with variants, inventory will be tracked at the variant combination level.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product Description *</FormLabel>
                                                <FormControl>
                                                    <textarea
                                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="Describe your product in detail..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Provide detailed information about features, specifications, and benefits
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Images Upload */}
                                    <FormField
                                        control={form.control}
                                        name="images"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product Images *</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-4">
                                                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                                                            <input
                                                                type="file"
                                                                multiple
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const files = Array.from(e.target.files || []);
                                                                    field.onChange(files);
                                                                }}
                                                                className="hidden"
                                                                id="image-upload"
                                                            />
                                                            <label htmlFor="image-upload" className="cursor-pointer">
                                                                <p className="text-muted-foreground">
                                                                    Click or drag images here to upload (max 5 files)
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-2">
                                                                    Supported formats: JPG, PNG, WebP. Max size: 5MB each
                                                                </p>
                                                            </label>
                                                        </div>

                                                        {/* Image Preview */}
                                                        {previewImages.length > 0 && (
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                {previewImages.map((url, index) => (
                                                                    <div key={index} className="relative">
                                                                        <Image
                                                                            src={url}
                                                                            width={100}
                                                                            height={100}
                                                                            alt={`Preview ${index + 1}`}
                                                                            className="w-full h-24 object-cover rounded-lg border"
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                                            onClick={() => {
                                                                                const files = Array.from(field.value || []);
                                                                                files.splice(index, 1);
                                                                                field.onChange(files);
                                                                            }}
                                                                        >
                                                                            ×
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            onClick={() => setCurrentTab("variants")}
                                            disabled={!canProceedToVariants()}
                                        >
                                            Next: Configure Properties
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="variants" className="space-y-6">
                                    {applicableVariantTemplates.length === 0 ? (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                No property templates configured for this product type. You can create the product without specific properties or add property templates to the product type.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-medium">Product Properties</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Configure available options for product variations.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={autoGenerateCombinations}
                                                        onCheckedChange={setAutoGenerateCombinations}
                                                        id="auto-generate"
                                                    />
                                                    <Label htmlFor="auto-generate" className="text-sm">
                                                        Auto-generate combinations
                                                    </Label>
                                                </div>
                                            </div>

                                            {applicableVariantTemplates.map(template => (
                                                <Card key={template.$id}>
                                                    <CardHeader>
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-base">{template.name}</CardTitle>
                                                            <div className="flex items-center gap-2">
                                                                {template.isRequired && (
                                                                    <Badge variant="secondary">Required</Badge>
                                                                )}
                                                                <Badge variant="outline">{template.inputType}</Badge>
                                                            </div>
                                                        </div>
                                                        {template.description && (
                                                            <CardDescription>{template.description}</CardDescription>
                                                        )}
                                                    </CardHeader>
                                                    <CardContent>
                                                        {renderVariantControl(template)}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </>
                                    )}

                                    <div className="flex justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCurrentTab("basic")}
                                        >
                                            Back to Basic Info
                                        </Button>

                                        <div className="flex gap-2">
                                            {variantCombinations.length > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setCurrentTab("combinations")}
                                                >
                                                    Review Combinations ({variantCombinations.length})
                                                    <ChevronRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            )}

                                            {!autoGenerateCombinations && Object.keys(selectedVariants).length > 0 && (
                                                <Button
                                                    type="button"
                                                    onClick={handleGenerateCombinations}
                                                    variant="outline"
                                                    disabled={isGeneratingCombinations}
                                                >
                                                    <Wand2 className="mr-2 h-4 w-4" />
                                                    {isGeneratingCombinations ? "Generating..." : "Generate Combinations"}
                                                </Button>
                                            )}

                                            <Button type="submit" disabled={isSubmitting}>
                                                <Save className="mr-2 h-4 w-4" />
                                                {isSubmitting ? "Creating..." : "Create Product"}
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="combinations" className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium mb-2">Property Combinations</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Review and customize pricing for each property combination
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleGenerateCombinations}
                                            disabled={isGeneratingCombinations}
                                        >
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            {isGeneratingCombinations ? "Regenerating..." : "Regenerate All"}
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {variantCombinations.map((combo) => (
                                            <Card key={combo.id}>
                                                <CardContent className="pt-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                                                        <div className="md:col-span-2">
                                                            <Label className="text-sm font-medium">Combination</Label>
                                                            <div className="space-y-1">
                                                                {Object.entries(combo.variantValues).map(([templateId, values]) => {
                                                                    const template = applicableVariantTemplates.find(t => t.$id === templateId);
                                                                    return (
                                                                        <div key={templateId} className="text-sm">
                                                                            <span className="text-muted-foreground">{template?.name}:</span>{" "}
                                                                            <span className="font-medium">{values.join(", ")}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label className="text-sm">Price ($)</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={combo.finalPrice}
                                                                onChange={(e) =>
                                                                    updateCombination(combo.id, {
                                                                        finalPrice: parseFloat(e.target.value) || 0
                                                                    })
                                                                }
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label className="text-sm">SKU</Label>
                                                            <Input
                                                                value={combo.sku}
                                                                onChange={(e) =>
                                                                    updateCombination(combo.id, { sku: e.target.value })
                                                                }
                                                            />
                                                        </div>

                                                        {trackInventory && (
                                                            <div>
                                                                <Label className="text-sm">Stock</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={combo.inventoryQuantity}
                                                                    onChange={(e) =>
                                                                        updateCombination(combo.id, {
                                                                            inventoryQuantity: parseInt(e.target.value) || 0
                                                                        })
                                                                    }
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={combo.isActive}
                                                                onCheckedChange={(checked) =>
                                                                    updateCombination(combo.id, { isActive: checked })
                                                                }
                                                            />
                                                            <Label className="text-xs">Active</Label>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => duplicateCombination(combo)}
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => deleteCombination(combo.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {variantCombinations.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                                <p>No combinations generated yet</p>
                                                <p className="text-sm">Configure variants to generate combinations</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCurrentTab("variants")}
                                        >
                                            Back to Properties
                                        </Button>

                                        <div className="flex gap-2">
                                            {showAdvanced && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setCurrentTab("advanced")}
                                                >
                                                    Advanced Settings
                                                    <ChevronRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            )}

                                            <Button type="submit" disabled={isSubmitting}>
                                                <Save className="mr-2 h-4 w-4" />
                                                {isSubmitting ? "Creating..." : "Create Product"}
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                {showAdvanced && (
                                    <TabsContent value="advanced" className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium mb-2">Advanced Settings</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Configure additional product settings and SEO optimization
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Settings className="w-4 h-4" />
                                                        Product Settings
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="isActive"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between">
                                                                <div className="space-y-0.5">
                                                                    <FormLabel>Active Product</FormLabel>
                                                                    <FormDescription>Visible to customers</FormDescription>
                                                                </div>
                                                                <FormControl>
                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="featured"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between">
                                                                <div className="space-y-0.5">
                                                                    <FormLabel>Featured Product</FormLabel>
                                                                    <FormDescription>Show in featured sections</FormDescription>
                                                                </div>
                                                                <FormControl>
                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="shippingRequired"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between">
                                                                <div className="space-y-0.5">
                                                                    <FormLabel>Requires Shipping</FormLabel>
                                                                    <FormDescription>Physical product that needs shipping</FormDescription>
                                                                </div>
                                                                <FormControl>
                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">SEO Optimization</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="seoTitle"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>SEO Title</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Custom page title for search engines" {...field} />
                                                                </FormControl>
                                                                <FormDescription>{field.value?.length || 0}/60 characters</FormDescription>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="seoDescription"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>SEO Description</FormLabel>
                                                                <FormControl>
                                                                    <textarea
                                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        placeholder="Meta description for search results"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>{field.value?.length || 0}/160 characters</FormDescription>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Physical Properties */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Physical Properties</CardTitle>
                                                <CardDescription>Weight and dimensions for shipping calculations</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="weight"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Weight (lbs)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        placeholder="0.0"
                                                                        {...field}
                                                                        onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="dimensions.length"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Length (cm)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        placeholder="0.0"
                                                                        {...field}
                                                                        onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="dimensions.width"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Width (cm)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        placeholder="0.0"
                                                                        {...field}
                                                                        onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="dimensions.height"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Height (cm)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        placeholder="0.0"
                                                                        {...field}
                                                                        onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Order Management */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Order Management</CardTitle>
                                                <CardDescription>Configure order limits and policies</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="minOrderQuantity"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Min Order Quantity</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        {...field}
                                                                        onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>Minimum quantity per order</FormDescription>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="maxOrderQuantity"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Max Order Quantity</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        placeholder="No limit"
                                                                        {...field}
                                                                        onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>Maximum quantity per order</FormDescription>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {trackInventory && (
                                                        <FormField
                                                            control={form.control}
                                                            name="lowStockThreshold"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Low Stock Alert</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            placeholder="10"
                                                                            {...field}
                                                                            onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription>Alert when stock falls below this level</FormDescription>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                </div>

                                                {trackInventory && (
                                                    <div className="mt-4">
                                                        <FormField
                                                            control={form.control}
                                                            name="allowBackorders"
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-row items-center justify-between">
                                                                    <div className="space-y-0.5">
                                                                        <FormLabel>Allow Backorders</FormLabel>
                                                                        <FormDescription>Allow orders when out of stock</FormDescription>
                                                                    </div>
                                                                    <FormControl>
                                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <div className="flex justify-between">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setCurrentTab(hasVariants ? "combinations" : "variants")}
                                            >
                                                Back to {hasVariants ? "Combinations" : "Properties"}
                                            </Button>
                                            <Button type="submit" disabled={isSubmitting}>
                                                <Save className="mr-2 h-4 w-4" />
                                                {isSubmitting ? "Creating..." : "Create Product"}
                                            </Button>
                                        </div>
                                    </TabsContent>
                                )}
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </Tabs>

            <Card className="bg-muted/50">
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            <span>Creating product for: <strong>{storeData.storeName}</strong></span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <span>Available Categories: {availableCategories.length}</span>
                            <span>Available Product Types: {filteredProductTypes.length}</span>
                            <span>Global Properties: {applicableVariantTemplates.length}</span>
                            {hasVariants && <span>Combinations: {variantCombinations.length}</span>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};