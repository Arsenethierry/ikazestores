'use client';

import { useQuery } from '@tanstack/react-query';
import { useProductStore } from '../productStore';

const fetchProducts = async (params: {
    search: string;
    mainCategory: string;
    subCategory: string;
    page: number;
    pageSize: number;
}) => {
    const queryParams = new URLSearchParams({
        search: params.search,
        mainCategory: params.mainCategory,
        subCategory: params.subCategory,
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
    });

    const res = await fetch(`/api/products?${queryParams}`);
    return res.json();
};

export const useProducts = () => {
    const { searchQuery, mainCategory, subCategory, page, pageSize } = useProductStore();

    return useQuery({
        queryKey: ['products', searchQuery, mainCategory, subCategory, page, pageSize],
        queryFn: () => fetchProducts({
            search: searchQuery,
            mainCategory,
            subCategory,
            page,
            pageSize
        }),
        // keepPreviousData: true,
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await fetch('/api/categories');
            return res.json();
        },
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};