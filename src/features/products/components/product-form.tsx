/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Stepper,
    StepperDescription,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTitle,
    StepperTrigger,
} from "@/components/ui/stepper";
import { Plus, Minus, Package, Info, Settings, Images, ArrowLeft, ArrowRight, Zap, ShoppingCart, CheckCircle } from 'lucide-react';
import { Category, ProductType, Subcategory, VariantTemplate } from '@/lib/types';
import EcommerceCatalogUtils from '@/features/variants management/ecommerce-catalog';
import CustomFormField, { FormFieldType } from '@/components/custom-field';
import { useFieldArray, useForm } from 'react-hook-form';
import Image from 'next/image';

// Enhanced Product form schema
const productFormSchema = z.object({
    // Basic Information
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    shortDescription: z.string().optional(),
    sku: z.string().min(1, 'SKU is required'),

    // Category & Type
    categoryId: z.string().min(1, 'Category is required'),
    subcategoryId: z.string().min(1, 'Subcategory is required'),
    productTypeId: z.string().min(1, 'Product type is required'),

    // Pricing & Inventory
    basePrice: z.number().min(0, 'Price must be positive'),
    compareAtPrice: z.number().optional(),
    costPerItem: z.number().optional(),
    trackQuantity: z.boolean().default(true),
    quantity: z.number().min(0, 'Quantity must be 0 or greater'),
    lowStockThreshold: z.number().min(0).optional(),

    // Physical Properties
    weight: z.number().optional(),
    dimensions: z.object({
        length: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        unit: z.string().default('cm')
    }).optional(),

    // Product Status
    status: z.enum(['active', 'draft', 'archived']).default('draft'),
    featured: z.boolean().default(false),

    // SEO
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),

    // Variants
    hasVariants: z.boolean().default(false),
    variants: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['text', 'color', 'select', 'boolean', 'multiselect']),
        values: z.array(z.object({
            value: z.string(),
            label: z.string().optional(),
            colorCode: z.string().optional(),
            additionalPrice: z.number().optional(),
            isDefault: z.boolean().default(false)
        })),
        required: z.boolean().default(false)
    })).optional(),

    // Product Combinations with variant strings
    productCombinations: z.array(z.object({
        id: z.string(),
        variantValues: z.record(z.string()),
        sku: z.string(),
        price: z.number(),
        compareAtPrice: z.number().optional(),
        quantity: z.number().optional(),
        weight: z.number().optional(),
        barcode: z.string().optional(),
        images: z.array(z.any()).optional(),
        isDefault: z.boolean().default(false),
        // Simple variant strings for filtering - this is what we want!
        variantStrings: z.array(z.string()).optional()
    })).optional(),

    // Images
    images: z.array(z.any()).min(1, 'At least one image is required'),

    // Tags
    tags: z.array(z.string()).default([]),

    // Additional Properties
    brand: z.string().optional(),
    model: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
    storeData: any;
}

const steps = [
    {
        step: 1,
        title: "Basic Info",
        description: "Product details and pricing",
        icon: Package,
    },
    {
        step: 2,
        title: "Category",
        description: "Classification and tags",
        icon: Settings,
    },
    {
        step: 3,
        title: "Variants",
        description: "Product variations",
        icon: ShoppingCart,
    },
    {
        step: 4,
        title: "Images",
        description: "Product photos",
        icon: Images,
    },
    {
        step: 5,
        title: "Review",
        description: "Final validation",
        icon: Info,
    },
];

export const ProductForm: React.FC<ProductFormProps> = ({ storeData }) => {
    // State Management
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
    const [selectedProductType, setSelectedProductType] = useState<string>('');
    const [availableVariants, setAvailableVariants] = useState<VariantTemplate[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [editingVariantValues, setEditingVariantValues] = useState<{ [key: string]: any }>({});

    // Form Setup
    const form = useForm<ProductFormData>({
        resolver: zodResolver(productFormSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            description: '',
            sku: '',
            basePrice: 0,
            trackQuantity: true,
            quantity: 0,
            status: 'draft',
            featured: false,
            hasVariants: false,
            images: [],
            tags: [],
            dimensions: { unit: 'cm' },
        }
    });

    // Field Arrays
    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control: form.control,
        name: 'variants'
    });

    const { fields: combinationFields, replace: replaceCombinations } = useFieldArray({
        control: form.control,
        name: 'productCombinations'
    });

    // Catalog Data
    const categories = EcommerceCatalogUtils.getCategories();
    const subcategories = selectedCategory ?
        EcommerceCatalogUtils.getCategoryById(selectedCategory)?.subcategories || [] : [];
    const productTypes = (selectedCategory && selectedSubcategory) ?
        EcommerceCatalogUtils.getProductTypesBySubcategory(selectedCategory, selectedSubcategory) : [];

    const watchedImages = form.watch("images");
    const watchedHasVariants = form.watch("hasVariants");
    const watchedVariants = form.watch("variants");

    // Effects
    useEffect(() => {
        if (selectedProductType) {
            const variants = EcommerceCatalogUtils.getRecommendedVariantTemplates(selectedProductType);
            setAvailableVariants(variants);
        }
    }, [selectedProductType]);

    useEffect(() => {
        if (watchedImages && watchedImages.length > 0) {
            const urls = Array.from(watchedImages).map(file => URL.createObjectURL(file));
            setPreviewImages(urls);
            return () => urls.forEach(url => URL.revokeObjectURL(url));
        } else {
            setPreviewImages([]);
        }
    }, [watchedImages]);

    // Generate combinations when variants change
    useEffect(() => {
        if (watchedHasVariants && watchedVariants && watchedVariants.length > 0) {
            generateVariantCombinations();
        } else {
            replaceCombinations([]);
        }
    }, [watchedVariants, watchedHasVariants]);

    // NEW: Generate combinations with variant strings
    const generateVariantCombinations = () => {
        const variants = form.getValues('variants') || [];
        const basePrice = form.getValues('basePrice') || 0;
        const baseSku = form.getValues('sku') || '';

        if (variants.length === 0) {
            replaceCombinations([]);
            return;
        }

        // Use the new utility method to generate combinations with variant strings
        const combinations = EcommerceCatalogUtils.generateCombinationsWithStrings(
            variants,
            basePrice,
            baseSku
        );
        // @ts-ignore
        replaceCombinations(combinations);
    };

    // Category Handlers
    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setSelectedSubcategory('');
        setSelectedProductType('');
        form.setValue('categoryId', categoryId);
        form.setValue('subcategoryId', '');
        form.setValue('productTypeId', '');
        resetVariants();
    };

    const handleSubcategoryChange = (subcategoryId: string) => {
        setSelectedSubcategory(subcategoryId);
        setSelectedProductType(''); // Reset product type when subcategory changes
        form.setValue('subcategoryId', subcategoryId);
        form.setValue('productTypeId', '');
        resetVariants();
    };


    const handleProductTypeChange = (productTypeId: string) => {
        setSelectedProductType(productTypeId);
        form.setValue('productTypeId', productTypeId);
        resetVariants();
    };

    const resetVariants = () => {
        form.setValue('variants', []);
        form.setValue('productCombinations', []);
        form.setValue('hasVariants', false);
    };

    // Variant Handlers
    const addVariant = (variantTemplate: VariantTemplate) => {
        const existingVariant = variantFields.find(field => field.id === variantTemplate.id);
        if (!existingVariant) {
            appendVariant({
                id: variantTemplate.id,
                name: variantTemplate.name,
                type: variantTemplate.inputType || 'select',
                values: [],
                required: variantTemplate.isRequired || false
            });
        }
    };

    const addVariantValueFromTemplate = (variantIndex: number, optionValue: string) => {
        const variant = form.getValues(`variants.${variantIndex}`);
        const variantTemplate = EcommerceCatalogUtils.getVariantTemplateById(variant.id);

        if (!variantTemplate?.options) return;

        const templateOption = variantTemplate.options.find(opt => opt.value === optionValue);
        if (!templateOption) return;

        const newValue = {
            value: templateOption.value,
            label: templateOption.name || templateOption.value,
            colorCode: templateOption.colorCode,
            additionalPrice: templateOption.additionalPrice || 0,
            isDefault: variant.values.length === 0
        };

        const updatedValues = [...variant.values, newValue];
        form.setValue(`variants.${variantIndex}.values`, updatedValues);
    };

    const addCustomVariantValue = (variantIndex: number, value: string, label?: string) => {
        const variant = form.getValues(`variants.${variantIndex}`);

        const newValue = {
            value: value,
            label: label || value,
            colorCode: variant.type === 'color' ? value : undefined,
            additionalPrice: 0,
            isDefault: variant.values.length === 0
        };

        const updatedValues = [...variant.values, newValue];
        form.setValue(`variants.${variantIndex}.values`, updatedValues);
    };

    const removeVariantValue = (variantIndex: number, valueIndex: number) => {
        const currentVariant = form.getValues(`variants.${variantIndex}`);
        const updatedValues = currentVariant.values.filter((_, index) => index !== valueIndex);
        form.setValue(`variants.${variantIndex}.values`, updatedValues);
    };

    // Tag Handlers
    const addTag = () => {
        if (currentTag.trim()) {
            const currentTags = form.getValues('tags') || [];
            if (!currentTags.includes(currentTag.trim())) {
                form.setValue('tags', [...currentTags, currentTag.trim()]);
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        const currentTags = form.getValues('tags') || [];
        form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
    };

    // SKU Generator
    const generateSKU = () => {
        const name = form.getValues('name');
        const category = categories.find((c: Category) => c.id === selectedCategory)?.name || '';
        const timestamp = Date.now().toString().slice(-4);
        const sku = `${category.slice(0, 3).toUpperCase()}-${name.slice(0, 3).toUpperCase()}-${timestamp}`;
        form.setValue('sku', sku);
    };

    // Step Validation
    const validateStep = async (step: number): Promise<boolean> => {
        const fieldsToValidate: (keyof ProductFormData)[] = [];

        switch (step) {
            case 1:
                fieldsToValidate.push('name', 'description', 'sku', 'basePrice');
                if (form.getValues('trackQuantity')) {
                    fieldsToValidate.push('quantity');
                }
                break;
            case 2:
                fieldsToValidate.push('categoryId', 'subcategoryId', 'productTypeId');
                break;
            case 3:
                break;
            case 4:
                fieldsToValidate.push('images');
                break;
            case 5:
                break;
        }

        return await form.trigger(fieldsToValidate);
    };

    // Navigation
    const handleNextStep = async () => {
        const isValid = await validateStep(currentStep);
        if (isValid && currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Form Submission
    const onSubmit = async (values: ProductFormData) => {
        const isValid = await validateStep(currentStep);

        if (isValid) {
            console.log('Product Data with Variant Strings:', values);
            console.log('Store:', storeData);

            // Show example of variant strings generated
            if (values.productCombinations && values.productCombinations.length > 0) {
                console.log('Generated Variant Strings:');
                values.productCombinations.forEach((combo, index) => {
                    console.log(`Combination ${index + 1}: [${combo.variantStrings?.join(', ')}]`);
                });
            }

            // Here you would submit to your backend
            alert('Product created successfully! Check console for variant strings.');
        }
    };

    // Step Content Renderers
    const renderBasicInfoStep = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomFormField
                            fieldType={FormFieldType.INPUT}
                            control={form.control}
                            name="name"
                            label="Product Name"
                            placeholder="Enter product name"
                        />
                        <div className="flex gap-2">
                            <CustomFormField
                                fieldType={FormFieldType.INPUT}
                                control={form.control}
                                name="sku"
                                label="SKU"
                                placeholder="Product SKU"
                            />
                            <Button type="button" variant="outline" onClick={generateSKU} className="mt-8">
                                Generate
                            </Button>
                        </div>
                    </div>

                    <CustomFormField
                        fieldType={FormFieldType.TEXTAREA}
                        control={form.control}
                        name="description"
                        label="Description"
                        placeholder="Detailed product description"
                    />

                    <CustomFormField
                        fieldType={FormFieldType.TEXTAREA}
                        control={form.control}
                        name="shortDescription"
                        label="Short Description (Optional)"
                        placeholder="Brief product summary"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pricing & Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={form.control}
                            name="basePrice"
                            label="Base Price"
                            placeholder="0.00"
                        />
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={form.control}
                            name="compareAtPrice"
                            label="Compare at Price (Optional)"
                            placeholder="0.00"
                        />
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={form.control}
                            name="costPerItem"
                            label="Cost per Item (Optional)"
                            placeholder="0.00"
                        />
                    </div>

                    <Separator />

                    <FormField
                        control={form.control}
                        name="trackQuantity"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Track Quantity</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    {form.watch('trackQuantity') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomFormField
                                fieldType={FormFieldType.NUMBER_INPUT}
                                control={form.control}
                                name="quantity"
                                label="Quantity"
                                placeholder="0"
                            />
                            <CustomFormField
                                fieldType={FormFieldType.NUMBER_INPUT}
                                control={form.control}
                                name="lowStockThreshold"
                                label="Low Stock Threshold"
                                placeholder="5"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Physical Properties & Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={form.control}
                            name="weight"
                            label="Weight (kg)"
                            placeholder="0.0"
                        />
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={form.control}
                            name="dimensions.length"
                            label="Length (cm)"
                            placeholder="0"
                        />
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={form.control}
                            name="dimensions.width"
                            label="Width (cm)"
                            placeholder="0"
                        />
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={form.control}
                            name="dimensions.height"
                            label="Height (cm)"
                            placeholder="0"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center space-x-4 pt-8">
                            <FormField
                                control={form.control}
                                name="featured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Featured Product</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderCategoryStep = () => (
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
                            render={() => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={handleCategoryChange} value={selectedCategory}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category: Category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="subcategoryId"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Subcategory</FormLabel>
                                    <Select
                                        onValueChange={handleSubcategoryChange}
                                        value={selectedSubcategory}
                                        disabled={!selectedCategory}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select subcategory" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {subcategories.map((subcategory: Subcategory) => (
                                                <SelectItem key={subcategory.id} value={subcategory.id}>
                                                    {subcategory.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="productTypeId"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Product Type</FormLabel>
                                    <Select
                                        onValueChange={handleProductTypeChange}
                                        value={selectedProductType}
                                        disabled={!selectedSubcategory}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select product type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {productTypes.map((productType: ProductType) => (
                                                <SelectItem key={productType.id} value={productType.id}>
                                                    {productType.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {selectedProductType && availableVariants.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-blue-600" />
                                <h4 className="text-sm font-medium text-blue-900">
                                    Smart Variant Suggestions Ready
                                </h4>
                            </div>
                            <p className="text-xs text-blue-700 mb-3">
                                {availableVariants.length} relevant variants available for {productTypes.find(pt => pt.id === selectedProductType)?.name}. Configure them in the next step.
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {availableVariants.slice(0, 6).map(variant => (
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
                                    x
                                </button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderVariantsStep = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Product Variants Configuration</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Configure product variants like size, color, storage, etc. Each combination will generate simple filter strings like &quot;size-l&quot;, &quot;color-white&quot;.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="hasVariants"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>This product has variants</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Enable to add variants like size, color, storage, etc.
                                    </p>
                                </div>
                            </FormItem>
                        )}
                    />

                    {form.watch('hasVariants') && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium mb-3">Available Variant Options</h4>
                                {availableVariants.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Select a product type in the previous step to see available variants</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {availableVariants.map(variant => (
                                            <Button
                                                key={variant.id}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addVariant(variant)}
                                                className="justify-start"
                                                disabled={variantFields.some(field => field.id === variant.id)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                {variant.name}
                                                {variant.isRequired && <span className="text-red-500 ml-1">*</span>}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Variants Configuration */}
                            {variantFields.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">Configure Selected Variants</h4>
                                    {variantFields.map((field, variantIndex) => {
                                        const variantTemplate = EcommerceCatalogUtils.getVariantTemplateById(field.id);

                                        return (
                                            <Card key={field.id} className="border-l-4 border-l-blue-500">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                {field.name}
                                                                {field.required && <span className="text-red-500 text-sm">*</span>}
                                                            </CardTitle>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {variantTemplate?.description || 'Configure options for this variant'}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeVariant(variantIndex)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`variants.${variantIndex}.required`}
                                                        render={({ field: checkboxField }) => (
                                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={checkboxField.value}
                                                                        onCheckedChange={checkboxField.onChange}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel className="text-sm">Required variant</FormLabel>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Template Options */}
                                                    {variantTemplate?.options && variantTemplate.options.length > 0 && (
                                                        <div className="space-y-3">
                                                            <h5 className="text-sm font-medium">Pre-configured Options</h5>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                                                {variantTemplate.options.map(option => {
                                                                    const isSelected = form.watch(`variants.${variantIndex}.values`)?.some(
                                                                        (v: any) => v.value === option.value
                                                                    );

                                                                    return (
                                                                        <Button
                                                                            key={option.value}
                                                                            type="button"
                                                                            variant={isSelected ? "teritary" : "outline"}
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                if (!isSelected) {
                                                                                    addVariantValueFromTemplate(variantIndex, option.value);
                                                                                }
                                                                            }}
                                                                            disabled={isSelected}
                                                                            className="justify-start text-xs h-auto py-2"
                                                                        >
                                                                            {field.type === 'color' && option.colorCode && (
                                                                                <div
                                                                                    className="w-3 h-3 rounded-full border border-gray-300 mr-1 flex-shrink-0"
                                                                                    style={{ backgroundColor: option.colorCode }}
                                                                                />
                                                                            )}
                                                                            <span className="truncate">{option.name}</span>
                                                                            {option.additionalPrice && option.additionalPrice !== 0 && (
                                                                                <span className="ml-1 text-xs text-muted-foreground">
                                                                                    ({option.additionalPrice > 0 ? '+' : ''}${option.additionalPrice})
                                                                                </span>
                                                                            )}
                                                                        </Button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Custom Values */}
                                                    <div className="space-y-3">
                                                        <h5 className="text-sm font-medium">Add Custom Values</h5>
                                                        <div className="flex gap-2">
                                                            {field.type === 'color' ? (
                                                                <div className="flex gap-2 flex-1">
                                                                    <Input
                                                                        type="color"
                                                                        value={editingVariantValues[`${variantIndex}-color`] || '#000000'}
                                                                        onChange={(e) => setEditingVariantValues(prev => ({
                                                                            ...prev,
                                                                            [`${variantIndex}-color`]: e.target.value
                                                                        }))}
                                                                        className="w-16 h-10"
                                                                    />
                                                                    <Input
                                                                        placeholder="Color name (e.g., Custom Red)"
                                                                        value={editingVariantValues[`${variantIndex}-name`] || ''}
                                                                        onChange={(e) => setEditingVariantValues(prev => ({
                                                                            ...prev,
                                                                            [`${variantIndex}-name`]: e.target.value
                                                                        }))}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <Input
                                                                    placeholder={`Add custom ${field.name.toLowerCase()} value`}
                                                                    value={editingVariantValues[`${variantIndex}-value`] || ''}
                                                                    onChange={(e) => setEditingVariantValues(prev => ({
                                                                        ...prev,
                                                                        [`${variantIndex}-value`]: e.target.value
                                                                    }))}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            const value = editingVariantValues[`${variantIndex}-value`];
                                                                            if (value?.trim()) {
                                                                                addCustomVariantValue(variantIndex, value.trim());
                                                                                setEditingVariantValues(prev => ({
                                                                                    ...prev,
                                                                                    [`${variantIndex}-value`]: ''
                                                                                }));
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                            <Button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (field.type === 'color') {
                                                                        const colorCode = editingVariantValues[`${variantIndex}-color`] || '#000000';
                                                                        const colorName = editingVariantValues[`${variantIndex}-name`] || '';
                                                                        if (colorName.trim()) {
                                                                            addCustomVariantValue(variantIndex, colorCode, colorName.trim());
                                                                            setEditingVariantValues(prev => ({
                                                                                ...prev,
                                                                                [`${variantIndex}-color`]: '#000000',
                                                                                [`${variantIndex}-name`]: ''
                                                                            }));
                                                                        }
                                                                    } else {
                                                                        const value = editingVariantValues[`${variantIndex}-value`];
                                                                        if (value?.trim()) {
                                                                            addCustomVariantValue(variantIndex, value.trim());
                                                                            setEditingVariantValues(prev => ({
                                                                                ...prev,
                                                                                [`${variantIndex}-value`]: ''
                                                                            }));
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                Add
                                                            </Button>
                                                        </div>

                                                        {/* Display Selected Values */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {form.watch(`variants.${variantIndex}.values`)?.map((value: any, valueIndex: number) => (
                                                                <Badge
                                                                    key={valueIndex}
                                                                    variant="secondary"
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    {field.type === 'color' && (
                                                                        <div
                                                                            className="w-3 h-3 rounded-full border border-gray-300"
                                                                            style={{ backgroundColor: value.colorCode || value.value }}
                                                                        />
                                                                    )}
                                                                    {value.label || value.value}
                                                                    {value.additionalPrice !== 0 && (
                                                                        <span className="text-xs">
                                                                            ({value.additionalPrice > 0 ? '+' : ''}${value.additionalPrice})
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeVariantValue(variantIndex, valueIndex)}
                                                                        className="ml-1 text-xs hover:text-red-500"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}

                            {/* NEW: Product Combinations with Variant Strings */}
                            {combinationFields.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-blue-600" />
                                            Product Combinations with Filter Strings
                                            <Badge variant="secondary">{combinationFields.length} combinations</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Auto-generated combinations with simple variant strings for easy filtering. Each combination gets strings like [&quot;size-l&quot;, &quot;color-white&quot;].
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {combinationFields.map((combination, index) => (
                                                <Card key={combination.id} className="border-l-4 border-l-green-500">
                                                    <CardContent className="pt-4">
                                                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                            {/* Variant Combination Display */}
                                                            <div className="space-y-2">
                                                                <h5 className="font-medium text-sm">Variant Combination</h5>
                                                                <div className="space-y-1">
                                                                    {Object.entries(combination.variantValues).map(([variantId, value]) => {
                                                                        const variant = variantFields.find(v => v.id === variantId);
                                                                        if (!variant) return null;

                                                                        const displayInfo = EcommerceCatalogUtils.getVariantDisplayInfo(variantId, value);

                                                                        return (
                                                                            <div key={variantId} className="flex items-center gap-2 text-sm">
                                                                                <span className="text-muted-foreground font-medium">{variant.name}:</span>
                                                                                {displayInfo.colorCode ? (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <div
                                                                                            className="w-3 h-3 rounded-full border border-gray-300"
                                                                                            style={{ backgroundColor: displayInfo.colorCode }}
                                                                                        />
                                                                                        <span>{displayInfo.displayName}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="font-medium">{displayInfo.displayName}</span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* NEW: Display Variant Strings */}
                                                                <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                                                                    <div className="font-medium text-green-800 mb-1">Filter Strings:</div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {combination.variantStrings?.map((str, strIndex) => (
                                                                            <Badge key={strIndex} variant="outline" className="text-xs bg-green-100 text-green-800">
                                                                                {str}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                    <div className="text-green-600 mt-1 text-xs">
                                                                        Perfect for Appwrite filtering!
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <CustomFormField
                                                                fieldType={FormFieldType.INPUT}
                                                                control={form.control}
                                                                name={`productCombinations.${index}.sku`}
                                                                label="SKU"
                                                                placeholder="Auto-generated SKU"
                                                            />

                                                            <CustomFormField
                                                                fieldType={FormFieldType.NUMBER_INPUT}
                                                                control={form.control}
                                                                name={`productCombinations.${index}.price`}
                                                                label="Price"
                                                                placeholder="Calculated price"
                                                            />

                                                            <CustomFormField
                                                                fieldType={FormFieldType.NUMBER_INPUT}
                                                                control={form.control}
                                                                name={`productCombinations.${index}.quantity`}
                                                                label="Quantity"
                                                                placeholder="Stock quantity"
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderImagesStep = () => (
        <Card>
            <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Upload high-quality images of your product. These will be the main product gallery.
                </p>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Images *</FormLabel>
                            <FormControl>
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
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
                                            <Images className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                            <h3 className="text-lg font-medium mb-2">Upload Product Images</h3>
                                            <p className="text-muted-foreground mb-2">
                                                Click to browse or drag and drop images here
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Supported: JPG, PNG, WebP • Max 10 files • 5MB each
                                            </p>
                                        </label>
                                    </div>

                                    {previewImages.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-3">Image Preview</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {previewImages.map((url, index) => (
                                                    <div key={index} className="relative group">
                                                        <Image
                                                            src={url}
                                                            width={200}
                                                            height={200}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-32 object-cover rounded-lg border shadow-sm"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                const files = Array.from(field.value || []);
                                                                files.splice(index, 1);
                                                                field.onChange(files);
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );

    const renderReviewStep = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Product Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Product Name:</span>
                                <p className="font-medium">{form.watch('name') || 'Not set'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">SKU:</span>
                                <p className="font-medium font-mono text-sm">{form.watch('sku') || 'Not set'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Base Price:</span>
                                <p className="font-medium text-lg">${form.watch('basePrice') || 0}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Category:</span>
                                <p className="font-medium">
                                    {categories.find(c => c.id === selectedCategory)?.name || 'Not selected'}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Product Type:</span>
                                <p className="font-medium">
                                    {productTypes.find(pt => pt.id === selectedProductType)?.name || 'Not selected'}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Variants:</span>
                                <p className="font-medium">
                                    {form.watch('hasVariants') ?
                                        `${combinationFields.length} combinations` :
                                        'No variants'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <span className="text-sm font-medium text-muted-foreground">Status:</span>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${form.watch('status') === 'active' ? 'bg-green-500' :
                                form.watch('status') === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`} />
                            <p className="font-medium capitalize">{form.watch('status')}</p>
                            {form.watch('featured') && (
                                <Badge variant="secondary" className="text-xs">Featured</Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* NEW: Variant Strings Preview */}
            {combinationFields.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-600" />
                            Generated Variant Filter Strings
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            These strings will be stored in Appwrite for easy filtering. Perfect for your T-shirt example: Size Large = &quot;size-l&quot;
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {combinationFields.map((combo, index) => (
                                <div key={combo.id} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm">Combination {index + 1}:</span>
                                        <span className="text-sm text-muted-foreground">{combo.sku}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {combo.variantStrings?.map((str, strIndex) => (
                                            <Badge key={strIndex} variant="secondary" className="text-xs">
                                                {str}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-2">Example Appwrite Query Usage:</h5>
                            <code className="text-xs text-blue-800 bg-blue-100 p-2 rounded block">
                                {`// Filter products by size Large\nQuery.contains("productCombinations.variantStrings", "size-l")\n\n// Filter by White color\nQuery.contains("productCombinations.variantStrings", "color-white")`}
                            </code>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    // Main render function
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderBasicInfoStep();
            case 2:
                return renderCategoryStep();
            case 3:
                return renderVariantsStep();
            case 4:
                return renderImagesStep();
            case 5:
                return renderReviewStep();
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Create New Product</h1>
                    <p className="text-muted-foreground">
                        Add a new product to {storeData?.storeName} with simple variant string filtering
                    </p>
                </div>
            </div>

            {/* Progress Stepper */}
            <Stepper value={currentStep} className="w-full">
                {steps.map(({ step, title, description, icon: Icon }) => (
                    <StepperItem
                        key={step}
                        step={step}
                        className="relative flex-1 flex-col!"
                    >
                        <StepperTrigger
                            className="flex-col gap-3 rounded cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setCurrentStep(step)}
                        >
                            <StepperIndicator className="flex items-center justify-center">
                                <Icon className="h-4 w-4" />
                            </StepperIndicator>
                            <div className="space-y-0.5 px-2 text-center">
                                <StepperTitle className="text-sm font-medium">{title}</StepperTitle>
                                <StepperDescription className="max-sm:hidden text-xs">
                                    {description}
                                </StepperDescription>
                            </div>
                        </StepperTrigger>
                        {step < steps.length && (
                            <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                        )}
                    </StepperItem>
                ))}
            </Stepper>

            {/* Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Step Content */}
                    <div className="min-h-[500px]">
                        {renderStepContent()}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-6 border-t bg-background sticky bottom-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handlePrevStep}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Step {currentStep} of {steps.length}
                            </span>
                            {combinationFields.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    {combinationFields.length} combinations
                                </Badge>
                            )}
                        </div>

                        {currentStep < steps.length ? (
                            <Button
                                type="button"
                                onClick={handleNextStep}
                                className="flex items-center gap-2"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                Create Product
                                <Package className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
};