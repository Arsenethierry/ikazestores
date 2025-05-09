import {
    createSearchParamsCache,
    parseAsString
} from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
    category: parseAsString.withDefault(''),
    subcategory: parseAsString.withDefault(''),
    sort: parseAsString.withDefault(''),
    lastId: parseAsString.withDefault(''),
    firstId: parseAsString.withDefault(''),
    query: parseAsString.withDefault('')
});