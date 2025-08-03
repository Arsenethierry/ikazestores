"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VirtualProductTypes } from "@/lib/types";
import { useCartStore } from "../use-cart-store";
import { toast } from "sonner";

interface AddToCartButtonProps {
    item: VirtualProductTypes;
    variant?: "primary" | "destructive" | "outline" | "secondary" | "ghost" | "muted" | "teritary";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    showText?: boolean;
    text?: string;
    showTooltip?: boolean;
    tooltipText?: string;
    iconSize?: string;
}

export const AddToCartButton = ({ 
    item, 
    variant = "ghost",
    size = "icon",
    className = "",
    showText = false,
    text = "BUY NOW",
    showTooltip = true,
    tooltipText = "Add to cart",
    iconSize = "h-4 w-4"
}: AddToCartButtonProps) => {
    const { addToCart } = useCartStore.getState()

    const handleAddToCart = async () => {
        const cartData = {
            $id: item.$id,
            title: item.title,
            sellingPrice: item.sellingPrice,
            imageUrl: item.generalImageUrls ? item.generalImageUrls[0] : '',
            quantity: 1,
        };
        await addToCart(cartData)
        toast("Product added to cart successfully")
    }

    const defaultIconClassName = size === "icon" && variant === "ghost" && !showText
        ? "rounded-full bg-white/80 transition-all duration-300 ease-in-out hover:bg-white hover:scale-110 active:scale-95"
        : "";

    const iconClassName = size === "icon" && variant === "ghost" && !showText
        ? "text-gray-500 transition-colors duration-300 ease-in-out group-hover:text-gray-800"
        : "";

    const buttonContent = (
        <Button
            variant={variant}
            size={size}
            onClick={handleAddToCart}
            className={`${defaultIconClassName} ${className}`}
        >
            <ShoppingCart className={`${iconSize} ${iconClassName} ${showText ? 'mr-2' : ''}`} />
            {showText && text}
        </Button>
    );

    if (!showTooltip || showText) {
        return buttonContent;
    }

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {buttonContent}
                </TooltipTrigger>
                <TooltipContent className="dark px-2 py-1 text-xs" showArrow={true}>
                    {tooltipText}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}