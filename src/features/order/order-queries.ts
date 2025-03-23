import { useQuery } from "@tanstack/react-query";
import { getDeliveryAddresses } from "./actions/order-actions";

export const useGetDeliverAddress = (currentUserId: string) => {
    return useQuery({
        queryKey: ["deliveryAddress", currentUserId],
        queryFn: async () => {
            if (!currentUserId) return { documents: [], total: 0 };

            try {
                const addresses = await getDeliveryAddresses(currentUserId);
                return addresses || { documents: [], total: 0 };
            } catch (error) {
                console.error("Failed to fetch delivery address:", error);
                return { documents: [], total: 0 };
            }
        },
        enabled: !!currentUserId,
    });
};