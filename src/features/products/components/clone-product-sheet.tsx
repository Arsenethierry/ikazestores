"use client";

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea";
import { CurrentUserType, DocumentType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addNewVirtualProduct } from "../actions/virtual-products-actions";
import { toast } from "sonner";
import { useCurrrentStoreId } from "@/hooks/use-workspace-id";
import { useState } from "react";

const formSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: z.number().min(1, "Price must be greater than 0"),
    imageUrls: z.array(z.string()),
    imageIds: z.array(z.string()),
});
export const CloneProductSheet = ({ currentUser, product }: { currentUser: CurrentUserType, product: DocumentType }) => {
    const [open, setOpen] = useState(false);

    const storeId = useCurrrentStoreId();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: product.title,
            description: product.description,
            price: product.price,
            imageUrls: product.imageUrls || [],
            imageIds: product.imageIds || [],
        },
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
        const formData = {
            sellingPrice: values.price,
            clonedBy: currentUser?.$id,
            originalProductId: product.$id,
            storeId,
            purchasePrice: product.price,
            ...values
        };

        await executeAsync(formData)
        if (hasSucceeded) {
            setOpen(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size={'sm'}>Clone</Button>
            </SheetTrigger>
            <SheetContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <SheetHeader>
                            <SheetTitle>Clone Product</SheetTitle>
                            <SheetDescription>
                                Create a copy of this product with your own custom price.
                            </SheetDescription>
                        </SheetHeader>

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
                                    {product.imageUrls && product.imageUrls.map((url: string, index: number) => (
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
                                    name="imageUrls"
                                    render={({ field }) => <Input {...field} type="hidden" />}
                                />
                                <FormField
                                    control={form.control}
                                    name="imageIds"
                                    render={({ field }) => <Input {...field} type="hidden" />}
                                />
                            </div>
                        </div>

                        <SheetFooter>
                            <SheetClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </SheetClose>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Cloning..." : "Clone Product"}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}