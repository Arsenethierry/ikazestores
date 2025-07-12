/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useProductParams } from "@/hooks/use-product-params";
import { PRICE_FILTER_VALUE } from "@/lib/constants";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCurrency } from "../currency/currency-context";
import { convertCurrency } from "../currency/currency-utils";

// Base currency used for product storage in DB (assuming USD)
const BASE_CURRENCY = "USD";

export const FilterSidebar = ({ categories }: { categories: any[] }) => {
    const [priceRange, setPriceRange] = useState([PRICE_FILTER_VALUE.min, PRICE_FILTER_VALUE.max]);

    const {
        currentCurrency,
        exchangeRates,
        exchangeRatesLoading
    } = useCurrency();

    const {
        category,
        minPrice: queryMinPrice,
        maxPrice: queryMaxPrice,
        isPending,
        setCategory,
        setMinPrice: setQueryMinPrice,
        setMaxPrice: setQueryMaxPrice
    } = useProductParams();

    const displayPriceMin = useMemo(() => {
        if (exchangeRatesLoading || !exchangeRates) return PRICE_FILTER_VALUE.min;
        return Math.floor(convertCurrency(PRICE_FILTER_VALUE.min, BASE_CURRENCY, currentCurrency, exchangeRates));
    }, [exchangeRates, exchangeRatesLoading, currentCurrency]);

    const displayPriceMax = useMemo(() => {
        if (exchangeRatesLoading || !exchangeRates) return PRICE_FILTER_VALUE.max;
        return Math.ceil(convertCurrency(PRICE_FILTER_VALUE.max, BASE_CURRENCY, currentCurrency, exchangeRates));
    }, [exchangeRates, exchangeRatesLoading, currentCurrency]);

    // When user's currency or exchange rates change, update the slider
    useEffect(() => {
        // Convert query params from base currency to display currency
        const displayMinPrice = queryMinPrice !== undefined ?
            Math.floor(convertCurrency(queryMinPrice, BASE_CURRENCY, currentCurrency, exchangeRates || { USD: 1 })) :
            displayPriceMin;

        const displayMaxPrice = queryMaxPrice !== undefined ?
            Math.ceil(convertCurrency(queryMaxPrice, BASE_CURRENCY, currentCurrency, exchangeRates || { USD: 1 })) :
            displayPriceMax;

        setPriceRange([displayMinPrice, displayMaxPrice]);
    }, [currentCurrency, exchangeRates, queryMinPrice, queryMaxPrice, displayPriceMin, displayPriceMax]);

    const handleCategoryChange = (value: string) => {
        if (value === category) {
            setCategory('');
        } else {
            setCategory(value);
        }
    };

    const handlePriceApply = () => {
        // Convert user currency prices back to base currency for API
        const baseMinPrice = Math.floor(convertCurrency(
            priceRange[0],
            currentCurrency,
            BASE_CURRENCY,
            // Invert the exchange rates for reverse conversion
            Object.entries(exchangeRates || { USD: 1 }).reduce((acc, [curr, rate]) => {
                acc[curr] = 1 / rate;
                return acc;
            }, {} as Record<string, number>)
        ));

        const baseMaxPrice = Math.ceil(convertCurrency(
            priceRange[1],
            currentCurrency,
            BASE_CURRENCY,
            Object.entries(exchangeRates || { USD: 1 }).reduce((acc, [curr, rate]) => {
                acc[curr] = 1 / rate;
                return acc;
            }, {} as Record<string, number>)
        ));

        setQueryMinPrice(baseMinPrice);
        setQueryMaxPrice(baseMaxPrice);
    };

    const handlePriceReset = () => {
        setPriceRange([displayPriceMin, displayPriceMax]);
        setQueryMinPrice(PRICE_FILTER_VALUE.min);
        setQueryMaxPrice(PRICE_FILTER_VALUE.max);
    };


    // Calculate step size for the slider based on range
    const stepSize = useMemo(() => {
        const range = displayPriceMax - displayPriceMin;
        return Math.max(1, Math.floor(range / 60));
    }, [displayPriceMin, displayPriceMax]);

    if (exchangeRatesLoading) return <div className="w-64 h-full animate-pulse bg-gray-100 rounded-lg"></div>;

    return (
        <div className="w-64 shrink-0 bg-white rounded-lg shadow p-4">
            <h2 className="font-medium text-lg mb-4">Filters</h2>

            <Accordion type="multiple" defaultValue={["category", "price"]} className="w-full">
                <AccordionItem value="category">
                    <AccordionTrigger className="text-base font-medium py-2">Categories</AccordionTrigger>
                    <AccordionContent>
                        <div className="ml-2 space-y-2">
                            <div
                                className="flex items-center cursor-pointer hover:text-blue-600"
                                onClick={() => setCategory('')}
                            >
                                {category === '' ?
                                    <CheckCircle2 size={16} className="mr-2 text-blue-600" /> :
                                    <Circle size={16} className="mr-2" />
                                }
                                <span className={`text-sm font-medium ${category === '' ? 'text-blue-600' : ''}`}>
                                    All Categories
                                </span>
                            </div>

                            {categories.map(cat => (
                                <div
                                    key={cat.$id}
                                    className="flex items-center cursor-pointer hover:text-blue-600"
                                    onClick={() => handleCategoryChange(cat.categoryName)}
                                >
                                    {category === cat.categoryName ?
                                        <CheckCircle2 size={16} className="mr-2 text-blue-600" /> :
                                        <Circle size={16} className="mr-2" />
                                    }
                                    <span className={`text-sm font-medium ${category === cat.categoryName ? 'text-blue-600' : ''}`}>
                                        {cat.categoryName}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="price">
                    <AccordionTrigger className="text-base font-medium py-2">Price</AccordionTrigger>
                    <AccordionContent>
                        <div className="px-2 space-y-4">
                            <Slider
                                min={displayPriceMin}
                                max={displayPriceMax}
                                step={stepSize}
                                value={priceRange}
                                onValueChange={setPriceRange}
                                className="py-4"
                            />
                            <div className="flex justify-between">
                                <div className="border rounded-md w-24 px-2 py-1 text-center">
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: currentCurrency,
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    }).format(priceRange[0])}
                                </div>
                                <div className="border rounded-md w-24 px-2 py-1 text-center">
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: currentCurrency,
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    }).format(priceRange[1])}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={handlePriceApply}
                                    size="sm"
                                    className="flex-1"
                                    disabled={isPending}
                                >
                                    Apply
                                </Button>
                                <Button
                                    onClick={handlePriceReset}
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    disabled={isPending}
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}