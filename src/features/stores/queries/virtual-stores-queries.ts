import { getAllVirtualStores, getAllVirtualStoresByOwnerId } from "@/lib/actions/vitual-store.action";
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