"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
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
    Palette
} from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PhysicalStoreTypes } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { CategoryStep } from './steps/CategoryStep';
import { VariantsStep } from './steps/VariantsStep';
import { ImagesStep } from './steps/ImagesStep';
import { ReviewStep } from './steps/ReviewStep';
import z from 'zod';
import { createProductAction } from '@/lib/actions/original-products-actions';
import { BasicInfoStepSchema, CategoryStepSchema, CreateProductSchema, ImagesStepSchema, VariantsStepSchema } from '@/lib/schemas/products-schems';
import { ProductCombination, ProductVariant, VariantOption } from '@/lib/schemas/product-variants-schema';
import { computeProductDenormalizedFields, recomputeDenormalizedFields } from '@/lib/utils/product-utils';

interface ProductFormProps {
    storeData: PhysicalStoreTypes;
}

type NonColorVariant = {
    templateId: string;
    name: string;
    type: "number" | "boolean" | "text" | "range" | "select" | "multiselect";
    values: {
        value: string;
        label: string;
        additionalPrice: number;
        metadata: { count: number };
    }[];
    required?: boolean;
    sortOrder?: number;
};

const toNonColorVariants = (variants: any[]): NonColorVariant[] =>
    (variants || [])
        .filter((v) => v && !(
            ["color", "colour", "hue", "shade", "tint", "paint"].some(k =>
                (v.name ?? "").toLowerCase().includes(k) ||
                (v.type ?? "").toLowerCase().includes(k) ||
                (v.templateId ?? "").toLowerCase().includes(k)
            )
        ))
        .map((v) => ({
            templateId: v.templateId,
            name: v.name,
            type: (v.type === "color" ? "text" : v.type) as NonColorVariant["type"],
            values: (v.values || []).map((opt: any) => ({
                value: opt?.value ?? "",
                label: opt?.label ?? opt?.value ?? "",
                additionalPrice: typeof opt?.additionalPrice === "number" ? opt.additionalPrice : 0,
                metadata: { count: opt?.metadata?.count ?? 0 },
            })),
            required: !!v.required,
            sortOrder: typeof v.sortOrder === "number" ? v.sortOrder : 0,
        }));

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

// Standardized color variant detection
const isColorVariant = (variant: any): boolean => {
    if (!variant) return false;
    const name = variant.name?.toLowerCase() || '';
    const type = variant.type?.toLowerCase() || '';
    const templateId = variant.templateId?.toLowerCase() || '';
    const colorKeywords = ['color', 'colour', 'hue', 'shade', 'tint', 'paint'];

    return type === 'color' || colorKeywords.some(keyword =>
        name.includes(keyword) || templateId.includes(keyword)
    );
};

export const ProductForm: React.FC<ProductFormProps> = ({ storeData }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [currentTag, setCurrentTag] = useState('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [availableVariants, setAvailableVariants] = useState<any[]>([]);
    const [categoryNames, setCategoryNames] = useState<{
        categoryName?: string;
        subcategoryName?: string;
        productTypeName?: string;
    }>({});

    const router = useRouter();

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
            hasVariants: false,
            isDropshippingEnabled: true,
            images: [],
            tags: [],
            physicalStoreId: storeData.$id,
            storeLatitude: storeData.latitude,
            storeLongitude: storeData.longitude,
            storeCountry: storeData.country,
            categoryId: '',
            subcategoryId: '',
            productTypeId: '',
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

    const { execute: executeCreateProduct, status: createStatus } = useAction(createProductAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.message);
                // Clear draft from localStorage
                localStorage.removeItem('draft-product');
                router.push(`/admin/stores/${storeData.$id}/products`);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to create product');
        },
    });

    const watchedImages = form.watch("images");
    const watchedHasVariants = form.watch("hasVariants");
    const watchedVariants = form.watch("variants") || [];
    const watchedColorVariants = form.watch("colorVariants") || [];
    const watchedCombinations = form.watch("productCombinations") || [];

    // Auto-save draft to localStorage
    useEffect(() => {
        const formData = form.getValues();
        const draftData = {
            ...formData,
            images: [], // Don't save file objects
            colorVariants: formData.colorVariants?.map(cv => ({
                ...cv,
                images: [] // Don't save file objects
            }))
        };
        localStorage.setItem('draft-product', JSON.stringify(draftData));
    }, [watchedVariants, watchedCombinations, watchedColorVariants, form]);

    // Load draft on mount
    useEffect(() => {
        const draft = localStorage.getItem('draft-product');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed.name || parsed.sku) {
                    toast.info('Draft loaded. Continue where you left off.');
                    // Only restore non-file fields
                    Object.keys(parsed).forEach(key => {
                        if (key !== 'images' && key !== 'colorVariants') {
                            form.setValue(key as any, parsed[key]);
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to load draft:', e);
            }
        }
    }, []);

    // // Update stock calculations when combinations change
    useEffect(() => {
        if (watchedCombinations && watchedCombinations.length > 0) {
            const totalStock = watchedCombinations.reduce(
                (sum, combo) => sum + (combo.stockQuantity || 0),
                0
            );
            const stockStatus = totalStock > 10 ? 'in_stock'
                : totalStock > 0 ? 'low_stock'
                    : 'out_of_stock';

            form.setValue('totalStock', totalStock);
            form.setValue('stockStatus', stockStatus);
        }
    }, [watchedCombinations, form]);

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

    // Recompute denorm opportunistically when user toggles key parts
    useEffect(() => {
        const values = form.getValues();
        const denorm = recomputeDenormalizedFields(
            { ...values, denormalized: values.denormalized || {} },
            {
                // We only pass changed bits here; for “live” recompute we reuse
                // your helper’s conditional logic.
                variants: values.variants,
                colorVariants: values.colorVariants,
                enableColors: values.enableColors,
                name: values.name,
                description: values.description,
                tags: values.tags,
            },
            categoryNames.categoryName
                ? {
                    categoryName: categoryNames.categoryName || "",
                    subcategoryName: categoryNames.subcategoryName || "",
                    productTypeName: categoryNames.productTypeName || "",
                }
                : undefined
        );

        if (Object.keys(denorm).length > 0) {
            // @ts-ignore
            form.setValue("denormalized", { ...(values.denormalized || {}), ...denorm }, { shouldDirty: true });
        }
    }, [
        form,
        // live recompute inputs:
        form.watch("variants"),
        form.watch("colorVariants"),
        form.watch("enableColors"),
        form.watch("name"),
        form.watch("description"),
        form.watch("tags"),
        categoryNames,
    ]);

    function generateCombinationsWithStrings(
        variants: ProductVariant[],
        basePrice: number,
        baseSku: string
    ): ProductCombination[] {
        const combinations: ProductCombination[] = [];
        const seenSkus = new Set<string>();

        if (variants.length === 0) {
            return combinations;
        }

        const variantValues: VariantOption[][] = variants
            .filter((v) => !!v && v.values.length > 0)
            .map(v => v.values);

        if (variantValues.length === 0) {
            return combinations;
        }

        function cartesianProduct(arrays: VariantOption[][]): VariantOption[][] {
            return arrays.reduce<VariantOption[][]>(
                (acc, curr) => {
                    const result: VariantOption[][] = [];
                    acc.forEach(a => {
                        curr.forEach(b => {
                            result.push([...a, b]);
                        });
                    });
                    return result;
                },
                [[]]
            );
        }

        const products = cartesianProduct(variantValues);

        products.forEach((combination, index) => {
            const variantValuesMap: Record<string, string> = {};
            const variantStrings: string[] = [];

            combination.forEach((value, variantIndex) => {
                const variant = variants[variantIndex];
                variantValuesMap[variant.templateId] = value.value;
                variantStrings.push(`${variant.name}: ${value.label || value.value}`);
            });

            // Calculate price based on additional prices
            let calculatedPrice = basePrice;
            combination.forEach((value) => {
                if (value.additionalPrice) {
                    calculatedPrice += value.additionalPrice;
                }
            });

            // Generate SKU
            const skuSuffixes: string[] = [];
            combination.forEach((value, variantIndex) => {
                const variant = variants[variantIndex];
                let suffix = '';

                const variantName = variant.name.toLowerCase();
                if (variantName.includes('size')) {
                    suffix = value.value.toUpperCase();
                } else if (variantName.includes('storage')) {
                    suffix = value.value.replace(/gb/i, 'G').replace(/tb/i, 'T').toUpperCase();
                } else if (variantName.includes('ram') || variantName.includes('memory')) {
                    suffix = value.value.replace(/gb/i, 'R').toUpperCase();
                } else {
                    suffix = value.value.substring(0, 3).toUpperCase();
                }
                skuSuffixes.push(suffix);
            });

            let generatedSKU = skuSuffixes.length > 0
                ? `${baseSku}-${skuSuffixes.join('-')}`
                : baseSku;

            // Check for duplicate SKUs
            if (seenSkus.has(generatedSKU)) {
                console.warn(`Duplicate SKU detected: ${generatedSKU}`);
                generatedSKU = `${generatedSKU}-${index}`;
            }
            seenSkus.add(generatedSKU);

            const combinationData: ProductCombination = {
                id: `combination-${index}`,
                variantValues: variantValuesMap,
                sku: generatedSKU,
                basePrice: Math.max(0, calculatedPrice),
                stockQuantity: 1,
                isDefault: index === 0,
                isActive: true,
                variantStrings,
            };

            combinations.push(combinationData);
        });

        return combinations;
    }

    const generateVariantCombinations = useCallback(() => {
        const rawVariants = form.getValues("variants") || [];
        const normalized = toNonColorVariants(rawVariants);

        const basePrice = form.getValues("basePrice") || 0;
        const baseSku = form.getValues("sku") || '';

        if (!normalized.length) {
            replaceCombinations([]);
            return;
        }

        const validVariants = rawVariants.filter((variant): variant is NonNullable<typeof variant> =>
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

        // Validate all variants have values
        const hasInvalidVariants = validVariants.some(v => !v.values || v.values.length === 0);
        if (hasInvalidVariants) {
            toast.error("All variants must have at least one value configured");
            return;
        }

        try {
            const combinations = generateCombinationsWithStrings(normalized, basePrice, baseSku);

            const formCombinations = combinations.map((combo, index) => ({
                variantStrings: combo.variantStrings,
                sku: combo.sku,
                basePrice: combo.basePrice,
                stockQuantity: combo.stockQuantity || 1,
                weight: combo.weight,
                dimensions: combo.dimensions,
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
            console.error('Combination generation error:', error);
            toast.error("Failed to generate variant combinations. Please check your variant configuration.");
            replaceCombinations([]);
        }
    }, [form, replaceCombinations, availableVariants]);

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
        const timestamp = Date.now().toString().slice(-4);
        const sku = `${name.slice(0, 3).toUpperCase()}-${timestamp}`;
        form.setValue('sku', sku);
    };

    const validateStep = async (step: number): Promise<boolean> => {
        const values = form.getValues();

        try {
            switch (step) {
                case 1: {
                    const result = BasicInfoStepSchema.safeParse({
                        name: values.name,
                        description: values.description,
                        shortDescription: values.shortDescription,
                        sku: values.sku,
                        basePrice: values.basePrice,
                        currency: values.currency,
                        status: values.status,
                        featured: values.featured,
                        isDropshippingEnabled: values.isDropshippingEnabled,
                    });

                    if (!result.success) {
                        const errors = result.error.flatten().fieldErrors;
                        const firstError = Object.values(errors)[0]?.[0];
                        if (firstError) {
                            toast.error(firstError);
                        }
                        return false;
                    }
                    return true;
                }

                case 2: {
                    const result = CategoryStepSchema.safeParse({
                        categoryId: values.categoryId,
                        subcategoryId: values.subcategoryId,
                        productTypeId: values.productTypeId,
                        tags: values.tags,
                    });

                    if (!result.success) {
                        const errors = result.error.flatten().fieldErrors;
                        const firstError = Object.values(errors)[0]?.[0];
                        if (firstError) {
                            toast.error(firstError);
                        }
                        return false;
                    }
                    return true;
                }

                case 3: {
                    const result = VariantsStepSchema.safeParse({
                        hasVariants: values.hasVariants,
                        variants: values.variants,
                        productCombinations: values.productCombinations,
                    });

                    if (!result.success) {
                        const errors = result.error.flatten();
                        const firstError = errors.fieldErrors ?
                            Object.values(errors.fieldErrors)[0]?.[0] :
                            errors.formErrors[0];
                        if (firstError) {
                            toast.error(firstError);
                        }
                        return false;
                    }

                    // Additional validation: check if at least one combination is default
                    if (values.hasVariants && values.productCombinations && values.productCombinations.length > 0) {
                        const hasDefault = values.productCombinations.some(c => c.isDefault);
                        if (!hasDefault) {
                            toast.error("At least one combination must be set as default");
                            return false;
                        }
                    }

                    return true;
                }

                case 4: {
                    const result = ImagesStepSchema.safeParse({
                        images: values.images,
                        enableColors: values.enableColors,
                        colorVariants: values.colorVariants,
                    });

                    if (!result.success) {
                        const errors = result.error.flatten();
                        const firstError = errors.fieldErrors ?
                            Object.values(errors.fieldErrors)[0]?.[0] :
                            errors.formErrors[0];
                        if (firstError) {
                            toast.error(firstError);
                        }
                        return false;
                    }
                    return true;
                }

                case 5:
                    return await form.trigger();

                default:
                    return true;
            }
        } catch (error) {
            console.error('Validation error:', error);
            toast.error('Validation failed. Please check your inputs.');
            return false;
        }
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
        try {
            const denorm = await computeProductDenormalizedFields(values, {
                categoryName: categoryNames.categoryName || "",
                subcategoryName: categoryNames.subcategoryName || "",
                productTypeName: categoryNames.productTypeName || "",
            });

            const transformedData = {
                ...values,
                hasColorVariants: values.enableColors && (values.colorVariants?.length || 0) > 0,
                denormalized: {
                    ...(values.denormalized || {}),
                    ...denorm,
                },
            };

            executeCreateProduct(transformedData);
        } catch (error) {
            toast.error("Failed to create product. Please try again.");
            console.error("Submit error:", error);
        }
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
                        currentTag={currentTag}
                        setCurrentTag={setCurrentTag}
                        addTag={addTag}
                        removeTag={removeTag}
                        onVariantTemplatesLoaded={setAvailableVariants}
                        onCategoryNamesChange={(names) => setCategoryNames(names)}
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
                        previewImages={previewImages}
                        onGoToStep={setCurrentStep}
                    />
                );
            default:
                return null;
        }
    };

    const getVariantSummary = () => {
        const colorCount = watchedColorVariants.length;
        const variantCount = watchedVariants.filter(v => !isColorVariant(v)).length;
        const combinationCount = combinationFields.length;
        return { colorCount, variantCount, combinationCount };
    };

    const { colorCount, variantCount, combinationCount } = getVariantSummary();
    const isSubmitting = createStatus === 'executing';

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
                    {isSubmitting && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                                <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                                <p className="mt-4 text-center">Creating product...</p>
                            </div>
                        </div>
                    )}

                    <div className="min-h-[500px]">
                        {renderStepContent()}
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t bg-background sticky bottom-0 pb-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handlePrevStep}
                            disabled={currentStep === 1 || isSubmitting}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Step {currentStep} of {steps.length}
                            </span>

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
                                disabled={isSubmitting}
                                className="flex items-center gap-2"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
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