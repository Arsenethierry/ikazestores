"use client";

import { createVirtualStoreAction, deleteVirtualStore, getAllVirtualStoresByOwnerId, getVirtualStoreById, updateVirtualStore } from "@/lib/actions/virtual-store.action";
import { CreateVirtualStoreTypes, UpdateVirtualStoreTypes, VirtualStoreTypes } from "@/lib/types";
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { virtualStoreKeys } from "./query-keys";
import { PaginationResult } from "@/lib/core/database";

export const useCreateVirtualStore = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: CreateVirtualStoreTypes) => {
            return await createVirtualStoreAction(data);
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.success || "Collection created successfully");
                queryClient.invalidateQueries({ queryKey: virtualStoreKeys.all })
                router.push(`/admin/stores/${result.storeId}`)
            } else {
                toast.error(result.error || "Failed to create collection");
            }
        },
        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    })
}

export const useUpdateVirtualStore = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async ({ storeId, data }: { storeId: string, data: Partial<UpdateVirtualStoreTypes> }) => {
            return await updateVirtualStore(storeId, data);
        },
        onSuccess: (result, variables) => {
            if (result.success) {
                toast.success(result.success || "Store updated successfully");
                queryClient.invalidateQueries({ queryKey: virtualStoreKeys.all });
                queryClient.invalidateQueries({ queryKey: virtualStoreKeys.detail(variables.storeId) });
                
                queryClient.setQueryData(
                    virtualStoreKeys.detail(variables.storeId), 
                    (oldData: VirtualStoreTypes | null) => {
                        if (oldData && result) {
                            return { ...oldData, ...result.data };
                        }
                        return oldData;
                    }
                );

                router.push(`/admin/stores/${result.data.$id}`);
            } else {
                toast.error(result.error || "Failed to update store");
            }
        },
        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    })
}

export const useGetVirtualStoreById = (
    storeId: string,
    options?: Omit<UseQueryOptions<VirtualStoreTypes | null>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: virtualStoreKeys.detail(storeId),
        queryFn: () => getVirtualStoreById(storeId),
        enabled: !!storeId,
        staleTime: 5 * 60 * 1000,
        retry: 2,
        ...options,
    })
}

export const useGetVirtualStoresByOwnerId = (
    ownerId: string,
    options?: Omit<UseQueryOptions<PaginationResult<VirtualStoreTypes> | null>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: virtualStoreKeys.list({ ownerId }),
        queryFn: () => getAllVirtualStoresByOwnerId(ownerId),
        enabled: !!ownerId,
        staleTime: 5 * 60 * 1000,
        retry: 2,
        ...options
    })
}

export const useDeleteVirtualStore = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (storeId: string) => {
            return await deleteVirtualStore(storeId);
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.success || "Store deleted successfully");
                queryClient.invalidateQueries({ queryKey: virtualStoreKeys.all });
                router.push('/admin/stores');
            } else {
                toast.error(result.error || "Failed to delete store");
            }
        },
        onError: (error: any) => {
            toast.error(error.message || "Something went wrong");
        },
    });
};