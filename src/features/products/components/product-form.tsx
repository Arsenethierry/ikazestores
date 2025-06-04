/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Tiptap from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, DollarSign, Eye, Info, Package, Settings } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { createNewProduct } from "../actions/original-products-actions";
import { toast } from "sonner";
import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { MultiImageUploader } from "@/components/multiple-images-uploader";
import { CategoryTypes, PhysicalStoreTypes, ProductType, VariantGroup, VariantTemplate } from "@/lib/types";
import { ProductSchema } from "@/lib/schemas/products-schems";
import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import colorsData from '@/data/products-colors.json';
import { ColorSelectorFormField } from "./product-color-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductVariantSelector } from "./variants/product-variant-selector";
import { ProductVariantConfig } from "@/features/variants management/product-variant-config";

interface ProductFormProps {
    storeData: PhysicalStoreTypes;
    categoriesData: {
        categories: CategoryTypes[];
        subcategoriesMap: Record<string, any[]>;
        error: string | null;
    };
    productTypes: ProductType[];
    variantTemplates: VariantTemplate[];
    variantGroups: VariantGroup[];
    storeId: string;
}

export default function ProductForm({
    storeData,
    categoriesData,
    storeId,
    productTypes,
    variantGroups,
    variantTemplates
}: ProductFormProps) {
    const router = useRouter();

    const searchParams = useSearchParams();
    const editMode = searchParams.get("storeId");
    const [currentTab, setCurrentTab] = useState("basic");
    const [createdProductId, setCreatedProductId] = useState<string | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});
    console.log(setCreatedProductId)
    const form = useForm<z.infer<typeof ProductSchema>>({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            title: "",
            description: "",
            price: 0,
            storeId,
            storeLat: storeData.latitude,
            storeLong: storeData.longitude,
            storeOriginCountry: storeData.country,
            categoryId: "",
            subcategoryIds: [],
            colorImages: [],
            productTypeId: "",
            selectedVariants: {},
            generateVariantCombinations: true,
        },
        mode: "onChange",
    });

    const selectedCategoryId = form.watch("categoryId");
    const selectedProductTypeId = form.watch("productTypeId");

    const filteredProductTypes = useMemo(() => {
        if (!selectedCategoryId) return productTypes;
        return productTypes.filter(type => type.categoryId === selectedCategoryId);
    }, [selectedCategoryId, productTypes]);

    const filteredVariantTemplates = useMemo(() => {
        if (!selectedProductTypeId) return [];
        return variantTemplates.filter(template =>
            template.productTypes?.includes(selectedProductTypeId) ||
            template.productTypeIds?.includes(selectedProductTypeId)
        );
    }, [selectedProductTypeId, variantTemplates]);

    console.log("variantTemplates: ", variantTemplates)


    const filteredVariantGroups = useMemo(() => {
        if (!selectedProductTypeId) return [];
        return variantGroups.filter(group =>
            group.productType === selectedProductTypeId
        );
    }, [selectedProductTypeId, variantGroups]);

    useEffect(() => {
        form.resetField("subcategoryIds");
        form.resetField("productTypeId");
    }, [selectedCategoryId, form]);

    useEffect(() => {
        setSelectedVariants({});
        form.setValue("selectedVariants", {});
    }, [selectedProductTypeId, form]);

    const { execute, isPending, result } = useAction(createNewProduct, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                // if (data.productId) {
                //     setCreatedProductId(data.productId);
                //     setCurrentTab("variants");
                // } else {
                //     router.push(`/admin/stores/${storeData.$id}/products`);
                // }
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const handleImageChange = (newFiles: File[]) => {
        form.setValue("images", newFiles, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
        });

        form.trigger("images");
    };

    const handleVariantChange = (variants: Record<string, any>) => {
        setSelectedVariants(variants);
        form.setValue("selectedVariants", variants);
    };

    function onSubmit(values: z.infer<typeof ProductSchema>) {
        execute(values);
    }

    const canProceedToVariants = () => {
        const basicFields = form.getValues(['title', 'description', 'price', 'categoryId', 'productTypeId', 'images']);
        return basicFields.every(field =>
            field !== undefined && field !== '' &&
            (Array.isArray(field) ? field.length > 0 : (typeof field === 'number' ? field > 0 : true))
        )
    };

    const selectedProductType = productTypes && productTypes.find(type => type.$id === selectedProductTypeId);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {editMode ? "Edit Product" : "Create New Product"}
                    </CardTitle>
                    <CardDescription>
                        {editMode
                            ? "Make changes to existing product"
                            : "Create a comprehensive product with variants and configurations"
                        }
                    </CardDescription>
                    {result.serverError && (
                        <Alert variant="destructive">
                            <CircleAlert className="h-4 w-4" />
                            <AlertDescription>{result.serverError}</AlertDescription>
                        </Alert>
                    )}
                </CardHeader>
            </Card>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                <Card>
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic" className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Basic Information
                            </TabsTrigger>
                            <TabsTrigger
                                value="variants"
                                disabled={!canProceedToVariants() && !createdProductId}
                                className="flex items-center gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                Variants & Options
                                {Object.keys(selectedVariants).length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {Object.keys(selectedVariants).length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="combinations"
                                disabled={!createdProductId}
                                className="flex items-center gap-2"
                            >
                                <Eye className="h-4 w-4" />
                                Review & Configure
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    <CardContent>
                        <Form {...form}>
                            <TabsContent value="basic" className="space-y-6">
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter product title" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Base Price (USD)</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign size={36} className="p-2 bg-muted rounded-md" />
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            placeholder="0.00"
                                                            step="0.01"
                                                            min={0}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="categoryId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a category" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {categoriesData.categories.map((category) => (
                                                                <SelectItem key={category.$id} value={category.$id}>
                                                                    <div className="flex items-center gap-2">
                                                                        {/* {category.iconUrl && (
                                                                            <img src={category.iconUrl} alt="" className="w-4 h-4" />
                                                                        )} */}
                                                                        {category.categoryName}
                                                                    </div>
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
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product Type</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={!selectedCategoryId}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a product type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {filteredProductTypes.map((type) => (
                                                                <SelectItem key={type.$id} value={type.$id}>
                                                                    <div>
                                                                        <div className="font-medium">{type.name}</div>
                                                                        {type.description && (
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {type.description}
                                                                            </div>
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

                                    {selectedCategoryId && (
                                        <FormField
                                            control={form.control}
                                            name="subcategoryIds"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Subcategories (Optional)</FormLabel>
                                                    <FormControl>
                                                        <div className="flex flex-wrap gap-2">
                                                            {categoriesData.subcategoriesMap[selectedCategoryId]?.length > 0 ? (
                                                                categoriesData.subcategoriesMap[selectedCategoryId].map((subcategory) => (
                                                                    <div
                                                                        key={subcategory.$id}
                                                                        className="flex items-center space-x-2 bg-muted p-2 rounded-md"
                                                                    >
                                                                        <Checkbox
                                                                            id={subcategory.$id}
                                                                            checked={field.value?.includes(subcategory.$id)}
                                                                            onCheckedChange={(checked) => {
                                                                                const newValue = checked
                                                                                    ? [...(field.value || []), subcategory.$id]
                                                                                    : (field.value || []).filter((id) => id !== subcategory.$id);
                                                                                field.onChange(newValue);
                                                                            }}
                                                                        />
                                                                        <label
                                                                            htmlFor={subcategory.$id}
                                                                            className="text-sm font-medium leading-none cursor-pointer"
                                                                        >
                                                                            {subcategory.subCategoryName}
                                                                        </label>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-muted-foreground text-sm">
                                                                    No subcategories available for this category
                                                                </div>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {selectedProductType && (
                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>{selectedProductType.name}</strong>
                                                {selectedProductType.description && (
                                                    <span> - {selectedProductType.description}</span>
                                                )}
                                                <br />
                                                <span className="text-sm text-muted-foreground">
                                                    This product type has {filteredVariantTemplates.length} available variant templates.
                                                </span>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Tiptap
                                                        val={field.value}
                                                    // onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <CustomFormField
                                        fieldType={FormFieldType.SKELETON}
                                        control={form.control}
                                        name="images"
                                        label="General Product Images (1:1 ratio, 500x500px recommended)"
                                        renderSkeleton={(field) => (
                                            <FormControl>
                                                <MultiImageUploader
                                                    files={field.value}
                                                    onChange={handleImageChange}
                                                    caption="SVG, PNG, JPG or GIF (max. 2000 x 500 px)"
                                                    maxFiles={5}
                                                />
                                            </FormControl>
                                        )}
                                    />

                                    <Separator />
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-medium">Color Variants</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Add color-specific images and pricing
                                            </p>
                                        </div>
                                        <ColorSelectorFormField form={form} />
                                        {(form.watch("colorImages") ?? []).map((colorImage, index) => {
                                            const color = colorsData.find(c => c.hex === colorImage.colorHex);

                                            return (
                                                <div key={colorImage.colorHex} className="mb-6 p-4 border rounded-lg">
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <div
                                                                className="w-4 h-4 rounded border"
                                                                style={{ backgroundColor: colorImage.colorHex }}
                                                            />
                                                            <span>{color?.name || "Custom"} Images</span>
                                                            {colorImage.additionalPrice > 0 && (
                                                                <Badge variant="secondary">
                                                                    +${colorImage.additionalPrice.toFixed(2)}
                                                                </Badge>
                                                            )}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <MultiImageUploader
                                                                files={colorImage.images}
                                                                onChange={(newFiles) => {
                                                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                                                    // @ts-ignore
                                                                    const updatedColorImages = [...form.getValues("colorImages")];
                                                                    updatedColorImages[index].images = newFiles;
                                                                    form.setValue("colorImages", updatedColorImages);
                                                                }}
                                                                caption={`Upload images for ${color?.name || "Custom"} (1:1 ratio, 500x500px max 5)`}
                                                                maxFiles={5}
                                                            />
                                                        </FormControl>
                                                        {form.formState.errors.colorImages?.[index]?.images && (
                                                            <FormMessage>
                                                                {form.formState.errors.colorImages[index].images.message}
                                                            </FormMessage>
                                                        )}
                                                    </FormItem>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.push(`/admin/stores/${storeData.$id}/products`)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="min-w-[120px]"
                                            disabled={isPending || !canProceedToVariants()}
                                            type="submit"
                                        >
                                            {isPending ? "Creating..." : "Create Product"}
                                        </Button>
                                    </div>
                                </form>
                            </TabsContent>

                            <TabsContent value="variants" className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-medium">Configure Product Variants</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Select and configure variants for your product based on the selected product type.
                                        </p>
                                    </div>
                                    {filteredVariantTemplates.length > 0 ? (
                                        <ProductVariantSelector
                                            variantTemplates={filteredVariantTemplates}
                                            variantGroups={filteredVariantGroups}
                                            onVariantChange={handleVariantChange}
                                            initialVariants={selectedVariants}
                                        />
                                    ) : (
                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                No variant templates available for the selected product type.
                                                You can still create the product without variants or add variants later.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="flex justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCurrentTab("basic")}
                                        >
                                            Back to Basic Info
                                        </Button>
                                        <Button
                                            onClick={() => setCurrentTab("combinations")}
                                            disabled={!createdProductId}
                                        >
                                            Configure Combinations
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="combinations" className="space-y-6">
                                {createdProductId ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-medium">Variant Combinations & SKUs</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Generate and manage specific product combinations with individual pricing and inventory.
                                            </p>
                                        </div>

                                        <ProductVariantConfig
                                            productId={createdProductId}
                                            productTypeId={selectedProductTypeId}
                                            storeId={storeId}
                                            basePrice={form.getValues('price')}
                                            userId={storeData.createdBy}
                                        />

                                        <div className="flex justify-between">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setCurrentTab("variants")}
                                            >
                                                Back to Variants
                                            </Button>
                                            <Button
                                                onClick={() => router.push(`/admin/stores/${storeData.$id}/products`)}
                                            >
                                                Finish & View Products
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            Please complete the previous steps to configure variant combinations.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </TabsContent>
                        </Form>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    )
}