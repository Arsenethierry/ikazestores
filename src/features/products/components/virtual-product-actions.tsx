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
import { VirtualProductTypes } from "@/lib/types";
import { removeProductAction } from "@/lib/actions/affiliate-product-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { startTransition, useCallback } from "react";

export const VirtualProductMenuActions = ({ product }: { product: VirtualProductTypes }) => {
    const { data: user } = useCurrentUser();
    const router = useRouter();

    const [RemoveProductDialog, confirmRemoveProduct] = useConfirm(
        "Are you sure you want to remove this product from your store?",
        "This action can not be reverted",
        "destructive"
    );

    const removeImport = useAction(removeProductAction, {
        onSuccess: (res) => {
            if (res?.data?.error) {
                toast.error(res?.data?.error);
                return;
            }
            toast.success("Product removed");
            router.refresh();
        },
        onError: () => toast.error("Removal failed"),
    });

    const isMutating = removeImport.status === "executing";

    const handleRemoveProduct = useCallback(async () => {
        const ok = await confirmRemoveProduct();
        if (!ok) return;

        startTransition(() => {
            removeImport.execute({ importId: product.$id, virtualStoreId: product.virtualStoreId });
        });
    }, [product.$id, product.name, removeImport]);

    const canDelete = user && (user.$id === product?.createdBy || user?.$id === product?.store?.owner);

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
                        {canDelete && (
                            <DropdownMenuItem
                                onClick={handleRemoveProduct}
                                disabled={isMutating}
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