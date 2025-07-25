import { createPhysicalStoreAction, deletePhysicalStore, getAllPshyicalStoresByOwnerId, getNearbyPhysicalStoresAction, getPaginatedPhysicalStores, getPhysicalStoreById, searchPhysicalByName, updatePhysicalStoreAction } from "@/lib/actions/physical-store.action";
import { PhysicalStoreFilters } from "@/lib/models/physical-store-model";
import { PhysicalStoreTypes, UpdateVirtualStoreTypes } from "@/lib/types";
import { PhysicalStore } from "@/lib/types/appwrite/appwrite";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { physicalStoreKeys } from "./query-keys";
import { PaginationResult } from "@/lib/core/database";

export interface UpdateStoreResponse {
    success?: string;
    data?: PhysicalStore;
    error?: string;
    details?: Record<string, string[]>;
}

export interface DeleteStoreResponse {
    success?: string;
    error?: string;
}

export function useGetPhysicalStoreById(
    storeId: string,
    options?: Omit<UseQueryOptions<PhysicalStore | null>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: physicalStoreKeys.detail(storeId),
        queryFn: () => getPhysicalStoreById(storeId),
        enabled: !!storeId,
        staleTime: 5 * 60 * 1000,
        ...options,
    })
}

export function usePhysicalStoresByOwner(
    ownerId: string,
    options?: Omit<UseQueryOptions<PaginationResult<PhysicalStoreTypes> | null>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: physicalStoreKeys.byOwner(ownerId),
        queryFn: () => getAllPshyicalStoresByOwnerId(ownerId),
        enabled: !!ownerId,
        staleTime: 2 * 60 * 1000,
        ...options,
    });
};

export function useSearchPhysicalStores(
    searchTerm: string,
    options?: { limit?: number; offset?: number } & Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
    const { limit, offset, ...queryOptions } = options || {};

    return useQuery({
        queryKey: physicalStoreKeys.search(searchTerm),
        queryFn: async () => await searchPhysicalByName(searchTerm, { limit, offset }),
        enabled: !!searchTerm && searchTerm.trim().length > 0,
        staleTime: 30 * 1000,
        ...queryOptions,
    });
}

export function useGetNearbyPhysicalStores(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    options?: { limit?: number; offset?: number } & Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
    const { limit, offset, ...queryOptions } = options || {};
    console.debug(limit, offset)

    return useQuery({
        queryKey: physicalStoreKeys.nearby(latitude, longitude, radiusKm),
        queryFn: async () => await getNearbyPhysicalStoresAction(latitude, longitude, radiusKm, options),
        enabled: !!latitude && !!longitude,
        staleTime: 2 * 60 * 1000,
        ...queryOptions
    })
}

export function useCreatePhysicalStore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPhysicalStoreAction,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: physicalStoreKeys.all });
            if (data.success && data.storeId) {
                queryClient.prefetchQuery({
                    queryKey: physicalStoreKeys.detail(data.storeId),
                    queryFn: () => getPhysicalStoreById(data.storeId!),
                });
            }
        },
        onError: (error) => {
            console.error('Failed to create physical store:', error);
        },
    })
}

export function useUpdatePhysicalStore() {
    const queryClient = useQueryClient();

    return useMutation<UpdateStoreResponse, Error, UpdateVirtualStoreTypes>({
        mutationFn: updatePhysicalStoreAction,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: physicalStoreKeys.all });
            const storeId = data.data?.$id;

            if (storeId) {
                queryClient.invalidateQueries({ queryKey: physicalStoreKeys.detail(storeId) });
            }
            if (variables.storeId && data.data) {
                queryClient.setQueryData(
                    physicalStoreKeys.detail(variables.storeId),
                    data.data
                );
            }
        },
        onError: (error) => {
            console.error('Failed to update physical store:', error);
        },
    })
}

export const useDeletePhysicalStore = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteStoreResponse, Error, { storeId: string, bannerIds?: string[] }>({
        mutationFn: ({ storeId, bannerIds }) => deletePhysicalStore(storeId, bannerIds),
        onSuccess: (data, variables) => {
            queryClient.removeQueries({
                queryKey: physicalStoreKeys.detail(variables.storeId)
            });

            queryClient.invalidateQueries({ queryKey: physicalStoreKeys.all });
        },
        onError: (error) => {
            console.error('Failed to delete physical store:', error);
        }
    });
};

export function usePrefetchPhysicalStore() {
    const queryClient = useQueryClient();

    return (storeId: string) => {
        queryClient.prefetchQuery({
            queryKey: physicalStoreKeys.detail(storeId),
            queryFn: () => getPhysicalStoreById(storeId),
            staleTime: 5 * 60 * 1000,
        });
    }
}

export function usePrefetchStoresByOwner() {
    const queryClient = useQueryClient();

    return (ownerId: string) => {
        queryClient.prefetchQuery({
            queryKey: physicalStoreKeys.byOwner(ownerId),
            queryFn: () => getAllPshyicalStoresByOwnerId(ownerId),
            staleTime: 2 * 60 * 1000,
        });
    };
}

export function useInfinitePhysicalStores(
    filters: PhysicalStoreFilters,
    options?: { pageSize?: number }
) {
    const pageSize = options?.pageSize || 20;

    return useInfiniteQuery({
        queryKey: [...physicalStoreKeys.list(filters), 'infinite'],
        queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
            return await getPaginatedPhysicalStores(filters, {
                limit: pageSize,
                offset: pageParam * pageSize
            });
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.hasMore) {
                return undefined;
            }
            return allPages.length;
        },
        initialPageParam: 0,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    })
}