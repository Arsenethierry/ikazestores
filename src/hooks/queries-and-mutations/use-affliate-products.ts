"use client";

import {
    bulkUpdateCommission,
    checkProductSyncStatus,
    getAffiliateImportAnalytics,
    getFeaturedVirtualStoreProducts,
    getProductCombinationsWithPricing,
    getVirtualStoreProducts,
    getVirtualStoreProductsByCategory,
    importProductToVirtualStore,
    removeProductFromVirtualStore,
    searchVirtualStoreProducts,
    updateAffiliateImport
} from "@/lib/actions/affiliate-product-actions";
import { CreateAffiliateImportSchema, UpdateAffiliateImportSchema, VirtualStoreProductFilters } from "@/lib/schemas/products-schems";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetVirtualStoreProducts = (
    virtualStoreId: string,
    options: {
        limit?: number;
        page?: number;
        search?: string;
        categoryId?: string;
        minPrice?: number;
        maxPrice?: number;
    } = {}
) => {
    return useQuery({
        queryKey: ['virtual-store-products', virtualStoreId, options],
        queryFn: () => getVirtualStoreProducts(virtualStoreId, options),
        enabled: !!virtualStoreId,
        staleTime: 2 * 60 * 1000,
    })
}

export const useGetVirtualStoreProductsByCategory = (
    virtualStoreId: string,
    categoryId: string,
    options: {
        limit?: number;
        page?: number;
    } = {}
) => {
    return useQuery({
        queryFn: () => getVirtualStoreProductsByCategory(virtualStoreId, categoryId, options),
        queryKey: ['virtual-store-products-by-category', virtualStoreId, categoryId, options],
        enabled: !!virtualStoreId && !!categoryId,
        staleTime: 5 * 60 * 1000,
    })
}

export const useGetFeaturedVirtualStoreProducts = (
    virtualStoreId: string,
    options: {
        limit?: number;
        page?: number;
    } = {}
) => {
    return useQuery({
        queryFn: () => getFeaturedVirtualStoreProducts(virtualStoreId, options),
        queryKey: ['featured-virtual-store-products', virtualStoreId, options],
        enabled: !!virtualStoreId,
        staleTime: 10 * 60 * 1000,
    });
}

export const useGetProductCombinationsWithPricing = (
    productId: string,
    virtualStoreId?: string
) => {
    return useQuery({
        queryFn: () => getProductCombinationsWithPricing(productId, virtualStoreId),
        queryKey: ['product-combinations-pricing', productId, virtualStoreId],
        enabled: !!productId,
        staleTime: 5 * 60 * 1000,
    });
}

export const useCheckProductSyncStatus = (productId: string, virtualStoreId: string) => {
    return useQuery({
        queryKey: ['product-sync-status', productId, virtualStoreId],
        queryFn: () => checkProductSyncStatus(productId, virtualStoreId),
        enabled: !!productId && !!virtualStoreId,
        staleTime: 10 * 60 * 1000,
        refetchInterval: 10 * 60 * 1000,
    });
}

export const useGetAffiliateImportAnalytics = (virtualStoreId: string) => {
    return useQuery({
        queryFn: () => getAffiliateImportAnalytics(virtualStoreId),
        queryKey: ['affiliate-import-analytics', virtualStoreId],
        enabled: !!virtualStoreId,
        staleTime: 5 * 60 * 1000,
    });
}

export const useImportProductToVirtualStore = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAffiliateImportSchema) => importProductToVirtualStore(data),
        onSuccess: (result, variables) => {
            if ('error' in result) {
                toast.error(result.error);
                return;
            }

            toast.success(result.success);

            queryClient.invalidateQueries({
                queryKey: ['virtual-store-products', variables.virtualStoreId]
            });
            queryClient.invalidateQueries({
                queryKey: ['featured-virtual-store-products', variables.virtualStoreId]
            });
            queryClient.invalidateQueries({
                queryKey: ['affiliate-import-analytics', variables.virtualStoreId]
            });
            queryClient.invalidateQueries({
                queryKey: ['product-sync-status', variables.virtualStoreId]
            });
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to import product");
        }
    });
};

export const useUpdateAffiliateImport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ importId, data }: { importId: string; data: UpdateAffiliateImportSchema }) =>
            updateAffiliateImport(importId, data),
        onSuccess: (result) => {
            if ('error' in result) {
                toast.error(result.error);
                return;
            }

            toast.success(result.success);

            queryClient.invalidateQueries({ queryKey: ['virtual-store-products'] });
            queryClient.invalidateQueries({ queryKey: ['featured-virtual-store-products'] });
            queryClient.invalidateQueries({ queryKey: ['virtual-store-products-by-category'] });
            queryClient.invalidateQueries({ queryKey: ['virtual-store-products-by-price-range'] });
            queryClient.invalidateQueries({ queryKey: ['affiliate-import-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['product-combinations-pricing'] });
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update import");
        }
    })
}

export const useRemoveProductFromVirtualStore = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (importId: string) => removeProductFromVirtualStore(importId),
        onSuccess: (result: any) => {
            if (result) {
                if ('error' in result) {
                    toast.error(result.error);
                    return;
                }

                toast.success(result.success ?? '');
            }

            queryClient.invalidateQueries({ queryKey: ['virtual-store-products'] });
            queryClient.invalidateQueries({ queryKey: ['featured-virtual-store-products'] });
            queryClient.invalidateQueries({ queryKey: ['virtual-store-products-by-category'] });
            queryClient.invalidateQueries({ queryKey: ['virtual-store-products-by-price-range'] });
            queryClient.invalidateQueries({ queryKey: ['affiliate-import-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['product-sync-status'] });
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to remove product");
        }
    })
}

export const useBulkUpdateCommission = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ virtualStoreId, newCommission }: { virtualStoreId: string; newCommission: number }) =>
            bulkUpdateCommission(virtualStoreId, newCommission),
        onSuccess: (result, variables) => {
            if ('error' in result) {
                toast.error(result.error);
                return;
            }

            toast.success(result.success);

            queryClient.invalidateQueries({
                queryKey: ['virtual-store-products', variables.virtualStoreId]
            });
            queryClient.invalidateQueries({
                queryKey: ['featured-virtual-store-products', variables.virtualStoreId]
            });
            queryClient.invalidateQueries({
                queryKey: ['virtual-store-products-by-category', variables.virtualStoreId]
            });
            queryClient.invalidateQueries({
                queryKey: ['virtual-store-products-by-price-range', variables.virtualStoreId]
            });
            queryClient.invalidateQueries({
                queryKey: ['affiliate-import-analytics', variables.virtualStoreId]
            });
            queryClient.invalidateQueries({
                queryKey: ['product-combinations-pricing']
            });
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update commission rates");
        }
    })
}

export const useInfiniteVirtualStoreProducts = (
    virtualStoreId: string,
    filters: VirtualStoreProductFilters
) => {
    return useInfiniteQuery({
        queryKey: ['infinite-virtual-store-products', virtualStoreId, filters],
        queryFn: async ({ pageParam = 1 }) => {
            const options = {
                page: pageParam,
                limit: 12,
                search: filters.search,
                categoryId: filters.categoryId,
                minPrice: filters.minFinalPrice,
                maxPrice: filters.maxFinalPrice,
            };

            const result = await getVirtualStoreProducts(virtualStoreId, options);
            return {
                products: result.documents,
                nextPage: result.hasMore ? pageParam + 1 : undefined,
                hasMore: result.hasMore
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
        enabled: !!virtualStoreId,
        staleTime: 5 * 60 * 1000,
    })
}

export const useVirtualStoreProductsSearch = (
    virtualStoreId: string,
    searchTerm: string,
    options: {
        limit?: number;
        page?: number;
        categoryId?: string;
        minPrice?: number;
        maxPrice?: number;
    } = {},
    enabled: boolean = true
) => {
    return useQuery({
        queryFn: () => searchVirtualStoreProducts(virtualStoreId, {
            ...options,
            search: searchTerm
        }),
        queryKey: ['virtual-store-products-search', virtualStoreId, searchTerm, options],
        enabled: enabled && !!virtualStoreId && !!searchTerm,
        staleTime: 30 * 1000,
    });
}
export const useVirtualStoreProductPricing = (
    virtualStoreId: string,
    productId: string
) => {
    return useQuery({
        queryFn: async () => {
            const [productResult, combinationsResult] = await Promise.all([
                getVirtualStoreProducts(virtualStoreId, { limit: 1 }),
                getProductCombinationsWithPricing(productId, virtualStoreId)
            ]);

            const product = productResult.documents.find(p => p.$id === productId);
            const combinations = combinationsResult.data;

            return {
                product,
                combinations
            };
        },
        queryKey: ['virtual-store-product-pricing', virtualStoreId, productId],
        enabled: !!virtualStoreId && !!productId,
        staleTime: 1 * 60 * 1000,
    });
};