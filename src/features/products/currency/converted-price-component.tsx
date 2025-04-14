"use client";

import { useCurrency } from "./currency-context";
import { useMemo } from "react";
import { convertCurrency, formatCurrency } from "./currency-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductPriceDisplayProps {
    productPrice: number;
    productCurrency?: string;
    showOriginalPrice?: boolean;
}

export const ProductPriceDisplay = ({
    productPrice,
    productCurrency = 'USD',
    showOriginalPrice = true
}: ProductPriceDisplayProps) => {
    const {
        currentCurrency,
        isLoading,
        exchangeRates,
        exchangeRatesLoading
    } = useCurrency();

    const convertedPrice = useMemo(() => {
        if (exchangeRatesLoading || !exchangeRates) return productPrice;
        return convertCurrency(productPrice, productCurrency, currentCurrency, exchangeRates);
    }, [productPrice, productCurrency, currentCurrency, exchangeRates, exchangeRatesLoading]);

    const formattedPrice = useMemo(() => {
        return formatCurrency(convertedPrice, currentCurrency);
    }, [convertedPrice, currentCurrency]);

    const formattedOriginalPrice = useMemo(() => {
        return formatCurrency(productPrice, productCurrency);
    }, [productPrice, productCurrency]);

    const showConversionTooltip = showOriginalPrice && (productCurrency !== currentCurrency);

    if (isLoading || exchangeRatesLoading) {
        return <Skeleton className="h-4 w-16" />;
    }

    if (showConversionTooltip) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="cursor-default">
                        {formattedPrice}
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                        Original: {formattedOriginalPrice}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    return <span>{formattedPrice}</span>;
}