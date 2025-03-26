"use client"

import { CartItem } from "@/lib/types"
import { Button } from "../../../components/ui/button"
import { Minus, Plus, Trash } from 'lucide-react';
import { useCartStore } from "../use-cart-store";

export const DecreaseCartItemQuantity = ({ item }: { item: CartItem }) => {
    const { updateItemQuantity } = useCartStore();

    const reduceCartItemQuantity = () => {
        updateItemQuantity(item.id, item.quantity - 1)
    }

    return <Button
        variant="outline"
        size="sm"
        className='h-8 w-8 p-0 rounded-full'
        onClick={reduceCartItemQuantity}
        disabled={item.quantity === 1}
    >
        <Minus className='h-4 w-4' />
    </Button>
}
export const IncreaseCartItemQuantity = ({ item }: { item: CartItem }) => {
    const { updateItemQuantity } = useCartStore();

    const increaseCartItemQuantity = () => {
        updateItemQuantity(item.id, item.quantity + 1)
    }

    return <Button
        variant="outline"
        size="sm"

        onClick={increaseCartItemQuantity}
        className='h-8 w-8 p-0 rounded-full'
    >
        <Plus className='h-4 w-4' />
    </Button>
}

export const RemoveCartItem = ({ item }: { item: CartItem }) => {
    const { removeFromCart } = useCartStore();

    const deleteCartItem = () => {
        removeFromCart(item.id)
    }

    return <Button
        variant="destructive"
        size="sm"
        className='gap-1.5'
        onClick={deleteCartItem}
    >
        <Trash className='h-4 w-4' />
        <span>Remove</span>
    </Button>
}