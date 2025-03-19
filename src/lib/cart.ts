import { cookies } from "next/headers";
import { Cart, CartItem } from "./types";
import { CART_COOKIE } from "./constants";

export const calculateCartTotals = (items: CartItem[]): { totalItems: number; totalPrice: number } => {
    if (Array.isArray(items)) {
        return items?.reduce(
            (acc, item) => {
                acc.totalItems += item.quantity;
                acc.totalPrice += item.price * item.quantity;
                return acc;
            },
            { totalItems: 0, totalPrice: 0 }
        );
    }
    return { totalItems: 0, totalPrice: 0 }
};

// Server-side function to get the cart
export const getCart = async (): Promise<Cart> => {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get(CART_COOKIE);

    if (!cartCookie?.value) {
        return { items: [], totalItems: 0, totalPrice: 0 };
    }

    console.log("hbdgedge",cartCookie);

    try {
        const items = JSON.parse(cartCookie.value) as CartItem[];
        const { totalItems, totalPrice } = calculateCartTotals(items);

        return { items, totalItems, totalPrice };
    } catch (error) {
        console.error('Failed to parse cart cookie:', error);
        return { items: [], totalItems: 0, totalPrice: 0 };
    }
}