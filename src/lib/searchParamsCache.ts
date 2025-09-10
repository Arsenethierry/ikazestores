import {
    createSearchParamsCache,
    parseAsString
} from "nuqs/server";
import { ProductFilters } from "./types";

export const searchParamsCache = createSearchParamsCache({
    category: parseAsString.withDefault(''),
    subcategory: parseAsString.withDefault(''),
    sort: parseAsString.withDefault(''),
    lastId: parseAsString.withDefault(''),
    firstId: parseAsString.withDefault(''),
    query: parseAsString.withDefault('')
});

export function parseSearchParams(searchParams: { [key: string]: string | string[] | undefined }): ProductFilters {
    return {
        page: searchParams.page ? Number(searchParams.page) : 1,
        limit: searchParams.limit ? Number(searchParams.limit) : 12,
        search: searchParams.search as string,
        categoryId: searchParams.categoryId as string,
        subcategoryId: searchParams.subcategoryId as string,
        productTypeId: searchParams.productTypeId as string,
        status: searchParams.status as any,
        minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
        maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
        sortBy: searchParams.sortBy as string,
        sortOrder: searchParams.sortOrder as "asc" | "desc",
        view: searchParams.view as string || 'all',
        radiusKm: searchParams.radiusKm ? Number(searchParams.radiusKm) : 50,
    };
}