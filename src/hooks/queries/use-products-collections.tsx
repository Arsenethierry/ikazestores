import { getAllCollectionsByStoreId } from "@/features/collections/actions/collections-actions";
import { useQuery } from "@tanstack/react-query";

export const useGetCollectionsByStoreId = ({ storeId, limit = 10, featured = false }: { storeId: string | null, limit?: number, featured?: boolean }) => {
    return useQuery({
        queryKey: ['products-collections', storeId],
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