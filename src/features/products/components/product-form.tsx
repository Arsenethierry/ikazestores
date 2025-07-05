/* eslint-disable react-hooks/exhaustive-deps */
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
import {
    Stepper,
    StepperDescription,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTitle,
    StepperTrigger,
} from "@/components/ui/stepper";
import { Package, Info, Settings, Images, ArrowLeft, ArrowRight, Zap, ShoppingCart, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Category, PhysicalStoreTypes, ProductTypeTypes, Subcategory, VariantTemplateTypes } from '@/lib/types';
import CustomFormField, { FormFieldType } from '@/components/custom-field';
import { useFieldArray, useForm } from 'react-hook-form';
import Image from 'next/image';
import { VariantConfig } from '@/features/variants management/variant-config';
import { productFormSchema } from '@/lib/schemas/products-schems';
import { useAction } from 'next-safe-action/hooks';
import { createNewProduct } from '../actions/original-products-actions';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateCombinationsWithStrings, getCategories, getCategoryById, getProductTypesBySubcategory, getRecommendedVariantTemplates } from '@/features/variants management/ecommerce-catalog';
import { ProductCombinations } from './product-combinations';

// Enhanced Product form schema

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
    storeData: PhysicalStoreTypes;
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
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
    const [selectedProductType, setSelectedProductType] = useState<string>('');
    const [availableVariants, setAvailableVariants] = useState<VariantTemplateTypes[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productFormSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            description: '',
            sku: '',
            basePrice: 0,
            status: 'active',
            featured: false,
            hasVariants: false,
            images: [],
            tags: [],
        }
    });

    const { fields: combinationFields, replace: replaceCombinations } = useFieldArray({
        control: form.control,
        name: 'productCombinations'
    });

    const categories = getCategories();
    const subcategories = selectedCategory ?
        getCategoryById(selectedCategory)?.subcategories || [] : [];
    const productTypes = (selectedCategory && selectedSubcategory) ?
        getProductTypesBySubcategory(selectedCategory, selectedSubcategory) : [];

    const watchedImages = form.watch("images");
    const watchedHasVariants = form.watch("hasVariants");
    const watchedVariants = form.watch("variants");

    useEffect(() => {
        if (selectedProductType) {
            const variants = getRecommendedVariantTemplates(selectedProductType);
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

    useEffect(() => {
        if (watchedHasVariants && watchedVariants && watchedVariants.length > 0) {
            const hasVariantsWithValues = watchedVariants.some(variant =>
                variant.values && variant.values.length > 0
            );

            if (hasVariantsWithValues) {
                generateVariantCombinations();
            } else {
                replaceCombinations([]);
            }
        } else {
            replaceCombinations([]);
        }
    }, [watchedVariants, watchedHasVariants]);

    const generateVariantCombinations = () => {
        const variants = form.getValues('variants') || [];
        const basePrice = form.getValues('basePrice') || 0;
        const baseSku = form.getValues('sku') || '';

        if (variants.length === 0) {
            replaceCombinations([]);
            return;
        }

        const combinations = generateCombinationsWithStrings(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            variants,
            basePrice,
            baseSku
        );
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        replaceCombinations(combinations);
    };

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
        setSelectedProductType('');
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

    const generateSKU = () => {
        const name = form.getValues('name');
        const category = categories.find((c: Category) => c.id === selectedCategory)?.name || '';
        const timestamp = Date.now().toString().slice(-4);
        const sku = `${category.slice(0, 3).toUpperCase()}-${name.slice(0, 3).toUpperCase()}-${timestamp}`;
        form.setValue('sku', sku);
    };

    const validateStep = async (step: number): Promise<boolean> => {
        const fieldsToValidate: (keyof ProductFormData)[] = [];

        switch (step) {
            case 1:
                fieldsToValidate.push('name', 'description', 'sku', 'basePrice');
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

    const { execute: createProduct, status, result } = useAction(createNewProduct, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success)
            } else if (data?.serverError) {
                toast.error(data.serverError)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "An unexpected error occurred")
        }
    })
    const onSubmit = async (values: ProductFormData) => {
        const isValid = await validateStep(currentStep);

        if (!isValid) return;

        const formData = {
            ...values,
            storeId: storeData.$id,
            storeLat: storeData.latitude,
            storeLong: storeData.longitude,
            storeOriginCountry: storeData.country,
        };

        createProduct(formData)
    };

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

                    <CustomFormField
                        fieldType={FormFieldType.NUMBER_INPUT}
                        control={form.control}
                        name="basePrice"
                        label="Base Price"
                        placeholder="0.00"
                    />
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
                                            {productTypes.map((productType: ProductTypeTypes) => (
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
                        <VariantConfig
                            control={form.control}
                            variantTemplates={availableVariants}
                        />
                    )}
                </CardContent>
            </Card>

            {form.watch("hasVariants") && (
                <ProductCombinations
                    control={form.control}
                    basePrice={form.watch("basePrice") || 0}
                    baseSku={form.watch("sku") || ''}
                    variants={form.watch('variants') || []}
                    onRegenerateAll={generateVariantCombinations}
                />
            )}

            <div className="mt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        console.log('Variants:', form.getValues('variants')); // Debug log
                        generateVariantCombinations();
                        console.log('Generated Combinations:', form.getValues('productCombinations')); // Debug log
                    }}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Generate Combinations
                </Button>
            </div>
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

            {combinationFields.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-600" />
                            Generated Variant Filter Strings
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            These strings will be stored in database for easy filtering. Perfect for your T-shirt example: Size Large = &quot;size-l&quot;
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
                    {status === "executing" && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl">
                                <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                                <p className="mt-4 text-center">Creating product...</p>
                            </div>
                        </div>
                    )}
                    {result?.data?.serverError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {result.data.serverError}
                            </AlertDescription>
                        </Alert>
                    )}
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
                                disabled={status === "executing"}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                {status === "executing" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Create Product
                                        <Package className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
};