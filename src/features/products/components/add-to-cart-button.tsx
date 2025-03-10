"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { addToCart } from "../actions/cart-actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const AddToCartButton = ({ productId }: { productId: string }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleAddToCart = async () => {
        setIsLoading(true);
        await addToCart(productId, 1);
        setIsLoading(false);
    }

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAddToCart}
                        disabled={isLoading}
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