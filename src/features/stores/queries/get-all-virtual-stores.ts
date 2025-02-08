import { getAllVirtualStores } from "@/lib/actions/vitual-store.action";
import { useQuery } from "@tanstack/react-query";

export const useGetAllVirtualStores = () => {
    return useQuery({
        queryKey: ["virtualStores"],
        queryFn: async () => {
            try {
                const virtualStores = await getAllVirtualStores()
                return virtualStores;
            } catch (error) {
                throw error;
            }
        }
    });
};
