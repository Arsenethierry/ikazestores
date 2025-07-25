import { addProductsToCollection, createNewCollectionAction, deleteCollectionAction, deleteCollectionGroup, getAllCollections, getAllCollectionsByStoreId, getCollectionById, getCollectionProducts, removeProductFromCollection, saveCollectionGroups, updateCollectionAction, updateCollectionGroup } from "@/lib/actions/collections-actions";
import { CreateCollectionSchemaType, UpdateCollectionSchemaType } from "@/lib/schemas/products-schems";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { collectionKeys } from "./query-keys";

export const useCollections = (options: {
    limit?: number;
    offset?: number;
    search?: string;
    featured?: boolean;
    storeId?: string;
} = {}) => {
    return useQuery({
        queryKey: collectionKeys.list(options),
        queryFn: async () => {
            return await getAllCollections(options);
        }
    })
};

export const useCreateCollection = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: CreateCollectionSchemaType) => {
            const result = await createNewCollectionAction(data);

            if (result.error) {
                throw new Error(result.error)
            }

            return result;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
            toast.success(data.message || "Collection created successfully");
            router.push(data.data?.storeId ? `/admin/${data.data.storeId}/collections` : "/admin/collections");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create collection");
        }
    })
};

export const useUpdateCollection = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: UpdateCollectionSchemaType) => {
            const result = await updateCollectionAction(data);

            if (result.error) {
                throw new Error(result.error)
            }

            return result;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
            if (variables.collectionId && data.data) {
                queryClient.setQueryData(
                    collectionKeys.detail(variables.collectionId),
                    data.data
                );
            }
            toast.success(data.message || "Collection updated successfully");
            router.push(data.data?.storeId ? `/admin/${data.data.storeId}/collections` : "/admin/collections");
        }
    })
}

export const useDeleteCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (collectionId: string) => {
            const result = await deleteCollectionAction(collectionId);
            if (result.error) {
                throw new Error(result.error)
            }
            toast.success(result.message)
            return result
        },
        onSuccess: (_, collectionId) => {
            queryClient.removeQueries({ queryKey: collectionKeys.detail(collectionId) });
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
            toast.success("Collection deleted successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete collection");
        }
    })
}

export const useGetCollectionsByStoreId = ({ storeId, limit = 10, featured = false }: { storeId: string | null, limit?: number, featured?: boolean }) => {
    return useQuery({
        queryKey: collectionKeys.byStore(storeId),
        queryFn: async () => {
            const result = await getAllCollectionsByStoreId({
                featured,
                limit,
                storeId
            });

            return result;
        },
        enabled: !!storeId,
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}

export const useGetCollectionById = (collectionId: string) => {
    return useQuery({
        queryKey: collectionKeys.detail(collectionId),
        queryFn: async () => {
            const collection = await getCollectionById({ collectionId, withGroups: false })
            return collection
        },
        enabled: !!collectionId,
        staleTime: 5 * 60 * 1000,
    })
}

export const useGetCollectionWithGroups = (collectionId: string) => {
    return useQuery({
        queryKey: collectionKeys.withGroups(collectionId),
        queryFn: async () => {
            const collection = await getCollectionById({ collectionId, withGroups: true })
            return collection
        },
        enabled: !!collectionId,
        staleTime: 5 * 60 * 1000,
    })
}

export const useGetCollectionProducts = (
    collectionId: string,
    groupId?: string | null,
    page = 1,
    limit = 10
) => {
    return useQuery({
        queryKey: collectionKeys.products(collectionId, groupId || undefined, page = 1, limit = 10),
        queryFn: async () => {
            const collectionsProductsResults = await getCollectionProducts({
                collectionId,
                groupId,
                page,
                limit
            });
            
            return collectionsProductsResults
        },
        enabled: !!collectionId,
        staleTime: 2 * 60 * 1000,
    })
}

export const useSaveCollectionGroups = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            collectionId: string;
            groups: Array<{
                id: string;
                groupName: string;
                displayOrder: number;
                groupImage: File | string;
            }>;
        }) => {
            const result = await saveCollectionGroups(data);
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.withGroups(variables.collectionId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.groups(variables.collectionId) 
            });
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
            
            toast.success("Collection groups saved successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to save collection groups");
        }
    });
};

export const useUpdateCollectionGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            groupId: string;
            groupName: string;
            displayOrder: number;
            groupImage?: File | string;
            oldImageId?: string;
        }) => {
            const result = await updateCollectionGroup(data);
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
            toast.success("Collection group updated successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update collection group");
        }
    });
};

export const useDeleteCollectionGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            collectionId: string;
            groupId: string;
            imageId?: string;
        }) => {
            const result = await deleteCollectionGroup(data);
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.withGroups(variables.collectionId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.groups(variables.collectionId) 
            });
            queryClient.invalidateQueries({ queryKey: collectionKeys.all });
            
            toast.success("Collection group deleted successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete collection group");
        }
    });
};

export const useAddProductsToCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            collectionId: string;
            productsIds: string[];
            groupId?: string;
        }) => {
            const result = await addProductsToCollection(data);
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.products(variables.collectionId, variables.groupId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.detail(variables.collectionId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.withGroups(variables.collectionId) 
            });
            
            toast.success("Products added to collection successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to add products to collection");
        }
    });
};

export const useRemoveProductFromCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            collectionId: string;
            productId: string;
            groupId?: string;
        }) => {
            const result = await removeProductFromCollection(data);
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.products(variables.collectionId, variables.groupId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.detail(variables.collectionId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: collectionKeys.withGroups(variables.collectionId) 
            });
            
            toast.success("Product removed from collection successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to remove product from collection");
        }
    });
};