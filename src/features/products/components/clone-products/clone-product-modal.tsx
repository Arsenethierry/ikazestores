/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CurrentUserType, OriginalProductTypes } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useRouter } from "next/navigation";
import SpinningLoader from "@/components/spinning-loader";
import { useCreateVirtualProduct, useGetProductCloneStatus } from "@/hooks/queries-and-mutations/use-virtual-products";

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    commission: z.number().min(0, "Commission must be greater than or equal to 0"),
    generalImageUrls: z.array(z.string()).default([]),
    combinationPrices: z.array(z.object({
        combinationId: z.string(),
        basePrice: z.number(),
        commission: z.number().min(0, "Commission must be ≥ 0"),
    })).default([])
});

type CloneProductProps = {
    currentUser: CurrentUserType,
    product: OriginalProductTypes,
    storeId: string
}

export const CloneProductModal = ({ currentUser, product, storeId }: CloneProductProps) => {
    const [open, setOpen] = useState(false);
    const [overriddenCombinations, setOverriddenCombinations] = useState<Set<number>>(new Set());

    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: product.name,
            description: product.description,
            commission: 0,
            generalImageUrls: product.images || [],
            combinationPrices: product.combinations && product.combinations.map((comb: any) => ({
                combinationId: comb.$id,
                basePrice: comb.price,
                commission: 0,
            })),
        },
        mode: "onChange",
    });

    const commission = form.watch("commission") || 0;
    const combinationPrices = form.watch("combinationPrices") || [];
    const finalPrice = product.basePrice + commission;

    useEffect(() => {
        const currentCombinations = form.getValues("combinationPrices");
        const updatedCombinations = currentCombinations && currentCombinations.map((combo, idx) => {
            if (!overriddenCombinations.has(idx)) {
                return {
                    ...combo,
                    commission: commission
                };
            }
            return combo;
        });

        form.setValue("combinationPrices", updatedCombinations);
    }, [commission, form, overriddenCombinations]);

    const { mutateAsync, isSuccess, data, isPending } = useCreateVirtualProduct();
    const { data: cloneStatus, isSuccess: cloneStatusSuccess, isPending: cloneStatusPending } = useGetProductCloneStatus(product.$id, storeId);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!currentUser) {
            toast.error("You must be logged in");
            return;
        }

        try {

            const processedCombinationPrices = values.combinationPrices.map(combPrice => ({
                combinationId: combPrice.combinationId,
                basePrice: combPrice.basePrice,
                commission: combPrice.commission,
                finalPrice: combPrice.basePrice + combPrice.commission,
            }));

            const formData = {
                sellingPrice: product.basePrice + values.commission,
                createdBy: currentUser.$id,
                originalProductId: product.$id,
                storeId,
                purchasePrice: product.basePrice,
                currency: product?.currency ?? 'USD',
                title: values.title,
                description: values.description,
                shortDescription: product?.shortDescription || '',
                commission: values.commission,
                generalImageUrls: values.generalImageUrls,
                combinationPrices: processedCombinationPrices,
            };

            await mutateAsync(formData)

            if (isSuccess) {
                setOpen(false);
                toast.success(data?.success);
                router.refresh();
                form.reset();
                setOverriddenCombinations(new Set());
            }
        } catch (error) {
            console.error("Clone product error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to clone product");
        } finally {
            setOpen(false)
        }
    };

    const isAlreadyCloned = cloneStatusSuccess && cloneStatus && cloneStatus.isCloned

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                disabled={isAlreadyCloned || cloneStatusPending}
                onClick={() => setOpen(true)}
            >
                {cloneStatusPending ? <SpinningLoader /> : isAlreadyCloned ? 'Added' : 'Add'}
            </Button>

            <ResponsiveModal open={open} onOpenChange={setOpen}>
                <div className="p-6 space-y-6 w-[700px]">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Clone Product</h2>
                        <p className="text-sm text-gray-500">
                            Create a copy of this product with your own commission.
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
                                    name="commission"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Commission</FormLabel>
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
                                            <FormDescription>
                                                Base Price: ${product.basePrice?.toFixed(2)} | Final Price: ${finalPrice?.toFixed(2)}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={"combinationPrices"}
                                    render={() => (
                                        <div className="space-y-4">
                                            <FormLabel>Combination Pricing</FormLabel>
                                            {product.combinations && product.combinations.map((combination: any, idx: number) => {
                                                const variantSummary = combination.variantStrings?.join(", ") ?? `Combination ${idx + 1}`;
                                                const combinationCommission = combinationPrices[idx]?.commission || 0;
                                                const finalCombinationPrice = combination.price + combinationCommission;
                                                const isOverridden = overriddenCombinations.has(idx);

                                                return (
                                                    <div key={combination.$id} className="border rounded-lg p-4">
                                                        <div className="mb-2 flex items-center gap-2">
                                                            <span className="font-medium">{variantSummary}</span>
                                                            {isOverridden && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                    Custom
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-4 items-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-muted-foreground">Base Price</span>
                                                                <span className="font-medium">${combination.price.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-muted-foreground">Commission</span>
                                                                <Input
                                                                    type="number"
                                                                    value={combinationCommission}
                                                                    onChange={(e) => {
                                                                        const value = parseFloat(e.target.value) || 0;
                                                                        form.setValue(`combinationPrices.${idx}.commission`, value);
                                                                        // Mark this combination as manually overridden
                                                                        setOverriddenCombinations(prev => new Set([...prev, idx]));
                                                                    }}
                                                                    className="w-[100px]"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-muted-foreground">Final Price</span>
                                                                <span className="font-medium text-green-600">
                                                                    ${finalCombinationPrice.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            {isOverridden && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        form.setValue(`combinationPrices.${idx}.commission`, commission);
                                                                        setOverriddenCombinations(prev => {
                                                                            const newSet = new Set(prev);
                                                                            newSet.delete(idx);
                                                                            return newSet;
                                                                        });
                                                                    }}
                                                                    className="text-xs"
                                                                >
                                                                    Reset
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                />

                                <div>
                                    <FormLabel>Images</FormLabel>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {product?.images && product?.images?.map((url: string, index: number) => (
                                            <div key={index} className="relative h-24 rounded-md overflow-hidden">
                                                <Image
                                                    src={url}
                                                    fill
                                                    alt={product.name}
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