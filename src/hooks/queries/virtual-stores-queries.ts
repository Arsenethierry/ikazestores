import { getAllVirtualStores, getAllVirtualStoresByOwnerId, getVirtualStoreById } from "@/lib/actions/vitual-store.action";
import { useQuery } from "@tanstack/react-query";

export const useGetAllVirtualStores = () => {
    return useQuery({
        queryKey: ["virtualStores"],
        queryFn: async () => {
            try {
                const virtualStores = await getAllVirtualStores({ withProducts: true })
                return virtualStores;
            } catch (error) {
                throw error;
            }
        }
    });
};

export const useGetAllVirtualStoresByOwnerId = (userId: string) => {
    return useQuery({
        queryKey: ["userVirtualStores", userId],
        queryFn: async () => {
            try {
                const virtualStores = await getAllVirtualStoresByOwnerId(userId)
                return virtualStores;
            } catch (error) {
                throw error;
            }
        }
    });
};

export const useGetVirtualStoreById = (storeId: string) => {
    return useQuery({
        queryKey: ['virtualStore', storeId],
        queryFn: async () => {
            const result = await getVirtualStoreById(storeId);

            if(!result) {
                throw new Error('Failed to fetch store');
            }

            return result;
        },
        enabled: !!storeId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}