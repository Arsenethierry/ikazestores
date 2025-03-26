import { create } from 'zustand';
import { persist } from 'zustand/middleware'
import { CartItem } from "@/lib/types";

interface CartState {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addToCart: (item: {
        $id: string
        imageUrl: string
        quantity: number
        sellingPrice: number
        title: string
    }) => void
    removeFromCart: (item: string) => void
    updateItemQuantity: (item: string, quantity: number) => void
    clearCart: () => void
}

const calculateCartTotals = (items: CartItem[]) => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0)
    const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0)
    return { totalItems, totalPrice }
}

export const useCartStore = create(
    persist<CartState>(
        (set) => ({
            items: [],
            totalItems: 0,
            totalPrice: 0,

            addToCart: (newItem) => {
                set((state) => {
                    const updatedItems = [...state.items];

                    const existingItemIndex = updatedItems.findIndex(
                        item => item.productId === newItem.$id
                    )

                    if (existingItemIndex > -1) {
                        updatedItems[existingItemIndex] = {
                            ...updatedItems[existingItemIndex],
                            quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
                        }
                    } else {
                        updatedItems.push({
                            id: Math.random().toString(36).substring(2, 15),
                            productId: newItem.$id,
                            name: newItem.title,
                            price: newItem.sellingPrice,
                            quantity: newItem.quantity,
                            image: newItem.imageUrl
                        })
                    }

                    const { totalItems, totalPrice } = calculateCartTotals(updatedItems);

                    return {
                        items: updatedItems,
                        totalItems,
                        totalPrice,
                    }
                })
            },

            removeFromCart: (itemId) => {
                set((state) => {
                    const updatedItems = state.items.filter(item => item.id !== itemId);

                    const { totalItems, totalPrice } = calculateCartTotals(updatedItems);

                    return {
                        items: updatedItems,
                        totalItems,
                        totalPrice
                    }
                })
            },

            updateItemQuantity: (itemId, quantity) => {
                set((state) => {
                    if (quantity < 1) {
                        const updatedItems = state.items.filter(item => item.id !== itemId);
                        const { totalItems, totalPrice } = calculateCartTotals(updatedItems);

                        return {
                            items: updatedItems,
                            totalItems,
                            totalPrice
                        }
                    }

                    const updatedItems = state.items.map(item =>
                        item.id === itemId
                            ? { ...item, quantity }
                            : item
                    )

                    const { totalItems, totalPrice } = calculateCartTotals(updatedItems);

                    return {
                        items: updatedItems,
                        totalItems,
                        totalPrice,
                    }
                })
            },

            clearCart: () => {
                set({
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                })
            }
        }),
        {
            name: "cart-store",
        }
    )
)