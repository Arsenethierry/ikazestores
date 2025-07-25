"use client";

import {
    createOriginalProduct,
    deleteOriginalProducts,
    getFeaturedOriginalProducts,
    getNearbyStoresOriginalProducts,
    getOriginalProductById,
    getOriginalProductsByCategory,
    getOriginalProductsByOwner,
    getOriginalProductsByPriceRange,
    getOriginalProductsByStatus,
    getOriginalProductsByTag,
    getStoreOriginalProducts,
    searchOriginalProducts,
    updateOriginalProduct
} from "@/lib/actions/original-products-actions";
import { getUserLocation } from "@/lib/geolocation";
import { CreateOriginalProductTypes, UpdateOriginalProductTypes } from "@/lib/schemas/products-schems";
import { ProductFilters } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetOriginalProductById = (productId: string) => {
    return useQuery({
        queryFn: () => getOriginalProductById(productId),
        queryKey: ['original-product', productId],
        enabled: !!productId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetStoreOriginalProducts = (storeId: string) => {
    return useQuery({
        queryFn: () => getStoreOriginalProducts(storeId),
        queryKey: ['store-original-products', storeId],
        enabled: !!storeId,
        staleTime: 2 * 60 * 1000,
    });
};

export const useSearchOriginalProducts = (
    searchTerm: string,
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
        categoryId?: string;
        status?: "active" | "inactive" | "draft";
        minPrice?: number;
        maxPrice?: number;
    } = {},
    enabled: boolean = true
) => {
    return useQuery({
        queryFn: () => searchOriginalProducts(searchTerm, options),
        queryKey: ['search-original-products', searchTerm, options],
        enabled: enabled && !!searchTerm,
        staleTime: 30 * 1000,
    });
};

export const useGetNearbyOriginalProducts = () => {
    return useQuery({
        queryKey: ["nearby-original-products"],
        queryFn: async () => {
            try {
                const location = await getUserLocation();
                if (!location) {
                    throw new Error("Failed to detect location. Please enable your location services.");
                }

                const RADIUS_OFFSET = 0.045;
                const southWest = {
                    lat: location.latitude - RADIUS_OFFSET,
                    lng: location.longitude - RADIUS_OFFSET,
                };
                const northEast = {
                    lat: location.latitude + RADIUS_OFFSET,
                    lng: location.longitude + RADIUS_OFFSET,
                };

                return getNearbyStoresOriginalProducts(southWest, northEast);
            } catch (error) {
                if (error instanceof Error) {
                    throw error;
                } else {
                    throw new Error("Failed to access location services. Please check browser permissions.");
                }
            }
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetFeaturedOriginalProducts = (
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) => {
    return useQuery({
        queryFn: () => getFeaturedOriginalProducts(options),
        queryKey: ['featured-original-products', options],
        staleTime: 10 * 60 * 1000,
    });
};

export const useGetOriginalProductsByCategory = (
    categoryId: string,
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) => {
    return useQuery({
        queryFn: () => getOriginalProductsByCategory(categoryId, options),
        queryKey: ['original-products-by-category', categoryId, options],
        enabled: !!categoryId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetOriginalProductsByPriceRange = (
    minPrice: number,
    maxPrice: number,
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) => {
    return useQuery({
        queryFn: () => getOriginalProductsByPriceRange(minPrice, maxPrice, options),
        queryKey: ['original-products-by-price-range', minPrice, maxPrice, options],
        enabled: minPrice >= 0 && maxPrice > minPrice,
        staleTime: 2 * 60 * 1000,
    });
};

export const useGetOriginalProductsByTag = (
    tag: string,
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) => {
    return useQuery({
        queryFn: () => getOriginalProductsByTag(tag, options),
        queryKey: ['original-products-by-tag', tag, options],
        enabled: !!tag,
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetOriginalProductsByOwner = (
    ownerId: string,
    options: {
        limit?: number;
        page?: number;
        status?: "active" | "inactive" | "draft";
    } = {}
) => {
    return useQuery({
        queryFn: () => getOriginalProductsByOwner(ownerId, options),
        queryKey: ['original-products-by-owner', ownerId, options],
        enabled: !!ownerId,
        staleTime: 2 * 60 * 1000,
    });
};

export const useGetOriginalProductsByStatus = (
    status: "active" | "inactive" | "draft",
    options: {
        limit?: number;
        page?: number;
        storeId?: string;
    } = {}
) => {
    return useQuery({
        queryFn: () => getOriginalProductsByStatus(status, options),
        queryKey: ['original-products-by-status', status, options],
        staleTime: 2 * 60 * 1000,
    });
};

export const useCreateOriginalProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateOriginalProductTypes) => createOriginalProduct(data),
        onSuccess: (result, variables) => {
            if ('error' in result) {
                toast.error(result.error);
                return;
            }

            toast.success(result.success);

            queryClient.invalidateQueries({ queryKey: ['store-original-products', variables.storeId] });
            queryClient.invalidateQueries({ queryKey: ['original-products-by-owner'] });
            queryClient.invalidateQueries({ queryKey: ['featured-original-products'] });

            if (variables.categoryId) {
                queryClient.invalidateQueries({
                    queryKey: ['original-products-by-category', variables.categoryId]
                });
            }

            if (variables.tags?.length) {
                variables.tags.forEach(tag => {
                    queryClient.invalidateQueries({
                        queryKey: ['original-products-by-tag', tag]
                    });
                });
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to create product");
        }
    });
};

export const useUpdateOriginalProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ productId, data }: { productId: string; data: UpdateOriginalProductTypes }) =>
            updateOriginalProduct(productId, data),
        onSuccess: (result, variables) => {
            if ('error' in result) {
                toast.error(result.error);
                return;
            }

            toast.success(result.success);

            queryClient.invalidateQueries({ queryKey: ['original-product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['store-original-products'] });
            queryClient.invalidateQueries({ queryKey: ['original-products-by-owner'] });
            queryClient.invalidateQueries({ queryKey: ['featured-original-products'] });
            queryClient.invalidateQueries({ queryKey: ['search-original-products'] });

            if (variables.data.categoryId) {
                queryClient.invalidateQueries({
                    queryKey: ['original-products-by-category', variables.data.categoryId]
                });
            }

            if (variables.data.status) {
                queryClient.invalidateQueries({
                    queryKey: ['original-products-by-status', variables.data.status]
                });
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update product");
        }
    });
};

export const useDeleteOriginalProducts = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (productIds: string | string[]) => deleteOriginalProducts(productIds),
        onSuccess: (result, variables) => {
            if ('error' in result) {
                toast.error(result.error);
                return;
            }

            toast.success(result.success);

            queryClient.invalidateQueries({ queryKey: ['store-original-products'] });
            queryClient.invalidateQueries({ queryKey: ['original-products-by-owner'] });
            queryClient.invalidateQueries({ queryKey: ['featured-original-products'] });
            queryClient.invalidateQueries({ queryKey: ['search-original-products'] });
            queryClient.invalidateQueries({ queryKey: ['original-products-by-category'] });
            queryClient.invalidateQueries({ queryKey: ['original-products-by-status'] });
            queryClient.invalidateQueries({ queryKey: ['original-products-by-tag'] });
            queryClient.invalidateQueries({ queryKey: ['original-products-by-price-range'] });
            queryClient.invalidateQueries({ queryKey: ['nearby-original-products'] });

            if (typeof variables === 'string') {
                queryClient.removeQueries({ queryKey: ['original-product', variables] });
            } else if (Array.isArray(variables)) {
                variables.forEach(productId => {
                    queryClient.removeQueries({ queryKey: ['original-product', productId] });
                });
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to delete product(s)");
        }
    });
};

export const useInfiniteOriginalProducts = (filters: ProductFilters) => {
    return useInfiniteQuery({
        queryKey: ['infinite-original-products', filters],
        queryFn: async ({ pageParam = 1 }) => {
            const options = {
                page: pageParam,
                limit: 12,
                status: filters.status,
                categoryId: filters.categoryId,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
            };

            if (filters.search) {
                const result = await searchOriginalProducts(filters.search, options);
                return {
                    products: result.documents,
                    nextPage: result.hasMore ? pageParam + 1 : undefined,
                    hasMore: result.hasMore
                };
            } else {
                const result = await getFeaturedOriginalProducts(options);
                return {
                    products: result.documents,
                    nextPage: result.hasMore ? pageParam + 1 : undefined,
                    hasMore: result.hasMore
                };
            }
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000,
    })
}

export const useNearbyProducts = (
    lat: number,
    lng: number,
    radiusKm: number,
    filters: ProductFilters
) => {
    return useQuery({
        queryKey: ['nearby-products', lat, lng, radiusKm, filters],
        queryFn: async () => {
            if (!lat || !lng) {
                throw new Error("Location coordinates are required");
            }

            const RADIUS_OFFSET = radiusKm * 0.009;
            const southWest = {
                lat: lat - RADIUS_OFFSET,
                lng: lng - RADIUS_OFFSET,
            };
            const northEast = {
                lat: lat + RADIUS_OFFSET,
                lng: lng + RADIUS_OFFSET,
            };

            const result = await getNearbyStoresOriginalProducts(southWest, northEast);

            let filteredProducts = result.documents;

            if (filters.status && filters.status !== 'all') {
                filteredProducts = filteredProducts.filter(product => product.status === filters.status);
            }

            if (filters.categoryId) {
                filteredProducts = filteredProducts.filter(product => product.categoryId === filters.categoryId);
            }

            if (filters.minPrice !== undefined) {
                filteredProducts = filteredProducts.filter(product => product.basePrice >= filters.minPrice!);
            }

            if (filters.maxPrice !== undefined) {
                filteredProducts = filteredProducts.filter(product => product.basePrice <= filters.maxPrice!);
            }

            return {
                products: filteredProducts,
                total: filteredProducts.length
            };
        },
        enabled: !!lat && !!lng,
        staleTime: 5 * 60 * 1000,
    })
}