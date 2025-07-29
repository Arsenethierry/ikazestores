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
import {
    Package,
    Info,
    Settings,
    Images,
    ArrowLeft,
    ArrowRight,
    Zap,
    ShoppingCart,
    CheckCircle,
    Loader2,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import CustomFormField, { FormFieldType } from '@/components/custom-field';
import { useFieldArray, useForm } from 'react-hook-form';
import Image from 'next/image';
import { VariantConfig } from '@/features/variants management/variant-config';
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
import {
    Category,
    ProductType,
    ProductVariant,
    Subcategory,
    VariantTemplate
} from '@/lib/types/catalog-types';
import { useRouter } from 'next/navigation';
import { useCreateOriginalProduct } from '@/hooks/queries-and-mutations/use-original-products-queries';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { CategoryStep } from './steps/CategoryStep';
import { VariantsStep } from './steps/VariantsStep';
import { ImagesStep } from './steps/ImagesStep';
import { ReviewStep } from './steps/ReviewStep';

type ProductFormData = z.infer<typeof CreateProductSchema>;

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
    const [availableVariants, setAvailableVariants] = useState<VariantTemplate[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const router = useRouter();

    const createProductMutation = useCreateOriginalProduct();

    const form = useForm<ProductFormData>({
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
            hasVariants: false,
            isDropshippingEnabled: true,
            images: [],
            tags: [],
            physicalStoreId: storeData.$id,
            storeLatitude: storeData.latitude,
            storeLongitude: storeData.longitude,
            storeCountry: storeData.country,
            variants: [],
            productCombinations: []
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
                variant && variant.values && variant.values.length > 0
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
        const variants = form.getValues("variants") || [];
        const basePrice = form.getValues("basePrice") || 0;
        const baseSku = form.getValues("sku") || '';

        if (variants.length === 0) {
            replaceCombinations([]);
            return;
        }

        const validVariants = variants.filter((variant): variant is NonNullable<typeof variant> =>
            variant != null &&
            variant.values != null &&
            variant.values.length > 0 &&
            variant.templateId != null &&
            variant.name != null &&
            variant.type != null
        );

        if (validVariants.length === 0) {
            replaceCombinations([]);
            return;
        }

        try {

            const combinations = generateCombinationsWithStrings(validVariants, basePrice, baseSku);

            const formCombinations = combinations.map(combo => ({
                variantStrings: combo.variantStrings,
                sku: combo.sku,
                basePrice: combo.price,
                stockQuantity: combo.quantity || 1,
                isActive: true,
                weight: combo.weight,
                dimensions: combo.dimensions ? JSON.stringify(combo.dimensions) : undefined,
                images: combo.images as File[] | undefined,
                variantValues: combo.variantValues
            }));

            if (formCombinations.length > 10) {
                toast.error("Maximum 10 variant combinations allowed.");
                replaceCombinations(formCombinations.slice(0, 10));
            } else {
                replaceCombinations(formCombinations);
            }
        } catch (error) {
            toast.error("Failed to generate variant combinations. Please check your variant configuration.");
            replaceCombinations([]);
        }
    }

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

    const onSubmit = async (values: ProductFormData) => {

        const isValid = await validateStep(currentStep);

        if (!isValid) return;

        const formData = {
            ...values,
            physicalStoreId: storeData.$id,
            storeLatitude: storeData.latitude,
            storeLongitude: storeData.longitude,
            storeCountry: storeData.country,
            currency: storeData.currency,
            isDropshippingEnabled: values.isDropshippingEnabled ?? true,
        };

        createProductMutation.mutate(formData, {
            onSuccess: (result) => {
                console.log("result: ", result)
                if ('data' in result && result.data) {
                    toast.success("Product created successfully!");
                    router.push(`/admin/stores/${storeData.$id}/products`);
                }
            },
            onError: (error) => {
                console.error('Product creation failed:', error);
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
                )
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

    return (
        <div className="mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Create New Product</h1>
                    <p className="text-muted-foreground">
                        Add a new product to {storeData?.storeName} with simple variant string filtering
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