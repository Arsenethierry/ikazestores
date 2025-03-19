'use server'

import { calculateCartTotals } from "@/lib/cart";
import { CART_COOKIE } from "@/lib/constants";
import { AddToCartSchema } from "@/lib/schemas";
import { CartItem } from "@/lib/types";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const addToCart = action
    .schema(AddToCartSchema)
    .action(async ({ parsedInput: values }) => {
        const { $id, imageUrl, quantity, sellingPrice, title } = values;
        try {
            const cookieStore = await cookies();
            const cartCookie = cookieStore.get(CART_COOKIE);
            let cartItems: CartItem[] = [];

            if (cartCookie?.value) {
                try {
                    cartItems = JSON.parse(cartCookie.value)
                    const existingItemIndex = cartItems.findIndex(item => item.productId === $id);
                    if (existingItemIndex > -1) {
                        cartItems[existingItemIndex].quantity += quantity;
                    } else {
                        const newItem: CartItem = {
                            id: Math.random().toString(36).substring(2, 15),
                            productId: $id,
                            name: title,
                            price: sellingPrice,
                            quantity,
                            image: imageUrl,
                        };
                        cartItems.push(newItem);
                    }
                } catch (error) {
                    console.error('Failed to parse cart cookie:', error);
                }
            }

            cookieStore.set({
                name: CART_COOKIE,
                value: JSON.stringify(cartItems),
                maxAge: COOKIE_MAX_AGE,
                path: '/',
                httpOnly: true,
                sameSite: 'lax'
            });

            revalidatePath('/cart');

            const { totalItems, totalPrice } = calculateCartTotals(cartItems);

            return { success: true, items: cartItems, totalItems, totalPrice };
        } catch (error) {
            console.error('addToCart error:', error);
            return { error: error instanceof Error ? error.message : "Add to cart failed" };
        }
    })

export const removeFromCart = async (itemId: string) => {
    try {
        const cookieStore = await cookies();
        const cartCookie = cookieStore.get(CART_COOKIE);

        if (!cartCookie?.value) {
            return { success: false, error: 'Cart is empty' };
        }

        let cartItems: CartItem[] = [];

        try {
            cartItems = JSON.parse(cartCookie.value);
        } catch (error) {
            console.error('Failed to parse cart cookie:', error);
            return { success: false, error: 'Failed to parse cart data' };
        }

        const updatedItems = cartItems.filter(item => item.id !== itemId);

        cookieStore.set({
            name: CART_COOKIE,
            value: JSON.stringify(updatedItems),
            maxAge: COOKIE_MAX_AGE,
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
        });

        revalidatePath('/cart');

        const { totalItems, totalPrice } = calculateCartTotals(updatedItems);
        return { success: true, items: updatedItems, totalItems, totalPrice };
    } catch (error) {
        console.error('removeFromCart error:', error);
        return { success: false, error: 'Failed to remove item from cart' };
    }
}

export const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    try {
        if (quantity < 1) {
            return removeFromCart(itemId);
        }
        const cookieStore = await cookies();
        const cartCookie = cookieStore.get(CART_COOKIE);

        if (!cartCookie?.value) {
            return { success: false, error: 'Cart is empty' };
        }

        let cartItems: CartItem[] = [];

        try {
            cartItems = JSON.parse(cartCookie.value);
        } catch (error) {
            console.error('Failed to parse cart cookie:', error);
            return { success: false, error: 'Failed to parse cart data' };
        }

        const itemIndex = cartItems.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return { success: false, error: 'Item not found in cart' };
        }

        cartItems[itemIndex].quantity = quantity;

        cookieStore.set({
            name: CART_COOKIE,
            value: JSON.stringify(cartItems),
            maxAge: COOKIE_MAX_AGE,
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
        });
        revalidatePath('/cart');

        const { totalItems, totalPrice } = calculateCartTotals(cartItems);
        return { success: true, items: cartItems, totalItems, totalPrice };
    } catch (error) {
        console.error('updateCartItemQuantity error:', error);
        return { success: false, error: 'Failed to update cart' };
    }
}

export const clearCart = async () => {
    try {
        const cookieStore = await cookies();
        cookieStore.delete(CART_COOKIE);

        revalidatePath('/cart');
        return { success: true, items: [], totalItems: 0, totalPrice: 0 };
    } catch (error) {
        console.error('clearCart error:', error);
        return { success: false, error: 'Failed to clear cart' };
    }
}