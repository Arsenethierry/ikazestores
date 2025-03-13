import { useQuery } from "@tanstack/react-query";
import { getVirtualProductById } from "./actions/virtual-products-actions";

export const useGetProductById = (productId: string) => {
    return useQuery({
        queryFn: () => getVirtualProductById(productId),
        queryKey: ['product', productId],
    });
};
