"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAddToCart } from "@/features/cart/cart.mutations";

export const AddToCartButton = ({ productId }: { productId: string }) => {

    const { mutate, isPending } = useAddToCart()

    const handleAddToCart = async () => {
        mutate({ productId, quantity: 1 })
    }

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAddToCart}
                        disabled={isPending}
                        className="rounded-full bg-white/80 transition-all duration-300 ease-in-out hover:bg-white hover:scale-110 active:scale-95"
                    >
                        <ShoppingCart className="h-4 w-4 text-gray-500 transition-colors duration-300 ease-in-out group-hover:text-gray-800" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="dark px-2 py-1 text-xs" showArrow={true}>
                    Add to cart
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}