"use client";

import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceBreakdown {
    originalPrice: number;
    vendorDiscount: number;
    commission: number;
    influencerDiscount: number;
    couponDiscount: number;
    finalPrice: number;
    totalSavings: number;
    appliedDiscounts: Array<{
        id: string;
        name: string;
        amount: number;
        type: string;
    }>;
}

interface ProductPriceDisplayProps {
    priceBreakdown: PriceBreakdown;
    currency?: string;
    showBreakdown?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function ProductPriceDisplay({
    priceBreakdown,
    currency = "RWF",
    showBreakdown = false,
    size = "md",
    className,
}: ProductPriceDisplayProps) {
    const {
        originalPrice,
        finalPrice,
        totalSavings,
        appliedDiscounts,
    } = priceBreakdown;

    const hasDiscount = totalSavings > 0;
    const savingsPercent = originalPrice > 0
        ? Math.round((totalSavings / originalPrice) * 100)
        : 0;

    const sizeClasses = {
        sm: {
            final: "text-lg font-bold",
            original: "text-sm",
            savings: "text-xs",
        },
        md: {
            final: "text-2xl font-bold",
            original: "text-base",
            savings: "text-sm",
        },
        lg: {
            final: "text-3xl font-bold",
            original: "text-lg",
            savings: "text-base",
        },
    };

    return (
        <div className={cn("space-y-2", className)}>
            {/* Main Price Display */}
            <div className="flex items-baseline gap-3">
                <div className={cn(sizeClasses[size].final, "text-primary")}>
                    {finalPrice.toLocaleString()} {currency}
                </div>

                {hasDiscount && (
                    <>
                        <div
                            className={cn(
                                sizeClasses[size].original,
                                "line-through text-muted-foreground"
                            )}
                        >
                            {originalPrice.toLocaleString()} {currency}
                        </div>
                        <Badge variant="destructive" className="font-semibold">
                            -{savingsPercent}%
                        </Badge>
                    </>
                )}
            </div>

            {/* Savings Info */}
            {hasDiscount && (
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            sizeClasses[size].savings,
                            "text-green-600 dark:text-green-400 font-medium flex items-center gap-1"
                        )}
                    >
                        <TrendingDown className="h-4 w-4" />
                        You save {totalSavings.toLocaleString()} {currency}
                    </div>

                    {showBreakdown && appliedDiscounts.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Info className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    className="max-w-xs"
                                    align="start"
                                >
                                    <PriceBreakdownTooltip priceBreakdown={priceBreakdown} currency={currency} />
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            )}

            {/* Applied Discount Badges */}
            {appliedDiscounts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {appliedDiscounts.map((discount) => (
                        <Badge
                            key={discount.id}
                            variant="secondary"
                            className="text-xs font-normal"
                        >
                            {discount.name}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

function PriceBreakdownTooltip({
    priceBreakdown,
    currency,
}: {
    priceBreakdown: PriceBreakdown;
    currency: string;
}) {
    const {
        originalPrice,
        vendorDiscount,
        commission,
        influencerDiscount,
        couponDiscount,
        finalPrice,
        appliedDiscounts,
    } = priceBreakdown;

    return (
        <div className="space-y-3 p-2">
            <div className="font-semibold text-sm border-b pb-2">
                Price Breakdown
            </div>

            <div className="space-y-2 text-sm">
                {/* Original Price */}
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Base Price:</span>
                    <span className="font-medium">
                        {originalPrice.toLocaleString()} {currency}
                    </span>
                </div>

                {/* Vendor Discount */}
                {vendorDiscount > 0 && (
                    <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                        <span>Vendor Discount:</span>
                        <span className="font-medium">
                            -{vendorDiscount.toLocaleString()} {currency}
                        </span>
                    </div>
                )}

                {/* Commission (for virtual stores) */}
                {commission > 0 && (
                    <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                        <span>Commission:</span>
                        <span className="font-medium">
                            +{commission.toLocaleString()} {currency}
                        </span>
                    </div>
                )}

                {/* Influencer Discount */}
                {influencerDiscount > 0 && (
                    <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                        <span>Influencer Discount:</span>
                        <span className="font-medium">
                            -{influencerDiscount.toLocaleString()} {currency}
                        </span>
                    </div>
                )}

                {/* Coupon Discount */}
                {couponDiscount > 0 && (
                    <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                        <span>Coupon Discount:</span>
                        <span className="font-medium">
                            -{couponDiscount.toLocaleString()} {currency}
                        </span>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t my-2" />

                {/* Final Price */}
                <div className="flex items-center justify-between font-bold">
                    <span>Final Price:</span>
                    <span className="text-primary">
                        {finalPrice.toLocaleString()} {currency}
                    </span>
                </div>
            </div>

            {/* Applied Discounts List */}
            {appliedDiscounts.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                        Active Promotions:
                    </div>
                    <div className="space-y-1">
                        {appliedDiscounts.map((discount) => (
                            <div
                                key={discount.id}
                                className="text-xs flex items-center justify-between"
                            >
                                <span className="truncate flex-1">{discount.name}</span>
                                <span className="font-medium ml-2">
                                    -{discount.amount.toLocaleString()} {currency}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface SimplePriceDisplayProps {
    originalPrice: number;
    finalPrice: number;
    currency?: string;
    hasDiscount?: boolean;
    compact?: boolean;
}

export function SimplePriceDisplay({
    originalPrice,
    finalPrice,
    currency = "RWF",
    hasDiscount = false,
    compact = false,
}: SimplePriceDisplayProps) {
    const savingsPercent = originalPrice > 0
        ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
        : 0;

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <span className="font-bold text-lg">
                    {finalPrice.toLocaleString()} {currency}
                </span>
                {hasDiscount && savingsPercent > 0 && (
                    <Badge variant="destructive" className="text-xs">
                        -{savingsPercent}%
                    </Badge>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="flex items-baseline gap-2">
                <span className="font-bold text-xl">
                    {finalPrice.toLocaleString()} {currency}
                </span>
                {hasDiscount && (
                    <span className="text-sm line-through text-muted-foreground">
                        {originalPrice.toLocaleString()} {currency}
                    </span>
                )}
            </div>
            {hasDiscount && savingsPercent > 0 && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Save {savingsPercent}% ({(originalPrice - finalPrice).toLocaleString()} {currency})
                </div>
            )}
        </div>
    );
}