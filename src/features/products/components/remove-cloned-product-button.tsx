"use client";

import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import React from 'react';
import { removeProduct } from '../actions/virtual-products-actions';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useCurrentStoreId } from '@/hooks/use-workspace-id';

export const RemoveClonedProductButton = ({ productId }: { productId: string }) => {
    const storeId = useCurrentStoreId();

    const [RemoveProductDialog, confirmRemoveProduct] = useConfirm(
        "Are you sure you want to remove this product from your store?",
        "This action can not be undone",
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
        await executeAsync({ productId, virtualStoreId: storeId })
    }
    
    return (
        <>
            <RemoveProductDialog />
            <Button
                variant="destructive"
                size={'sm'}
                onClick={handleRemoveProduct}
                disabled={isPending}
            >
                Remove
            </Button>
        </>
    );
}