"use client";

import { Button } from "@/components/ui/button";
import { useDeleteCollection } from "@/hooks/queries-and-mutations/use-products-collections";
import { useConfirm } from "@/hooks/use-confirm";
import { CollectionTypes } from "@/lib/types";
import { Loader, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export const DeleteCollectionButton = ({
    collection,
    storeId,
    isSystemAdmin = false
}: {
    collection: CollectionTypes;
    storeId: string | null;
    isSystemAdmin?: boolean
}) => {
    const router = useRouter();

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Collection",
        "All groups under this collection will be deleted",
        "destructive"
    );

    const { mutate: deleteCollection, isPending } = useDeleteCollection();

    const handleDeleteCollection = async () => {
        const ok = await confirmDelete();
        if (!ok) return;
        
        deleteCollection(collection.$id, {
            onSuccess: () => {
                if (isSystemAdmin) {
                    router.push(`/admin/collections`)
                } else {
                    router.push(`/admin/stores/${storeId}/collections`)
                }
            }
        });
    }

    return (
        <>
            <DeleteDialog />
            <Button
                variant={'destructive'}
                size={'sm'}
                disabled={isPending}
                onClick={handleDeleteCollection}
                className='flex justify-evenly'
            >
                {isPending ? (
                    <>
                        <Loader size={20} className="animate-spin" /> deleting...
                    </>
                ) : <>
                    <Trash2 />
                    Delete
                </>}
            </Button>
        </>
    )
}