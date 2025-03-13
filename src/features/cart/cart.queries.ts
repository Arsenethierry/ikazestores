import { useQuery } from "@tanstack/react-query"
import { getCart } from "../products/actions/cart-actions";

export const useGetCartItems = () => {
    return useQuery({
        queryKey: ['cartItems'],
        queryFn: async () => {
            try {
                const cartItems = await getCart();
                return cartItems
            } catch (error) {
                throw error;
            }
        }
    })
}