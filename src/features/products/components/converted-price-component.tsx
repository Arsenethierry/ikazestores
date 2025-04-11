"use client";

import { useCurrencyDisplay } from "@/hooks/use-currency";

export const ProductPriceDisplay = ({ productPrice, productCurrency = "USD" }: { productPrice: number, productCurrency?: string }) => {
    const {
        convertedAmount: displayPrice,
        currencySymbol,
        isLoading: priceLoading
    } = useCurrencyDisplay(productPrice, productCurrency);

    return (
        <div>
            {currencySymbol && currencySymbol} {priceLoading ? (
                <div className='flex space-x-1 justify-center items-center bg-white'>
                    <span className='sr-only'>Loading...</span>
                    <div className='h-1 w-1 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                    <div className='h-1 w-1 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                    <div className='h-1 w-1 bg-slate-700 rounded-full animate-bounce'></div>
                </div>
            ) : displayPrice.toFixed(1)}
        </div>
    )
}