"use client";

import { Button } from "@/components/ui/button";
import { useProductParams } from "@/hooks/use-product-params";
import { SortBy } from "@/lib/types";

export const SortControl = () => {
    const {
        sortBy,
        setSortBy
    } = useProductParams();
    
    const sortOptions = [
        { value: SortBy.newestFirst, label: 'Newest First' },
        { value: SortBy.priceLowToHigh, label: 'Price -- Low to High' },
        { value: SortBy.priceHighToLow, label: 'Price -- High to Low' },
    ];

    const handleStortChange = (value: SortBy) => {
        setSortBy(value)
    }
    return (
        <div className="flex items-center mb-6 border-b pb-3">
            <div className="mr-4 font-medium">Sort By</div>
            {sortOptions.map((option) => (
                <Button
                    key={option.value}
                    variant={sortBy === option.value ? "primary" : "ghost"}
                    className={`mr-2 ${sortBy === option.value ? "bg-blue-600 text-white" : "text-gray-700"}`}
                    onClick={() => handleStortChange(option.value)}
                >
                    {option.label}
                </Button>
            ))}
        </div>
    )
}