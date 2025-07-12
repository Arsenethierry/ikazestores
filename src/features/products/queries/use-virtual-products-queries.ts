"use client";

import { useAction } from "next-safe-action/hooks";
import { addNewVirtualProduct, checkProductCloneStatus, getNearbyOriginalProducts, getOriginalProductsWithVirtualProducts } from "../actions/virtual-products-actions";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductFilters } from "@/lib/types";

export const useOriginalProducts = (filters: ProductFilters = {}) => {
    const { executeAsync } = useAction(getOriginalProductsWithVirtualProducts);
    return useQuery({
        queryKey: ['original-products', filters],
        queryFn: async () => {
            const result = await executeAsync(filters);
            console.log("rrrrr: ", result)
            if (result?.data?.error) {
                throw new Error(result.data.error);
            }
            return result?.data?.data;
        },
        staleTime: 5 * 60 * 1000,
        retry: 2
    })
};

export const useInfiniteOriginalProducts = (filters: ProductFilters = {}) => {
    const { executeAsync } = useAction(getOriginalProductsWithVirtualProducts);
    const pageSize = 20;

    return useInfiniteQuery({
        queryKey: ['infinite-original-products', filters],
        queryFn: async ({ pageParam = 0 }) => {
            const result = await executeAsync({
                ...filters,
                limit: pageSize,
                offset: pageParam * pageSize
            });

            if (result?.data?.error) {
                throw new Error(result.data.error);
            }

            return {
                products: result?.data?.data?.products || [],
                total: result?.data?.data?.total || 0,
                hasMore: result?.data?.data?.hasMore || false,
                nextPage: result?.data?.data?.hasMore ? pageParam + 1 : undefined
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 0,
        staleTime: 5 * 60 * 1000,
    })
};

export const useNearbyProducts = (
    userLat: number,
    userLng: number,
    radiusKm: number = 50,
    filters: Omit<ProductFilters, 'userLat' | 'userLng' | 'radiusKm'> = {}
) => {
    const { executeAsync } = useAction(getNearbyOriginalProducts);

    return useQuery({
        queryKey: ['nearby-products', { userLat, userLng, radiusKm, ...filters }],
        queryFn: async () => {
            const result = await executeAsync({
                ...filters,
                userLat,
                userLng,
                radiusKm
            });

            if (result?.data?.error) {
                throw new Error(result.data.error);
            }

            return result?.data?.data;
        },
        enabled: !!(userLat && userLng),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })
}

export const useProductCloneStatus = (originalProductId: string, virtualStoreId: string) => {
    const { executeAsync } = useAction(checkProductCloneStatus);

    return useQuery({
        queryKey: ['product-clone-status', originalProductId, virtualStoreId],
        queryFn: async () => {
            const result = await executeAsync({ originalProductId, virtualStoreId });
            if (result?.data?.error) {
                throw new Error(result.data.error);
            }
            return result?.data?.data;
        },
        enabled: !!(originalProductId && virtualStoreId),
        staleTime: 2 * 60 * 1000,
    });
};

export const useCloneProduct = () => {
    const queryClient = useQueryClient();
    const { executeAsync } = useAction(addNewVirtualProduct);

    return useMutation({
        mutationFn: async (productData: Parameters<typeof executeAsync>[0]) => {
            const result = await executeAsync(productData);
            if (result?.data?.error) {
                throw new Error(result.data.error);
            }
            return result?.data;
        },
        onSuccess: (result, productData) => {
            queryClient.setQueryData(
                ['product-clone-status', productData.originalProductId, productData.storeId],
                {
                    isCloned: true,
                    cloneDetails: result?.success
                }
            );
        },
        onError: (error, productData) => {
            queryClient.setQueryData(
                ['product-clone-status', productData.originalProductId, productData.storeId],
                {
                    isCloned: false,
                    cloneDetails: null
                }
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['original-products'] });
            queryClient.invalidateQueries({ queryKey: ['infinite-original-products'] });
            queryClient.invalidateQueries({ queryKey: ['nearby-products'] });
            queryClient.invalidateQueries({ queryKey: ['product-clone-status'] });
        }
    })
}