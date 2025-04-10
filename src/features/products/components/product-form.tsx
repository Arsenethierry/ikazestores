"use client";

import Tiptap from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, DollarSign } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { createNewProduct } from "../actions/original-products-actions";
import { toast } from "sonner";
import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { MultiImageUploader } from "@/components/multiple-images-uploader";
import { useCurrentStoreId } from "@/hooks/use-workspace-id";
import { DocumentType, PhysicalStoreTypes } from "@/lib/types";
import { ProductSchema } from "@/lib/schemas/products-schems";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import colorsData from '@/data/products-colors.json';


export default function ProductForm({
    storeData,
    categoriesData
}: {
    storeData: PhysicalStoreTypes,
    categoriesData: {
        categories: DocumentType[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subcategoriesMap: Record<string, any[]>;
        error: string | null;
    };
}) {
    const storeId = useCurrentStoreId();
    const router = useRouter();

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
            colorImages: []
        },
        mode: "onChange",
    });

    const searchParams = useSearchParams();
    const editMode = searchParams.get("storeId");
    const selectedCategoryId = form.watch("categoryId");

    useEffect(() => {
        form.resetField("subcategoryIds");
    }, [selectedCategoryId, form]);

    const { execute, isPending, result } = useAction(createNewProduct, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                router.push(`/admin/stores/${storeData.$id}/products`)
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

    function onSubmit(values: z.infer<typeof ProductSchema>) {
        execute(values);
    }

    return (
        <Card className="max-w-5xl">
            <CardHeader>
                <CardTitle>{editMode ? "Edit Product" : "Create Product"}</CardTitle>
                <CardDescription>
                    {editMode
                        ? "Make changes to existing product"
                        : "Add new product"
                    }
                </CardDescription>
                {result.serverError && (
                    <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600">
                        <p className="text-sm">
                            <CircleAlert className="me-3 -mt-0.5 inline-flex opacity-60" size={16} aria-hidden="true" />
                            {result.serverError}
                        </p>
                    </div>
                )}

            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Product title" {...field} />
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
                                    <FormLabel>Product Price</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <DollarSign
                                                size={36}
                                                className="p-2 bg-muted  rounded-md"
                                            />
                                            <Input
                                                {...field}
                                                type="number"
                                                placeholder="Your price in USD"
                                                step="0.1"
                                                min={0}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Tiptap val={field.value} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                                    {category.categoryName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedCategoryId && (
                            <FormField
                                control={form.control}
                                name="subcategoryIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subcategories</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-col gap-2">
                                                {categoriesData.subcategoriesMap[selectedCategoryId]?.length > 0 ? (
                                                    categoriesData.subcategoriesMap[selectedCategoryId].map((subcategory) => (
                                                        <div
                                                            key={subcategory.$id}
                                                            className="flex items-center space-x-2"
                                                        >
                                                            <Checkbox
                                                                id={subcategory.$id}
                                                                checked={field.value?.includes(subcategory.$id)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValue = checked
                                                                        ? [...(field.value || []), subcategory.$id]
                                                                        : (field.value || []).filter((id) => id !== subcategory.$id);
                                                                    field.onChange(newValue)
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={subcategory.$id}
                                                                className="text-sm font-medium leading-none"
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

                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="images"
                            label="General product images (Ratio 1:1 (500 x 500 px)) max 5"
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

                        <FormField
                            control={form.control}
                            name="colorImages"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product colors</FormLabel>
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-4">
                                            {colorsData.map((color) => {
                                                const isSelected = field.value?.some(item => item.colorHex === color.hex);

                                                return (
                                                    <div key={color.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`color-${color.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => {
                                                                const currentColorImages = field.value || [];
                                                                if (checked) {
                                                                    if (!currentColorImages.some(item => item.colorHex === color.hex)) {
                                                                        field.onChange([...currentColorImages, { colorHex: color.hex, images: [], colorName: color.name }])
                                                                    }
                                                                } else {
                                                                    field.onChange(currentColorImages.filter(item => item.colorHex !== color.hex))
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`color-${color.id}`}
                                                            className="text-sm font-medium leading-none flex items-center gap-2"
                                                        >
                                                            <span
                                                                className="w-4 h-4 rounded-full inline-block"
                                                                style={{ backgroundColor: color.hex }}
                                                            />
                                                            {color.name}
                                                        </label>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />

                        {form.watch("colorImages")?.map((colorImage, index) => {
                            const color = colorsData.find(c => c.hex === colorImage.colorHex);

                            return (
                                <div key={colorImage.colorHex} className="mb-6">
                                    <FormItem>
                                        <FormLabel>{color?.name} Images</FormLabel>
                                        <FormControl>
                                            <MultiImageUploader
                                                files={colorImage.images}
                                                onChange={(newFiles) => {
                                                    const updatedColorImages = [...form.getValues("colorImages")];
                                                    updatedColorImages[index].images = newFiles;
                                                    form.setValue("colorImages", updatedColorImages);
                                                }}
                                                caption={`Upload images for ${color?.name} (Ratio 1:1, 500x500px max 5)`}
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
                            )
                        })}

                        <Button
                            className="w-full"
                            disabled={
                                isPending ||
                                !form.formState.isDirty
                            }
                            type="submit"
                        >
                            {editMode ? "Save Changes" : "Create Product"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}