import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { virtualProductsKeys } from "./query-keys";
import {
    addNewVirtualProduct,
    checkProductCloneStatus,
    getAllVirtualProducts,
    getAllVirtualPropByOriginalProduct,
    getNearbyOriginalProducts,
    getOriginalProductsWithVirtualProducts,
    getPaginatedVirtualProducts,
    getVirtualProductById, getVirtualProductsByOwner,
    getVirtualProductsByStatus,
    getVirtualStoreProducts,
    removeProduct,
    searchVirtualProducts,
    updateVirtualProduct
} from "@/lib/actions/virtual-products-actions";
import { CreateVirtualProductTypes, VirtualProductsSearchParams, VirtualProductTypes } from "@/lib/types";
import { toast } from "sonner";

export const useGetVirtualProductById = (productId: string) => {
    return useQuery({
        queryKey: virtualProductsKeys.detail(productId),
        queryFn: async () => {
            const result = await getVirtualProductById(productId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!productId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetAllVirtualProducts = (params: {
    search?: string;
    page?: number;
    limit?: number;
}) => {
    return useQuery({
        queryKey: virtualProductsKeys.list(params),
        queryFn: async () => {
            const result = await getAllVirtualProducts(params);
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch products');
            }
            return result.data;
        },
        staleTime: 2 * 60 * 1000,
    });
};

export const useGetVirtualStoreProducts = (params: {
    virtualStoreId: string;
    limit?: number;
    page?: number;
    search?: string;
    withStoreData: boolean;
}) => {
    return useQuery({
        queryKey: virtualProductsKeys.storeProducts(params.virtualStoreId, params),
        queryFn: async () => {
            const result = await getVirtualStoreProducts(params);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!params.virtualStoreId,
        staleTime: 2 * 60 * 1000,
    });
}

export const useGetOriginalProductsWithVirtual = (params: {
    storeId?: string;
    categoryId?: string;
    subcategoryId?: string;
    productTypeId?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    tags?: string[];
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userLat?: number;
    userLng?: number;
    radiusKm?: number;
}) => {
    return useQuery({
        queryKey: virtualProductsKeys.list(params),
        queryFn: async () => {
            const result = await getOriginalProductsWithVirtualProducts(params);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        staleTime: 3 * 60 * 1000,
    });
}

export const useGetNearbyOriginalProducts = (params: {
    userLat: number;
    userLng: number;
    radiusKm: number;
    limit?: number;
}) => {
    return useQuery({
        queryKey: virtualProductsKeys.nearby(params),
        queryFn: async () => {
            const result = await getNearbyOriginalProducts(params);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!(params.userLat && params.userLng && params.radiusKm),
        staleTime: 5 * 60 * 1000,
    });
}

export const useGetProductCloneStatus = (
    originalProductId: string,
    virtualStoreId: string
) => {
    return useQuery({
        queryKey: virtualProductsKeys.clone(originalProductId, virtualStoreId),
        queryFn: async () => {
            const result = await checkProductCloneStatus(originalProductId, virtualStoreId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!(originalProductId && virtualStoreId),
        staleTime: 1 * 60 * 1000,
    });
}

export const useGetVirtualProductsByOriginal = (originalProductId: string) => {
    return useQuery({
        queryKey: virtualProductsKeys.originalProduct(originalProductId),
        queryFn: async () => {
            const result = await getAllVirtualPropByOriginalProduct(originalProductId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!originalProductId,
        staleTime: 3 * 60 * 1000,
    });
};

export const useSearchVirtualProducts = (params: {
    query: string;
    limit: number;
    currentStoreId?: string;
}) => {
    return useQuery({
        queryKey: virtualProductsKeys.search(`${params.query}-${params.limit}-${params.currentStoreId}`),
        queryFn: async () => {
            const result = await searchVirtualProducts(params);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!params.query && params.query.length > 0,
        staleTime: 1 * 60 * 1000,
    });
}

export const useGetPaginatedVirtualProducts = (
    searchParams: VirtualProductsSearchParams,
    storeId?: string
) => {
    return useQuery({
        queryKey: virtualProductsKeys.paginated(searchParams, storeId),
        queryFn: async () => {
            const result = await getPaginatedVirtualProducts({ searchParams, storeId });
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}

export const useGetVirtualProductsByStatus = (
    status: "active" | "inactive" | "draft",
    options?: { limit?: number; page?: number }
) => {
    return useQuery({
        queryKey: virtualProductsKeys.status(`${status}-${options?.limit}-${options?.page}`),
        queryFn: async () => {
            const result = await getVirtualProductsByStatus(status, options);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        staleTime: 2 * 60 * 1000,
    });
}

export const useVirtualProductsByOwner = (
    ownerId: string,
    options?: { limit?: number; page?: number }
) => {
    return useQuery({
        queryKey: virtualProductsKeys.owner(`${ownerId}-${options?.limit}-${options?.page}`),
        queryFn: async () => {
            const result = await getVirtualProductsByOwner(ownerId, options);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!ownerId,
        staleTime: 2 * 60 * 1000,
    });
}

// ============ MUTATIONS ============

export const useCreateVirtualProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateVirtualProductTypes) => {
            const result = await addNewVirtualProduct(data);
            if ('error' in result) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: (data, variables) => {
            toast.success('Virtual product created successfully');
            queryClient.invalidateQueries({ queryKey: virtualProductsKeys.all });
            queryClient.invalidateQueries({
                queryKey: virtualProductsKeys.store(variables.storeId)
            });
            queryClient.invalidateQueries({
                queryKey: virtualProductsKeys.originalProduct(variables.originalProductId)
            });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create virtual product');
        }
    })
}

export const useUpdateVirtualProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            productId: string;
            updateData: Partial<VirtualProductTypes>;
        }) => {
            const result = await updateVirtualProduct(params.productId, params.updateData);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            toast.success('Product updated successfully');
            queryClient.setQueryData(
                virtualProductsKeys.detail(variables.productId),
                data
            );
            queryClient.invalidateQueries({ queryKey: virtualProductsKeys.lists() });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update product');
        },
    })
};

export const useDeleteVirtualProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            const result = await removeProduct(productId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: (_, productId) => {
            toast.success('Product deleted successfully');

            queryClient.removeQueries({
                queryKey: virtualProductsKeys.detail(productId)
            });

            queryClient.invalidateQueries({ queryKey: virtualProductsKeys.lists() });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete product');
        },
    });
};

export const usePrefetchVirtualProduct = () => {
    const queryClient = useQueryClient();

    return (productId: string) => {
        queryClient.prefetchQuery({
            queryKey: virtualProductsKeys.detail(productId),
            queryFn: async () => {
                const result = await getVirtualProductById(productId);
                if (!result.success) {
                    throw new Error(result.error);
                }
                return result.data;
            },
            staleTime: 5 * 60 * 1000,
        });
    };
};

export const usePrefetchVirtualStoreProducts = () => {
    const queryClient = useQueryClient();

    return (storeId: string) => {
        queryClient.prefetchQuery({
            queryKey: virtualProductsKeys.storeProducts(storeId),
            queryFn: async () => {
                const result = await getVirtualStoreProducts({
                    virtualStoreId: storeId,
                    withStoreData: false,
                });
                if (!result.success) {
                    throw new Error(result.error);
                }
                return result.data;
            },
            staleTime: 2 * 60 * 1000,
        });
    };
};