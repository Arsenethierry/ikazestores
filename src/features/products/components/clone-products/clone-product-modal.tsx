"use client";

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CurrentUserType, OriginalProductTypes } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { ResponsiveModal } from "@/components/responsive-modal";
import { addNewVirtualProduct } from "../../actions/virtual-products-actions";

const formSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: z.number().min(1, "Price must be greater than 0"),
    generalImageUrls: z.array(z.string()),
    imageIds: z.array(z.string()),
});

type CloneProductProps = {
    currentUser: CurrentUserType,
    product: OriginalProductTypes,
    isAlreadyCloned: boolean;
    storeId: string
}

export const CloneProductModal = ({ currentUser, product, isAlreadyCloned, storeId }: CloneProductProps) => {
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: product.title,
            description: product.description,
            price: product.price,
            generalImageUrls: product.generalProductImages || [],
            imageIds: product.imageIds || [],
        },
        mode: "onChange",
    });

    const { isPending, executeAsync, hasSucceeded } = useAction(addNewVirtualProduct, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!currentUser) throw new Error("You must be logged in")
        const formData = {
            sellingPrice: values.price,
            createdBy: currentUser.$id,
            originalProductId: product.$id,
            storeId,
            purchasePrice: product.price,
            currency: product.store.currency,
            ...values
        };

        await executeAsync(formData)
        if (hasSucceeded) {
            setOpen(false);
        }
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                disabled={isAlreadyCloned}
                onClick={() => setOpen(true)}
            >
                {isAlreadyCloned ? 'Added' : 'Add'}
            </Button>

            <ResponsiveModal open={open} onOpenChange={setOpen}>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Clone Product</h2>
                        <p className="text-sm text-gray-500">
                            Create a copy of this product with your own custom price.
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled />
                                            </FormControl>
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
                                                <Textarea {...field} disabled className="resize-none" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        field.onChange(value === "" ? "" : parseFloat(value) || 0)
                                                    }}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div>
                                    <FormLabel>Images</FormLabel>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {product?.generalProductImages && product?.generalProductImages?.map((url: string, index: number) => (
                                            <div key={index} className="relative h-24 rounded-md overflow-hidden">
                                                <Image
                                                    src={url}
                                                    fill
                                                    alt={`Product image ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <FormDescription className="mt-2">
                                        Images will be copied from the original product.
                                    </FormDescription>
                                </div>
                                <div className="hidden">
                                    <FormField
                                        control={form.control}
                                        name="generalImageUrls"
                                        render={({ field }) => <Input {...field} type="hidden" />}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="imageIds"
                                        render={({ field }) => <Input {...field} type="hidden" />}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Cloning..." : "Clone Product"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </ResponsiveModal>
        </>
    )
}