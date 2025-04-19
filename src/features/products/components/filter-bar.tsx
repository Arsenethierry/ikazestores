"use client";

import SpinningLoader from "@/components/spinning-loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductParams } from "@/hooks/use-product-params";
import { CategoryTypes, SortBy } from "@/lib/types";

const sortOptions = [
    { value: SortBy.priceLowToHigh, label: 'Price: Low to High' },
    { value: SortBy.priceHighToLow, label: 'Price: High to Low' },
    { value: SortBy.newestFirst, label: 'Newest' }
] as const;

export const FilterBar = ({ categories }: { categories: CategoryTypes[] }) => {
    const {
        category,
        isPending,
        setCategory,
        setSortBy,
        sortBy
    } = useProductParams();

    const handleCategoryChange = (value: string) => {
        if(value === 'all') {
            setCategory('')
        } else {
            setCategory(value);
        }
    };

    const handleStortChange = (value: SortBy) => {
        setSortBy(value)
    }

    return (
        <div className="flex gap-4 mb-4">
            <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by categories" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All</SelectItem>
                    {categories.map((category) => (
                        <SelectItem value={category.categoryName} key={category.$id}>
                            {category.categoryName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={handleStortChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                    {sortOptions.map((option) => (
                        <SelectItem value={option.value} key={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {isPending && <SpinningLoader />}
        </div>
    )
}