"use client";

import { useCurrencyDisplay } from "@/hooks/use-currency";

export const ProductPriceDisplay = ({ productPrice, productCurrency = "USD" }: { productPrice: number, productCurrency?: string }) => {
    const {
        convertedAmount: displayPrice,
        currencySymbol,
        isLoading: priceLoading
    } = useCurrencyDisplay(productPrice, productCurrency);

    return (
        <span>
            {priceLoading ? (
                <span className="inline-flex items-center space-x-1">
                    <span className="sr-only">Loading...</span>
                    <span className="h-1 w-1 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-1 w-1 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-1 w-1 bg-slate-700 rounded-full animate-bounce"></span>
                </span>
            ) : (
                <>
                    {currencySymbol}{displayPrice.toFixed(1)}
                </>
            )}
        </span>
    );
}