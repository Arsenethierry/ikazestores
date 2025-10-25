"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DollarSign, Loader2, TrendingUp, Info, AlertCircle } from "lucide-react";
import { Products, AffiliateProductImports } from "@/lib/types/appwrite/appwrite";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { quickEditVirtualProductCommissionAction } from "@/lib/actions/affiliate-product-actions";
import { quickEditPhysicalProductPriceAction } from "@/lib/actions/original-products-actions";

interface PriceQuickEditProps {
    product: Products | (AffiliateProductImports & { originalProduct?: Products });
    type: "physical" | "virtual";
    currency?: string;
}

export function PriceQuickEdit({ product, type, currency = "RWF" }: PriceQuickEditProps) {
    const router = useRouter();
    const isPhysical = type === "physical";

    const physicalProduct = isPhysical ? (product as Products) : null;
    const virtualProduct = !isPhysical
        ? (product as AffiliateProductImports & { originalProduct?: Products })
        : null;

    const currentBasePrice = isPhysical
        ? physicalProduct?.basePrice || 0
        : virtualProduct?.originalProduct?.basePrice || 0;

    const currentCommission = !isPhysical ? virtualProduct?.commission || 0 : 0;

    const [newValue, setNewValue] = useState<string>(
        isPhysical ? currentBasePrice.toString() : currentCommission.toString()
    );

    const { execute: updatePhysicalPrice, status: physicalStatus } = useAction(
        quickEditPhysicalProductPriceAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.success || "Price updated successfully");
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to update price");
            },
        }
    );

    const { execute: updateVirtualCommission, status: virtualStatus } = useAction(
        quickEditVirtualProductCommissionAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.success || "Commission updated successfully");
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to update commission");
            },
        }
    );

    const isPending = physicalStatus === "executing" || virtualStatus === "executing";

    const parsedValue = parseFloat(newValue) || 0;
    const hasChanged = isPhysical
        ? parsedValue !== currentBasePrice
        : parsedValue !== currentCommission;

    // Calculate final price for display
    const finalPrice = isPhysical
        ? parsedValue
        : currentBasePrice + parsedValue;

    const priceChange = isPhysical
        ? parsedValue - currentBasePrice
        : parsedValue - currentCommission;

    const priceChangePercent =
        priceChange !== 0 && (isPhysical ? currentBasePrice : currentCommission) > 0
            ? ((priceChange / (isPhysical ? currentBasePrice : currentCommission)) * 100).toFixed(2)
            : "0";

    const handleSave = () => {
        if (!hasChanged) {
            toast.info("No changes to save");
            return;
        }

        if (parsedValue < 0) {
            toast.error(
                isPhysical
                    ? "Price must be positive"
                    : "Commission must be positive"
            );
            return;
        }

        if (isPhysical && physicalProduct) {
            updatePhysicalPrice({
                productId: physicalProduct.$id,
                basePrice: parsedValue,
            });
        } else if (virtualProduct) {
            updateVirtualCommission({
                importId: virtualProduct.$id,
                commission: parsedValue,
            });
        }
    };

    const handleReset = () => {
        setNewValue(
            isPhysical ? currentBasePrice.toString() : currentCommission.toString()
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {isPhysical ? "Price Quick Edit" : "Commission Quick Edit"}
                </CardTitle>
                <CardDescription>
                    {isPhysical
                        ? "Update product base price with real-time calculations"
                        : "Update commission to adjust your profit margin"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Values */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                            {isPhysical ? "Current Price" : "Current Commission"}
                        </Label>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">
                                {isPhysical
                                    ? currentBasePrice.toLocaleString()
                                    : currentCommission.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">{currency}</span>
                        </div>
                    </div>

                    {!isPhysical && (
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">
                                Base Price (Vendor)
                            </Label>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold">
                                    {currentBasePrice.toLocaleString()}
                                </span>
                                <span className="text-sm text-muted-foreground">{currency}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Field */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="newPrice">
                            {isPhysical ? "New Price" : "New Commission"}
                        </Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        {isPhysical
                                            ? "This is the base price customers will pay for this product"
                                            : "This is your markup added on top of the vendor's base price"}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="relative">
                        <Input
                            id="newPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            disabled={isPending}
                            className="text-lg font-semibold pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            {currency}
                        </span>
                    </div>
                </div>

                {/* Real-time Calculations */}
                {hasChanged && (
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Price Impact</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Change</p>
                                <p
                                    className={`text-lg font-bold ${priceChange > 0
                                            ? "text-green-600 dark:text-green-400"
                                            : priceChange < 0
                                                ? "text-red-600 dark:text-red-400"
                                                : ""
                                        }`}
                                >
                                    {priceChange > 0 ? "+" : ""}
                                    {priceChange.toLocaleString()} {currency}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Percentage</p>
                                <p
                                    className={`text-lg font-bold ${priceChange > 0
                                            ? "text-green-600 dark:text-green-400"
                                            : priceChange < 0
                                                ? "text-red-600 dark:text-red-400"
                                                : ""
                                        }`}
                                >
                                    {priceChange > 0 ? "+" : ""}
                                    {priceChangePercent}%
                                </p>
                            </div>

                            {!isPhysical && (
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Final Customer Price
                                    </p>
                                    <p className="text-lg font-bold">
                                        {finalPrice.toLocaleString()} {currency}
                                    </p>
                                </div>
                            )}
                        </div>

                        {!isPhysical && (
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>
                                    Vendor Base: {currentBasePrice.toLocaleString()} {currency}
                                </p>
                                <p>
                                    Your Commission: {parsedValue.toLocaleString()} {currency}
                                </p>
                                <p className="font-medium">
                                    Customer Pays: {finalPrice.toLocaleString()} {currency}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Validation Alert */}
                {parsedValue < 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {isPhysical ? "Price" : "Commission"} must be a positive number
                        </AlertDescription>
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanged || isPending || parsedValue < 0}
                        className="flex-1"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={!hasChanged || isPending}
                    >
                        Reset
                    </Button>
                </div>

                {!isPhysical && (
                    <div className="text-xs text-muted-foreground rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            💡 Commission Strategy
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                            Set your commission based on the value you add through marketing,
                            curation, and customer service. Consider your target audience and
                            competitive pricing.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}