"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { addToCart } from "../cart.actions";
import { DocumentType } from "@/lib/types";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const AddToCartButton = ({ item }: { item: DocumentType }) => {
    const router = useRouter();

    const { isPending, execute } = useAction(addToCart, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success("Product added successfully")
                router.push("/cart");
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const handleAddToCart = async () => {
        const cartData = {
            $id: item.$id,
            title: item.title,
            sellingPrice: item.sellingPrice,
            imageUrl: item.imageUrls[0],
            quantity: 1,
        };
        await execute(cartData)
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