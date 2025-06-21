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
// import { useAction } from "next-safe-action/hooks";
// import { deleteOriginalProduct } from "../actions/original-products-actions";
// import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { OriginalProductTypes } from "@/lib/types";

export const PhysicalProductMenuActions = ({ product }: { product: OriginalProductTypes }) => {
    const { data: user } = useCurrentUser();

    const [DeleteProductDialog, confirmDeleteProduct] = useConfirm(
        "Are you sure you want to delete this product?",
        "All Related virtual products will be archived",
        "destructive"
    );

    const carnDelete = user && (user.$id === product?.createdBy || user?.$id === product?.store?.owner);

    // const { executeAsync } = useAction(deleteOriginalProduct, {
    //     onSuccess: () => {
    //         toast.success("Product deleted successfully")
    //     },
    //     onError: ({ error }) => {
    //         toast.error(error.serverError)
    //     }
    // })

    const handleDeleteProduct = async () => {
        const ok = await confirmDeleteProduct();
        if (!ok) return;
        // executeAsync({ productId: product.$id })
    }

    return (
        <>
            <DeleteProductDialog />
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
                                onClick={handleDeleteProduct}
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
