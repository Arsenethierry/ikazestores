"use client";

import { useCurrencyDisplay } from "@/hooks/use-currency";

export const ProductPriceDisplay = ({ productPrice, productCurrency = "USD" }: { productPrice: number, productCurrency?: string }) => {
    const {
        convertedAmount: displayPrice,
        currencySymbol,
        isLoading: priceLoading
    } = useCurrencyDisplay(productPrice, productCurrency);

    return (
        <div className="text-sm text-gray-500 line-through transition-opacity duration-300 group-hover:opacity-70">
            {currencySymbol && currencySymbol} {priceLoading ? '' : displayPrice}
        </div>
    )
}