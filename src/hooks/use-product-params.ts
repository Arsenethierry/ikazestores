"use client";

import { SortBy } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function useProductParams() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    const sortBy = (searchParams.get("sortBy") as SortBy) || SortBy.newestFirst;
    const minPrice = searchParams.get("minPrice") || undefined;
    const maxPrice = searchParams.get("maxPrice") || undefined;
    const lastId = searchParams.get("lastId") || undefined;
    const firstId = searchParams.get("firstId") || undefined;

    const createQueryString = useCallback(
        (name: string, value: string | number | undefined) => {
            const params = new URLSearchParams(searchParams.toString());

            if (value === undefined || value === null || value === "") {
                params.delete(name);
            } else {
                params.set(name, value.toString());
            }

            if (name !== "lastId" && name !== "firstId") {
                params.delete("lastId");
                params.delete("firstId");
            }

            return params.toString();
        },
        [searchParams]
    );

    const setQuery = useCallback(
        (value: string) => {
            startTransition(() => {
                router.push(`${pathname}?${createQueryString("query", value)}`);
            });
        },
        [pathname, router, createQueryString]
    );

    const setCategory = useCallback(
        (value: string) => {
            startTransition(() => {
                router.push(`${pathname}?${createQueryString("category", value)}`);
            });
        },
        [pathname, router, createQueryString]
    );

    const setSortBy = useCallback(
        (value: SortBy) => {
            startTransition(() => {
                router.push(`${pathname}?${createQueryString("sortBy", value)}`);
            });
        },
        [pathname, router, createQueryString]
    );

    const setMinPrice = useCallback(
        (value: number) => {
            startTransition(() => {
                router.push(`${pathname}?${createQueryString("minPrice", value)}`);
            });
        },
        [pathname, router, createQueryString]
    );

    const setMaxPrice = useCallback(
        (value: number) => {
            startTransition(() => {
                router.push(`${pathname}?${createQueryString("maxPrice", value)}`);
            });
        },
        [pathname, router, createQueryString]
    );

    const setLastId = useCallback(
        (value: string) => {
            startTransition(() => {
                router.push(`${pathname}?${createQueryString("lastId", value)}`);
            });
        },
        [pathname, router, createQueryString]
    );

    const setFirstId = useCallback(
        (value: string) => {
            startTransition(() => {
                router.push(`${pathname}?${createQueryString("firstId", value)}`);
            });
        },
        [pathname, router, createQueryString]
    );

    const clearFilters = useCallback(() => {
        startTransition(() => {
            const newParams = new URLSearchParams();
            if (query) {
                newParams.set("query", query);
            }
            router.push(`${pathname}?${newParams.toString()}`);
        });
    }, [pathname, router, query]);

    return {
        query,
        category,
        sortBy,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        lastId,
        firstId,
        isPending,
        setQuery,
        setCategory,
        setSortBy,
        setMinPrice,
        setMaxPrice,
        setLastId,
        setFirstId,
        clearFilters
    };
}