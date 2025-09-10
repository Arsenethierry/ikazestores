'use client';

import { ProductFilters } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { ProductsFilters } from "./products-filters";
import { parseSearchParams } from "@/lib/searchParamsCache";

export function ProductsFiltersWrapper({
    searchParams,
    storeId
}: {
    searchParams: { [key: string]: string | string[] | undefined };
    storeId: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const currentSearchParams = useSearchParams();

    const filters = parseSearchParams(searchParams);

    const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
        const params = new URLSearchParams(currentSearchParams);

        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.set(key, String(value));
            } else {
                params.delete(key);
            }
        });

        params.set('page', '1');

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }, [currentSearchParams, pathname, router])

    return (
        <ProductsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isLoading={isPending}
        />
    );
}