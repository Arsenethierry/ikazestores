"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/features/auth/queries/use-get-current-user";
import { MoreHorizontal, TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { removeProduct } from "../actions/virtual-products-actions";
import { VirtualProductTypes } from "@/lib/types";

export const VirtualProductMenuActions = ({ product, storeId }: { product: VirtualProductTypes, storeId: string }) => {
    const { data: user } = useCurrentUser();

    const [RemoveProductDialog, confirmRemoveProduct] = useConfirm(
        "Are you sure you want to remove this product from your store?",
        "This action can not be reverted",
        "destructive"
    );

    const { executeAsync, isPending } = useAction(removeProduct, {
        onSuccess: () => {
            toast.success("Product deleted successfully")
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const handleRemoveProduct = async () => {
        const ok = await confirmRemoveProduct();
        if (!ok) return;
        await executeAsync({ productId: product.$id, virtualStoreId: storeId })
    }

    const carnDelete = user && (user.$id === product?.createdBy || user?.$id === product?.store?.owner);

    return (
        <>
            <RemoveProductDialog />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/80 hover:bg-white"
                    >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuGroup>
                        <DropdownMenuItem>Share</DropdownMenuItem>
                        <DropdownMenuItem>Add to favorites</DropdownMenuItem>
                        {carnDelete && (
                            <DropdownMenuItem
                                onClick={handleRemoveProduct}
                                disabled={isPending}
                                className={`${buttonVariants({ variant: "destructive", size: 'sm' })} w-full cursor-pointer`}
                            >
                                <TrashIcon size={16} aria-hidden="true" />
                                Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
