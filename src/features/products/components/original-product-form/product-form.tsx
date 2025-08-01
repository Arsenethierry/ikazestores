/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
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
import {
    Package,
    Info,
    Settings,
    Images,
    ArrowLeft,
    ArrowRight,
    Zap,
    Loader2,
    AlertCircle,
    Palette
} from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { CreateProductSchema } from '@/lib/schemas/products-schems';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    generateCombinationsWithStrings,
    getCategories,
    getCategoryById,
    getProductTypesBySubcategory,
    getRecommendedVariantTemplates
} from '@/features/variants management/ecommerce-catalog';
import { PhysicalStoreTypes } from '@/lib/types';
import { Category, VariantTemplate } from '@/lib/types/catalog-types';
import { useRouter } from 'next/navigation';
import { useCreateOriginalProduct } from '@/hooks/queries-and-mutations/use-original-products-queries';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { CategoryStep } from './steps/CategoryStep';
import { VariantsStep } from './steps/VariantsStep';
import { ImagesStep } from './steps/ImagesStep';
import { ReviewStep } from './steps/ReviewStep';
import { ColorVariantInput } from './color-variant-manager';

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
        icon: Zap,
    },
    {
        step: 4,
        title: "Images & Colors",
        description: "Product photos and color variants",
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
    const [availableVariants, setAvailableVariants] = useState<VariantTemplate[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const router = useRouter();
    const createProductMutation = useCreateOriginalProduct();

    const form = useForm<z.infer<typeof CreateProductSchema>>({
        resolver: zodResolver(CreateProductSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            description: '',
            shortDescription: '',
            sku: '',
            basePrice: 0,
            currency: storeData.currency,
            status: 'active',
            featured: false,
            enableColors: false,
            hasVariants: true,
            isDropshippingEnabled: true,
            images: [],
            tags: [],
            physicalStoreId: storeData.$id,
            storeLatitude: storeData.latitude,
            storeLongitude: storeData.longitude,
            storeCountry: storeData.country,
            variants: [],
            productCombinations: [],
            colorVariants: [],
            hasColorVariants: false
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
    const watchedVariants = form.watch("variants") || [];
    const watchedEnableColors = form.watch("enableColors");
    const watchedColorVariants = form.watch("colorVariants") || [];

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

    const isColorVariant = useCallback((variant: any) => {
        if (!variant) return false;
        const name = variant.name?.toLowerCase() || '';
        const type = variant.type?.toLowerCase() || '';
        const templateId = variant.templateId?.toLowerCase() || '';
        const colorKeywords = ['color', 'colour', 'hue', 'shade', 'tint'];
        return colorKeywords.some(keyword =>
            name.includes(keyword) ||
            type.includes(keyword) ||
            templateId.includes(keyword)
        );
    }, []);

    useEffect(() => {
        if (watchedHasVariants && watchedVariants && watchedVariants.length > 0) {
            const hasNonColorVariantsWithValues = watchedVariants.some(variant => {
                if (!variant || !variant.values || variant.values.length === 0) return false;
                return !isColorVariant(variant);
            });

            if (hasNonColorVariantsWithValues) {
                generateVariantCombinations();
            } else {
                replaceCombinations([]);
            }
        } else {
            replaceCombinations([]);
        }
    }, [watchedVariants, watchedHasVariants]);

    const generateVariantCombinations = useCallback(() => {
        const variants = form.getValues("variants") || [];
        const basePrice = form.getValues("basePrice") || 0;
        const baseSku = form.getValues("sku") || '';

        if (variants.length === 0) {
            replaceCombinations([]);
            return;
        }

        // Filter out color variants - they're managed separately
        const validVariants = variants.filter((variant): variant is NonNullable<typeof variant> =>
            variant != null &&
            variant.values != null &&
            variant.values.length > 0 &&
            variant.templateId != null &&
            variant.name != null &&
            variant.type != null &&
            !isColorVariant(variant)
        );

        if (validVariants.length === 0) {
            replaceCombinations([]);
            return;
        }

        try {
            const combinations = generateCombinationsWithStrings(validVariants, basePrice, baseSku);

            const formCombinations = combinations.map((combo, index) => ({
                variantStrings: combo.variantStrings,
                sku: combo.sku,
                basePrice: combo.basePrice,
                stockQuantity: combo.stockQuantity || 1,
                weight: combo.weight,
                dimensions: combo.dimensions,
                images: combo.images as File[] | undefined,
                variantValues: combo.variantValues,
                isDefault: index === 0,
                isActive: true
            }));

            if (formCombinations.length > 10) {
                toast.error("Maximum 10 variant combinations allowed.");
                replaceCombinations(formCombinations.slice(0, 10));
            } else {
                replaceCombinations(formCombinations);
            }

            toast.success(`Generated ${formCombinations.length} variant combinations`);
        } catch (error) {
            toast.error("Failed to generate variant combinations. Please check your variant configuration.");
            replaceCombinations([]);
        }
    }, [form, isColorVariant, replaceCombinations]);

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
        form.setValue('enableColors', false);
        form.setValue('colorVariants', []);
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

    const validateColorVariants = (colorVariants: ColorVariantInput[]): string[] => {
        const errors: string[] = [];

        if (colorVariants.length === 0) {
            return errors;
        }

        const hasDefault = colorVariants.some(color => color.isDefault);
        if (!hasDefault) {
            errors.push("At least one color must be set as default");
        }

        const names = colorVariants.map(c => c.colorName.toLowerCase());
        const uniqueNames = new Set(names);
        if (uniqueNames.size !== names.length) {
            errors.push("Color names must be unique");
        }

        const colorsWithoutImages = colorVariants.filter(c => !c.images || c.images.length === 0);
        if (colorsWithoutImages.length > 0) {
            errors.push(`${colorsWithoutImages.length} color(s) are missing images`);
        }

        return errors;
    };

    const validateProductCombinations = (combinations: any[]): string[] => {
        const errors: string[] = [];

        if (!combinations || combinations.length === 0) {
            return errors;
        }

        const skus = combinations
            .map(c => c.sku)
            .filter(sku => sku && sku.trim() !== '');
        const uniqueSkus = new Set(skus);
        if (uniqueSkus.size !== skus.length) {
            errors.push("Product combination SKUs must be unique");
        }

        const validCombinations = combinations.filter(combo =>
            combo &&
            combo.sku &&
            combo.sku.trim() !== '' &&
            typeof combo.basePrice === 'number' &&
            combo.basePrice >= 0
        );

        if (validCombinations.length > 0) {
            const hasDefault = validCombinations.some(combo => combo.isDefault === true);
            if (!hasDefault) {
                errors.push("At least one combination must be set as default");
            }
        }

        combinations.forEach((combo, index) => {
            if (!combo) return;

            if (!combo.sku || combo.sku.trim() === '') {
                errors.push(`Combination ${index + 1}: SKU is required`);
            }

            if (typeof combo.basePrice !== 'number' || combo.basePrice < 0) {
                errors.push(`Combination ${index + 1}: Valid price is required`);
            }

            if (combo.stockQuantity !== undefined && combo.stockQuantity !== null) {
                if (typeof combo.stockQuantity !== 'number' || combo.stockQuantity < 0) {
                    errors.push(`Combination ${index + 1}: Stock quantity must be a non-negative number`);
                }
            }

            if (combo.weight !== undefined && combo.weight !== null) {
                if (typeof combo.weight !== 'number' || combo.weight < 0) {
                    errors.push(`Combination ${index + 1}: Weight must be a non-negative number`);
                }
            }
        });

        return errors;
    };

    const validateStep = async (step: number): Promise<boolean> => {
        const fieldsToValidate: (keyof z.infer<typeof CreateProductSchema>)[] = [];

        switch (step) {
            case 1:
                fieldsToValidate.push('name', 'description', 'sku', 'basePrice');
                break;
            case 2:
                fieldsToValidate.push('categoryId', 'subcategoryId', 'productTypeId');
                break;
            case 3:
                const hasVariants = form.getValues('hasVariants');
                const variants = form.getValues('variants') || [];

                const nonColorVariants = variants.filter((variant: any) => {
                    if (!variant) return false;
                    const name = variant.name?.toLowerCase() || '';
                    const type = variant.type?.toLowerCase() || '';
                    const templateId = variant.templateId?.toLowerCase() || '';
                    const colorKeywords = ['color', 'colour', 'hue', 'shade', 'tint'];
                    return !colorKeywords.some(keyword =>
                        name.includes(keyword) ||
                        type.includes(keyword) ||
                        templateId.includes(keyword)
                    );
                });

                if (hasVariants && nonColorVariants.length > 0) {
                    const hasVariantWithValues = nonColorVariants.some((variant: any) =>
                        variant && variant.values && variant.values.length > 0
                    );

                    if (!hasVariantWithValues) {
                        toast.error("Please configure at least one variant option before proceeding");
                        return false;
                    }

                    const combinations = form.getValues('productCombinations') || [];

                    if (combinations.length > 0) {
                        const combinationErrors = validateProductCombinations(combinations);
                        if (combinationErrors.length > 0) {
                            toast.error(`Combination validation errors: ${combinationErrors.join(', ')}`);
                            return false;
                        }
                    }
                }
                break;
            case 4:
                fieldsToValidate.push('images');

                if (watchedEnableColors) {
                    const colorErrors = validateColorVariants(watchedColorVariants);
                    if (colorErrors.length > 0) {
                        toast.error(`Color validation errors: ${colorErrors.join(', ')}`);
                        return false;
                    }
                }
                break;
            case 5:
                return await form.trigger();
        }

        return fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;
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

    const onSubmit = async (values: z.infer<typeof CreateProductSchema>) => {
        const isValid = await validateStep(currentStep);
        if (!isValid) return;

        if (values.enableColors) {
            const colorErrors = validateColorVariants(values.colorVariants || []);
            if (colorErrors.length > 0) {
                toast.error(`Please fix color issues: ${colorErrors.join(', ')}`);
                return;
            }
        }

        if (values.hasVariants) {
            const combinationErrors = validateProductCombinations(values.productCombinations || []);
            if (combinationErrors.length > 0) {
                toast.error(`Please fix combination issues: ${combinationErrors.join(', ')}`);
                return;
            }
        }

        const transformedData = {
            ...values,
            hasColorVariants: values.enableColors && (values.colorVariants?.length || 0) > 0,
            colorVariants: values.colorVariants || [],
            variants: values.variants || [],
            productCombinations: values.productCombinations || [],
            tags: values.tags || [],
            images: values.images || []
        };

        console.log("transformedData: ", transformedData)

        createProductMutation.mutate(transformedData, {
            onSuccess: (result) => {
                if ('data' in result && result.data) {
                    toast.success("Product created successfully!");
                    router.push(`/admin/stores/${storeData.$id}/products`);
                }
            },
            onError: (error) => {
                console.error('Product creation failed:', error);
                toast.error('Failed to create product. Please try again.');
            }
        });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <BasicInfoStep
                        form={form}
                        storeData={storeData}
                        generateSKU={generateSKU}
                    />
                );
            case 2:
                return (
                    <CategoryStep
                        form={form}
                        categories={categories}
                        subcategories={subcategories}
                        productTypes={productTypes}
                        selectedCategory={selectedCategory}
                        selectedSubcategory={selectedSubcategory}
                        selectedProductType={selectedProductType}
                        availableVariants={availableVariants}
                        currentTag={currentTag}
                        setCurrentTag={setCurrentTag}
                        handleCategoryChange={handleCategoryChange}
                        handleSubcategoryChange={handleSubcategoryChange}
                        handleProductTypeChange={handleProductTypeChange}
                        addTag={addTag}
                        removeTag={removeTag}
                    />
                );
            case 3:
                return (
                    <VariantsStep
                        form={form}
                        availableVariants={availableVariants}
                        generateVariantCombinations={generateVariantCombinations}
                    />
                );
            case 4:
                return (
                    <ImagesStep
                        form={form}
                        previewImages={previewImages}
                    />
                );
            case 5:
                return (
                    <ReviewStep
                        form={form}
                        storeData={storeData}
                        categories={categories}
                        productTypes={productTypes}
                        selectedCategory={selectedCategory}
                        selectedProductType={selectedProductType}
                        previewImages={previewImages}
                    />
                );
            default:
                return null;
        }
    };

    // Get summary counts for the stepper
    const getVariantSummary = () => {
        const colorCount = watchedColorVariants.length;
        const variantCount = watchedVariants.filter(v => !isColorVariant(v)).length;
        const combinationCount = combinationFields.length;

        return { colorCount, variantCount, combinationCount };
    };

    const { colorCount, variantCount, combinationCount } = getVariantSummary();

    return (
        <div className="mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Create New Product</h1>
                    <p className="text-muted-foreground">
                        Add a new product to {storeData?.storeName} with comprehensive variant and color management
                    </p>
                </div>
            </div>

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

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {createProductMutation.isPending && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl">
                                <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                                <p className="mt-4 text-center">Creating product...</p>
                            </div>
                        </div>
                    )}

                    {createProductMutation.isError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {createProductMutation.error instanceof Error
                                    ? createProductMutation.error.message
                                    : "Failed to create product. Please try again."
                                }
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="min-h-[500px]">
                        {renderStepContent()}
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t bg-background sticky bottom-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handlePrevStep}
                            disabled={currentStep === 1 || createProductMutation.isPending}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Step {currentStep} of {steps.length}
                            </span>

                            {/* Enhanced summary badges */}
                            <div className="flex gap-1">
                                {colorCount > 0 && (
                                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                        <Palette className="h-3 w-3" />
                                        {colorCount} colors
                                    </Badge>
                                )}
                                {variantCount > 0 && (
                                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                                        <Settings className="h-3 w-3" />
                                        {variantCount} variants
                                    </Badge>
                                )}
                                {combinationCount > 0 && (
                                    <Badge variant="default" className="text-xs flex items-center gap-1">
                                        <Package className="h-3 w-3" />
                                        {combinationCount} combinations
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {currentStep < steps.length ? (
                            <Button
                                type="button"
                                onClick={handleNextStep}
                                disabled={createProductMutation.isPending}
                                className="flex items-center gap-2"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={createProductMutation.isPending}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                {createProductMutation.isPending ? (
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