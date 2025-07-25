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
import { useConfirm } from "@/hooks/use-confirm";
import { OriginalProductTypes } from "@/lib/types";
import { useDeleteOriginalProducts } from "@/hooks/queries-and-mutations/use-original-products-queries";

export const PhysicalProductMenuActions = ({ product }: { product: OriginalProductTypes }) => {
    const { data: user } = useCurrentUser();

    const [DeleteProductDialog, confirmDeleteProduct] = useConfirm(
        "Are you sure you want to delete this product?",
        "All Related virtual products will be archived",
        "destructive"
    );

    const canDelete = user && (user.$id === product?.createdBy || user?.$id === product?.store?.owner);

    const { mutate: deleteProduct, isPending } = useDeleteOriginalProducts();

    const handleDeleteProduct = async () => {
        const ok = await confirmDeleteProduct();
        if (!ok) return;
        
        deleteProduct(product.$id);
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
                        {canDelete && (
                            <DropdownMenuItem
                                onClick={handleDeleteProduct}
                                disabled={isPending} // Disable while deletion is in progress
                                className={`${buttonVariants({ variant: "destructive", size: 'sm' })} w-full cursor-pointer disabled:opacity-50`}
                            >
                                <TrashIcon size={16} aria-hidden="true" />
                                {isPending ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}