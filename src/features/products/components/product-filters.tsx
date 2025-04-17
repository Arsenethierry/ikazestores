"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFilterStore } from "../filter-store";
import { useEffect } from "react";
import { PRICE_FILTER_VALUE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProductFiltersProps {
    initialFilters: Record<string, string | string[] | undefined>;
};

interface SizeOption {
    label: string;
    count: number;
};

interface ProductTypeOption {
    label: string;
    count: number;
};

export const ProductFilters = ({ initialFilters }: ProductFiltersProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const {
        price,
        sizes,
        productTypes,
        setPrice,
        toggleSize,
        toggleProductType,
        resetFielters,
        setFiltersFromParams
    } = useFilterStore();

    useEffect(() => {
        setFiltersFromParams(initialFilters);
    }, [initialFilters, setFiltersFromParams]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (price.min !== PRICE_FILTER_VALUE.min) params.set('minPrice', price.min.toString());
        else params.delete('minPrice');

        if (sizes.length) params.set('sizes', sizes.join(','));
        else params.delete('sizes');

        if (price.max !== PRICE_FILTER_VALUE.max) params.set('maxPrice', price.max.toString());
        else params.delete('types');

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [price, sizes, productTypes, router, pathname, searchParams]);

    // Sample size options
    const sizeOptions: SizeOption[] = [
        { label: '6', count: 3 },
        { label: '7', count: 3 },
        { label: '8', count: 4 },
        { label: '9', count: 3 },
        { label: '10', count: 3 },
        { label: '11', count: 3 },
        { label: 'XS', count: 373 },
        { label: 'S', count: 574 },
        { label: 'M', count: 646 },
    ];

    // Sample product type options
    const productTypeOptions: ProductTypeOption[] = [
        { label: 'Achkan', count: 11 },
        { label: 'Aligarhi', count: 6 },
        { label: 'Bandhgala', count: 29 },
    ];

    const hasActiveFilters = sizes.length > 0 || productTypeOptions.length > 0 || price.min > PRICE_FILTER_VALUE.min || price.max < PRICE_FILTER_VALUE.max;

    return (
        <div className="space-y-2">
            {hasActiveFilters && (
                <div className="pb-2 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium">Active Filters</h2>
                        <Button
                            variant={'ghost'}
                            size="sm"
                            onClick={resetFielters}
                            className="text-xs"
                        >
                            Clear All
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {price.min > PRICE_FILTER_VALUE.min && (
                            <Badge variant={'outline'}>Min: ${price.min}</Badge>
                        )}
                        {price.max < PRICE_FILTER_VALUE.max && (
                            <Badge variant={'outline'}>Max: ${price.max}</Badge>
                        )}
                        {sizes.map(size => (
                            <Badge
                                key={size}
                                variant={'outline'}
                                onClick={() => toggleSize(size)}
                                className="cursor-pointer"
                            >
                                Size: {size} x
                            </Badge>
                        ))}
                        {productTypes.map(type => (
                            <Badge
                                key={type}
                                variant={'outline'}
                                onClick={() => toggleProductType(type)}
                                className="cursor-pointer"
                            >
                                {type} x
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div aria-labelledby="price-heading">
                <h2 id="price-heading" className="font-medium mb-2">PRICE</h2>
                <div className="space-y-4">
                    <Slider
                        defaultValue={[price.min, price.max]}
                        min={PRICE_FILTER_VALUE.min}
                        max={PRICE_FILTER_VALUE.max}
                        step={100}
                        onValueCommit={(range) => setPrice({ min: range[0], max: range[1] })}
                        aria-label="Price range"
                    />
                    <div>
                        <p>MRP $ {price.min.toLocaleString()}</p>
                        <p>MRP $ {price.max.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div aria-labelledby="size-heading" className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 id="size-heading" className="font-medium">SIZE</h2>
                    {sizes.length > 0 && (
                        <Badge variant={'secondary'} className="text-xs">
                            {sizes.length} selected
                        </Badge>
                    )}
                </div>
                <div className="space-y-2">
                    {sizeOptions.map(size => (
                        <div key={size.label} className="flex items-center gap-2">
                            <Checkbox
                                id={`size-${size.label}`}
                                checked={sizes.includes(size.label)}
                                onCheckedChange={() => toggleSize(size.label)}
                                aria-label={`Size ${size.label}`}
                            />
                            <Label
                                htmlFor={`size-${size.label}`}
                                className="text-sm flex-1 cursor-pointer"
                            >
                                {size.label} ({size.count})
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <div aria-labelledby="product-type-heading" className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 id="product-type-heading" className="font-medium">PRODUCT TYPE</h2>
                    {productTypes.length > 0 && (
                        <Badge
                            variant={'secondary'}
                            className="text-xs"
                        >
                            {productTypes.length} selected
                        </Badge>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                {productTypeOptions.map(type => (
                    <div key={type.label} className="flex items-center gap-2">
                        <Checkbox
                            id={`type-${type.label}`}
                            checked={productTypes.includes(type.label)}
                            onCheckedChange={() => toggleProductType(type.label)}
                            aria-label={`Product type ${type.label}`}
                        />
                        <Label
                            htmlFor={`type-${type.label}`}
                            className="text-sm flex-1 cursor-pointer"
                        >
                            {type.label} ({type.count})
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    )
}