"use client";

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { ProductDescription } from "../product-description";
import { ProductCombinations } from "@/lib/types/appwrite/appwrite";
import { CreateAffiliateImportSchema } from "@/lib/schemas/products-schems";
import { useAction } from "next-safe-action/hooks";
import { checkProductSyncStatus, importProductAction } from "@/lib/actions/affiliate-product-actions";
import { getProductsCombinations } from "@/lib/actions/original-products-actions";

type CloneProductProps = {
    currentUser: CurrentUserType,
    product: OriginalProductTypes,
    virtualStoreId: string
}

export const CloneProductModal = ({ currentUser, product, virtualStoreId }: CloneProductProps) => {
    const [open, setOpen] = useState(false);
    const [overriddenCombinations, setOverriddenCombinations] = useState<Set<string>>(new Set());
    const [combinations, setCombinations] = useState<ProductCombinations[]>([]);
    const [isLoadingCombinations, setIsLoadingCombinations] = useState(false);
    const [combinationsError, setCombinationsError] = useState<string | null>(null);
    const [combinationsCount, setCombinationsCount] = useState(0);
    const [importStatus, setImportStatus] = useState<{ isCloned: boolean } | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    const router = useRouter();

    // Fetch combinations when modal opens
    useEffect(() => {
        if (open && product.hasVariants) {
            loadCombinations();
        }
    }, [open, product.hasVariants, product.$id]);

    // Check import status when modal opens
    useEffect(() => {
        if (open) {
            checkImportStatus();
        }
    }, [open]);

    const loadCombinations = async () => {
        setIsLoadingCombinations(true);
        setCombinationsError(null);

        try {
            const result = await getProductsCombinations(product.$id, {
                limit: 100,
                activeOnly: true,
                orderBy: '$createdAt',
                orderType: 'asc'
            });

            if (result.success) {
                setCombinations(result.combinations);
                setCombinationsCount(result.total);
            } else {
                setCombinationsError(result.error || 'Failed to load combinations');
            }
        } catch (error) {
            console.error('Error loading combinations:', error);
            setCombinationsError('Failed to load combinations');
        } finally {
            setIsLoadingCombinations(false);
        }
    };

    const checkImportStatus = async () => {
        setIsCheckingStatus(true);
        try {
            const result = await checkProductSyncStatus(product.$id, virtualStoreId);
            setImportStatus({ isCloned: result.isCloned });
        } catch (error) {
            console.error('Error checking import status:', error);
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const form = useForm<z.infer<typeof CreateAffiliateImportSchema>>({
        resolver: zodResolver(CreateAffiliateImportSchema),
        defaultValues: {
            commission: 0,
            selectedCombinations: [],
            customCombinationPricing: [],
            productId: product.$id,
            virtualStoreId,
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (combinations.length > 0) {
            const combinationIds = combinations.map(comb => comb.$id);
            const customPricing = combinations.map(comb => ({
                combinationId: comb.$id,
                customCommission: 0,
            }));

            form.setValue("selectedCombinations", combinationIds);
            form.setValue("customCombinationPricing", customPricing);
        }
    }, [combinations, form]);

    const commission = form.watch("commission") || 0;
    const selectedCombinations = form.watch("selectedCombinations") || [];
    const customCombinationPricing = form.watch("customCombinationPricing") || [];
    const finalPrice = product.basePrice + commission;

    useEffect(() => {
        const currentCombinations = form.getValues("customCombinationPricing");
        const updatedCombinations = currentCombinations?.map((combo) => {
            if (!overriddenCombinations.has(combo.combinationId)) {
                return {
                    ...combo,
                    customCommission: commission
                };
            }
            return combo;
        });

        form.setValue("customCombinationPricing", updatedCombinations);
    }, [commission, form, overriddenCombinations]);

    const { execute: importProduct, status, result } = useAction(importProductAction, {
        onSuccess: ({ data }) => {
            setOpen(false);
            toast.success(data?.message || `Product imported with ${selectedCombinations.length} combination(s)!`);
            router.refresh();
            form.reset();
            setOverriddenCombinations(new Set());
            checkImportStatus();
        },
        onError: ({ error }) => {
            console.error("Import product error:", error);
            toast.error(error.serverError || "Failed to import product");
        },
    });

    const isPending = status === "executing";

    const onSubmit = async (values: z.infer<typeof CreateAffiliateImportSchema>) => {
        if (!currentUser) {
            toast.error("You must be logged in");
            return;
        }

        try {
            const filteredCustomPricing = values.customCombinationPricing && values.customCombinationPricing.filter(
                pricing => values.selectedCombinations.includes(pricing.combinationId)
            );

            const importData = {
                virtualStoreId: virtualStoreId,
                productId: product.$id,
                commission: values.commission,
                physicalStoreId: product.physicalStoreId,
                selectedCombinations: values.selectedCombinations,
                customCombinationPricing: filteredCustomPricing && filteredCustomPricing.length > 0
                    ? filteredCustomPricing
                    : undefined
            };

            console.log("gggggggg: ", importData);

            importProduct(importData);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to submit");
        }
    };

    const handleSelectAllCombinations = (checked: boolean) => {
        if (checked) {
            form.setValue("selectedCombinations", combinations.map((comb: ProductCombinations) => comb.$id));
        } else {
            form.setValue("selectedCombinations", []);
        }
    };

    const handleCombinationToggle = (combinationId: string, checked: boolean) => {
        const current = form.getValues("selectedCombinations");
        if (checked) {
            form.setValue("selectedCombinations", [...current, combinationId]);
        } else {
            form.setValue("selectedCombinations", current.filter(id => id !== combinationId));
        }
    };

    const isAlreadyImported = importStatus?.isCloned;
    const allCombinationsSelected = selectedCombinations.length === combinations.length;
    const noCombinationsSelected = selectedCombinations.length === 0;

    const getCombinationsDisplayText = () => {
        if (!product.hasVariants) return "No variants";
        if (isLoadingCombinations) return "Loading...";
        if (combinationsError) return "Error loading";
        return `${combinationsCount} combinations`;
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                disabled={isAlreadyImported || isCheckingStatus}
                onClick={() => setOpen(true)}
            >
                {isCheckingStatus ? <SpinningLoader /> : isAlreadyImported ? 'Added' : 'Import'}
            </Button>

            <ResponsiveModal open={open} onOpenChange={setOpen}>
                <div className="w-full max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="px-6 py-4 border-b bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Import Product</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Select combinations and set commission pricing for your virtual store.
                                </p>
                            </div>
                            <Badge variant="secondary" className="ml-4">
                                {selectedCombinations.length} of {combinations.length} selected
                            </Badge>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 space-y-6 bg-gray-50 max-h-[75vh] overflow-y-auto">
                        {/* Product Preview Card */}
                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex gap-4">
                                {product.images?.[0] && (
                                    <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 border">
                                        <Image
                                            src={product.images[0]}
                                            fill
                                            alt={product.name}
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{product.name}</h3>
                                    <div className="mb-3">
                                        {product.shortDescription ? (
                                            <p className="text-sm text-gray-600 line-clamp-2">{product.shortDescription}</p>
                                        ) : (
                                            <div className="text-sm text-gray-600">
                                                <ProductDescription
                                                    description={product.description}
                                                    maxLength={150}
                                                    truncate={true}
                                                    className="prose-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">Base Price:</span>
                                            <span className="font-semibold text-gray-900">${product.basePrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">Currency:</span>
                                            <span className="font-medium text-gray-900">{product.currency}</span>
                                        </div>
                                        {product.hasVariants && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">Variants:</span>
                                                <span className="font-medium text-gray-900">{getCombinationsDisplayText()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Commission Section */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <FormField
                                        control={form.control}
                                        name="commission"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-semibold text-gray-900">
                                                    Default Commission Amount
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value === "" ? "" : parseFloat(value) || 0)
                                                        }}
                                                        value={field.value ?? ""}
                                                        placeholder="Enter default commission amount"
                                                        min="0"
                                                        step="0.01"
                                                        className="text-base"
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Set your commission markup for this product
                                                </FormDescription>
                                                <div className="flex justify-between items-center pt-2 px-3 py-2 bg-gray-50 rounded-md border mt-2">
                                                    <span className="text-sm text-gray-600">
                                                        Base: {product.basePrice} {product.currency}
                                                    </span>
                                                    <span className="text-sm font-semibold text-green-600">
                                                        Final: {finalPrice.toFixed(2)} {product.currency}
                                                    </span>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {product.hasVariants && (
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <FormLabel className="text-base font-semibold text-gray-900">
                                                        Product Combinations
                                                    </FormLabel>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Select which combinations to import and customize their commission.
                                                    </p>
                                                </div>

                                                {!isLoadingCombinations && combinations.length > 0 && (
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="select-all"
                                                            checked={allCombinationsSelected}
                                                            onCheckedChange={handleSelectAllCombinations}
                                                        />
                                                        <label
                                                            htmlFor="select-all"
                                                            className="text-sm font-medium text-gray-700 cursor-pointer"
                                                        >
                                                            Select All
                                                        </label>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Loading State */}
                                            {isLoadingCombinations && (
                                                <div className="flex items-center justify-center py-8">
                                                    <SpinningLoader />
                                                    <span className="ml-2 text-sm text-gray-600">Loading combinations...</span>
                                                </div>
                                            )}

                                            {/* Error State */}
                                            {combinationsError && (
                                                <div className="text-center py-8">
                                                    <p className="text-sm text-red-600">{combinationsError}</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-2"
                                                        onClick={loadCombinations}
                                                    >
                                                        Retry
                                                    </Button>
                                                </div>
                                            )}

                                            {/* No Combinations */}
                                            {!isLoadingCombinations && !combinationsError && combinations.length === 0 && product.hasVariants && (
                                                <div className="text-center py-8">
                                                    <p className="text-sm text-gray-600">No active combinations found for this product</p>
                                                </div>
                                            )}

                                            {/* Combinations List */}
                                            {!isLoadingCombinations && combinations.length > 0 && (
                                                <FormField
                                                    control={form.control}
                                                    name="selectedCombinations"
                                                    render={() => (
                                                        <FormItem>
                                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                                {combinations.map((combination: ProductCombinations, idx: number) => {
                                                                    const isSelected = selectedCombinations.includes(combination.$id);
                                                                    const variantSummary = combination.variantStrings?.join(", ") ?? `Combination ${idx + 1}`;
                                                                    const combinationPricing = customCombinationPricing.find(p => p.combinationId === combination.$id);
                                                                    const combinationCommission = combinationPricing?.customCommission || 0;
                                                                    const finalCombinationPrice = combination.basePrice + combinationCommission;
                                                                    const isOverridden = overriddenCombinations.has(combination.$id);

                                                                    return (
                                                                        <div
                                                                            key={combination.$id}
                                                                            className={`border rounded-lg p-4 transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                                                                }`}
                                                                        >
                                                                            <div className="flex items-start gap-3">
                                                                                <Checkbox
                                                                                    id={`combination-${combination.$id}`}
                                                                                    checked={isSelected}
                                                                                    onCheckedChange={(checked) =>
                                                                                        handleCombinationToggle(combination.$id, !!checked)
                                                                                    }
                                                                                    className="mt-1"
                                                                                />

                                                                                <div className="flex-1 space-y-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <label
                                                                                            htmlFor={`combination-${combination.$id}`}
                                                                                            className="font-medium text-gray-900 cursor-pointer"
                                                                                        >
                                                                                            {variantSummary}
                                                                                        </label>
                                                                                        {isSelected && isOverridden && (
                                                                                            <Badge variant="outline" className="text-xs">
                                                                                                Custom Pricing
                                                                                            </Badge>
                                                                                        )}
                                                                                        <Badge variant="secondary" className="text-xs">
                                                                                            SKU: {combination.sku}
                                                                                        </Badge>
                                                                                    </div>

                                                                                    {isSelected && (
                                                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                                                                            <div>
                                                                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Base Price</span>
                                                                                                <div className="text-sm font-semibold text-gray-900 mt-1">
                                                                                                    {combination.basePrice.toFixed(2)} {product.currency}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div>
                                                                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Commission</span>
                                                                                                <Input
                                                                                                    type="number"
                                                                                                    value={combinationCommission}
                                                                                                    onChange={(e) => {
                                                                                                        const value = parseFloat(e.target.value) || 0;
                                                                                                        const pricingIndex = customCombinationPricing.findIndex(p => p.combinationId === combination.$id);
                                                                                                        if (pricingIndex >= 0) {
                                                                                                            form.setValue(`customCombinationPricing.${pricingIndex}.customCommission`, value);
                                                                                                        }
                                                                                                        setOverriddenCombinations(prev => new Set([...prev, combination.$id]));
                                                                                                    }}
                                                                                                    className="mt-1"
                                                                                                    min="0"
                                                                                                    step="0.01"
                                                                                                    placeholder="0.00"
                                                                                                />
                                                                                            </div>

                                                                                            <div>
                                                                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Final Price</span>
                                                                                                <div className="text-sm font-semibold text-green-600 mt-1">
                                                                                                    {finalCombinationPrice.toFixed(2)} {product.currency}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="flex justify-end">
                                                                                                {isOverridden && (
                                                                                                    <Button
                                                                                                        type="button"
                                                                                                        variant="ghost"
                                                                                                        size="sm"
                                                                                                        onClick={() => {
                                                                                                            const pricingIndex = customCombinationPricing.findIndex(p => p.combinationId === combination.$id);
                                                                                                            if (pricingIndex >= 0) {
                                                                                                                form.setValue(`customCombinationPricing.${pricingIndex}.customCommission`, commission);
                                                                                                            }
                                                                                                            setOverriddenCombinations(prev => {
                                                                                                                const newSet = new Set(prev);
                                                                                                                newSet.delete(combination.$id);
                                                                                                                return newSet;
                                                                                                            });
                                                                                                        }}
                                                                                                        className="text-xs text-blue-600 hover:text-blue-700"
                                                                                                    >
                                                                                                        Reset
                                                                                                    </Button>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {isSelected && combination.images && combination.images.length > 0 && (
                                                                                        <div className="flex gap-2 mt-2">
                                                                                            {combination.images.slice(0, 3).map((imageUrl: string, imgIdx: number) => (
                                                                                                <div key={imgIdx} className="relative w-12 h-12 rounded border overflow-hidden">
                                                                                                    <Image
                                                                                                        src={imageUrl}
                                                                                                        fill
                                                                                                        alt={`${variantSummary} image ${imgIdx + 1}`}
                                                                                                        className="object-cover"
                                                                                                    />
                                                                                                </div>
                                                                                            ))}
                                                                                            {combination.images.length > 3 && (
                                                                                                <div className="w-12 h-12 rounded border bg-gray-100 flex items-center justify-center">
                                                                                                    <span className="text-xs text-gray-500">+{combination.images.length - 3}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Product Images Section */}
                                {product.images && product.images.length > 0 && (
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <div className="mb-3">
                                            <FormLabel className="text-base font-semibold text-gray-900">
                                                Product Images
                                            </FormLabel>
                                            <p className="text-sm text-gray-500 mt-1">
                                                All product images will be available in your virtual store.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {product.images.slice(0, 12).map((url: string, index: number) => (
                                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                                                    <Image
                                                        src={url}
                                                        fill
                                                        alt={`${product.name} image ${index + 1}`}
                                                        className="object-cover hover:scale-105 transition-transform duration-200"
                                                    />
                                                </div>
                                            ))}
                                            {product.images.length > 12 && (
                                                <div className="aspect-square rounded-lg border bg-gray-100 flex items-center justify-center">
                                                    <span className="text-sm text-gray-500 font-medium">
                                                        +{product.images.length - 12} more
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </Form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-white flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            {isLoadingCombinations ? (
                                <span>Loading combinations...</span>
                            ) : noCombinationsSelected && combinations.length > 0 ? (
                                <span className="text-red-600">Please select at least one combination to import</span>
                            ) : (
                                <span>
                                    Ready to import <span className="font-medium">{selectedCombinations.length}</span> combination(s)
                                </span>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isPending || (combinations.length > 0 && noCombinationsSelected) || isLoadingCombinations}
                                className="min-w-[120px]"
                            >
                                {isPending ? (
                                    <>
                                        <SpinningLoader />
                                        <span className="ml-2">Importing...</span>
                                    </>
                                ) : (
                                    `Import ${selectedCombinations.length} Item${selectedCombinations.length !== 1 ? 's' : ''}`
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </ResponsiveModal>
        </>
    )
}