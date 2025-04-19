import { PRICE_FILTER_VALUE } from "@/lib/constants";
import { SortBy } from "@/lib/types";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useTransition } from "react";

export function useProductParams() {
    const [isPending, startTransition] = useTransition();

    const [{
        category,
        sortBy,
        lastId,
        firstId,
        minPrice,
        maxPrice
    }, setParams] = useQueryStates({
        category: parseAsString.withDefault(''),
        sortBy: parseAsString.withDefault("" as SortBy),
        firstId: parseAsString.withDefault(''),
        lastId: parseAsString.withDefault(''),
        minPrice: parseAsInteger.withDefault(PRICE_FILTER_VALUE.min),
        maxPrice: parseAsInteger.withDefault(PRICE_FILTER_VALUE.max)
    }, {
        history: 'push',
        shallow: false,
        startTransition
    });

    const setCategory = (newCategory: string) => {
        setParams({ category: newCategory, firstId: '', lastId: '' })
    }

    const setSortBy = (newSort: SortBy) => {
        setParams({ sortBy: newSort, firstId: '', lastId: '' })
    }

    const setLastId = (lastId: string) => {
        setParams({ firstId: '', lastId: lastId })
    }

    const setFirstId = (firstId: string) => {
        setParams({ firstId: firstId, lastId: '' })
    }

    const setMinPrice = (price: number) => {
        setParams({ minPrice: price, firstId: '', lastId: '' });
    };

    const setMaxPrice = (price: number) => {
        setParams({ maxPrice: price, firstId: '', lastId: '' });
    };

    return {
        category,
        setCategory,
        sortBy,
        setSortBy,
        lastId,
        setLastId,
        firstId,
        setFirstId,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
        isPending
    }
}