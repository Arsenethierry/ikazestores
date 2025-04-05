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
import { PhysicalStoreTypes } from "@/lib/types";
import { ProductSchema } from "@/lib/schemas/products-schems";

export default function ProductForm({ storeData }: { storeData: PhysicalStoreTypes }) {
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
            storeOriginCountry: storeData.country
        },
        mode: "onChange",
    });

    const searchParams = useSearchParams();
    const editMode = searchParams.get("storeId");

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

                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="images"
                            label="product images (Ratio 1:1 (500 x 500 px)) max 5"
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