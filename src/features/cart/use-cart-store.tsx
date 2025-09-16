import { create } from 'zustand';
import { persist } from 'zustand/middleware'
import { CartItem, VirtualProductTypes } from "@/lib/types";

interface CartState {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addToCart: (item: VirtualProductTypes) => void
    removeFromCart: (itemId: string) => void
    updateItemQuantity: (itemId: string, quantity: number) => void
    clearCart: () => void
    getCartItemsCount: () => number
    getCartTotal: () => number
    isItemInCart: (productId: string) => boolean
    getItemQuantity: (productId: string) => number
}

const calculateCartTotals = (items: CartItem[]) => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0)
    const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0)
    return { totalItems, totalPrice }
}

export const useCartStore = create(
    persist<CartState>(
        (set, get) => ({
            items: [],
            totalItems: 0,
            totalPrice: 0,

            addToCart: (newItem: VirtualProductTypes) => {
                set((state) => {
                    const updatedItems = [...state.items];

                    const existingItemIndex = updatedItems.findIndex(
                        item => item.productId === newItem.$id
                    )

                    if (existingItemIndex > -1) {
                        updatedItems[existingItemIndex] = {
                            ...updatedItems[existingItemIndex],
                            quantity: updatedItems[existingItemIndex].quantity + 1,
                            productCurrency: newItem.currency || 'USD'
                        }
                    } else {
                        updatedItems.push({
                            id: Math.random().toString(36).substring(2, 15),
                            productId: newItem.$id,
                            virtualProductId: newItem.$id,
                            name: newItem.name,
                            price: newItem.price,
                            originalPrice: newItem.basePrice || newItem.price,
                            quantity: 1,
                            image: newItem.images?.[0] || '',
                            productCurrency: newItem.currency || 'USD',
                            sku: newItem.sku || `SKU-${newItem.$id}`,
                            virtualStoreId: newItem.virtualStoreId,
                            physicalStoreId: newItem.physicalStoreId,
                            commission: 0, // Default commission
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

            removeFromCart: (itemId: string) => {
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

            updateItemQuantity: (itemId: string, quantity: number) => {
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
            },

            getCartItemsCount: () => {
                return get().totalItems;
            },

            getCartTotal: () => {
                return get().totalPrice;
            },

            isItemInCart: (productId: string) => {
                return get().items.some(item => item.productId === productId);
            },

            getItemQuantity: (productId: string) => {
                const item = get().items.find(item => item.productId === productId);
                return item ? item.quantity : 0;
            }
        }),
        {
            name: "cart-store",
        }
    )
)