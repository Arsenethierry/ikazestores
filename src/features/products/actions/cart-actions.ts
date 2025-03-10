"use server";

import { CART_COOKIE } from "@/lib/constants";
import { Cart } from "@/lib/types";
import { cookies } from "next/headers";

export async function getCart(): Promise<Cart> {
    const cookieStore = await cookies();

    const cartCookie = cookieStore.get(CART_COOKIE);

    if (!cartCookie || !cartCookie.value) {
        return { items: [], totalItems: 0 };
    }

    try {
        const cart = JSON.parse(cartCookie.value) as Cart;
        return cart
    } catch (error) {
        console.error('Error parsing cart cookie:', error);
        return { items: [], totalItems: 0 };
    }
}

async function saveCartToCookies(cart: Cart): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(CART_COOKIE, JSON.stringify(cart), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
    });
}

export async function addToCart(productId: string, quantity: number): Promise<Cart> {
    const cart = await getCart();

    const existingCartItemIndex = cart.items.findIndex(item => item.id === productId);

    if (existingCartItemIndex !== -1) {
        cart.items[existingCartItemIndex].quantity += quantity;
    } else {
        cart.items.push({
            id: productId,
            quantity
        });
    }

    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    await saveCartToCookies(cart);

    return cart
};

export async function updateCartItem(productId: string, quantity: number): Promise<Cart> {
    const cart = await getCart();

    const itemIndex = cart.items.findIndex(item => item.id === productId);

    if (itemIndex !== -1) {
        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }

        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        await saveCartToCookies(cart);
    }
    return cart;
}

export async function removeFromCart(productId: string) {
    const cart = await getCart();

    cart.items.filter(item => item.id !== productId);

    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    await saveCartToCookies(cart);

    return cart;
}

export async function clearCart(): Promise<Cart> {
    const emptyCart: Cart = { items: [], totalItems: 0 };
    await saveCartToCookies(emptyCart);

    return emptyCart;
}