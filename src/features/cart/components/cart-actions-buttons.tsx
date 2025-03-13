"use client"

import { CartItem } from "@/lib/types"
import { Button } from "../../../components/ui/button"
import { updateCartItem } from "@/features/products/actions/cart-actions"
import { Input } from "../../../components/ui/input"

export const DecreaseCartItemQuantity = ({ item }: { item: CartItem }) => {

    const reduceCartItemQuantity = async () => {
        await updateCartItem(item.id, item.quantity - 1)
    }

    return <Button
        variant="outline"
        size="sm"
        onClick={reduceCartItemQuantity}
    >
        -
    </Button>
}
export const IncreaseCartItemQuantity = ({ item }: { item: CartItem }) => {
    const increaseCartItemQuantity = async () => {
        await updateCartItem(item.id, item.quantity + 1)
    }

    return <Button
        variant="outline"
        size="sm"
        onClick={increaseCartItemQuantity}
    >
        +
    </Button>
}

export const CartQuantityDisplay = ({ item }: { item: CartItem }) => {

    return <Input
        type="number"
        defaultValue={item.quantity ?? 1}
        className="w-16 text-center"
        min="1"
    />
}