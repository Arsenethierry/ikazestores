import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addToCart, clearCart, removeFromCart, updateCartItem } from "../products/actions/cart-actions";

type CartPayload = {
    productId: string,
    quantity: number
}

const cartQueryKey = { queryKey: ["cartItems"] }

export const useAddToCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ productId, quantity }: CartPayload) => addToCart(productId, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
    });
}

export const useUpdateCartItemQuantity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, quantity }: CartPayload) => updateCartItem(productId, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries(cartQueryKey);
        }
    });
};

export const useRemoveFromCart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (productId: string) => removeFromCart(productId),
        onSuccess: () => {
            queryClient.invalidateQueries(cartQueryKey);
        }
    });
};

export const useClearCart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: clearCart,
        onSuccess: () => {
            queryClient.invalidateQueries(cartQueryKey);
        }
    });
};