"use client";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { useAction } from "next-safe-action/hooks";
import { deleteCollection } from "../actions/collections-actions";
import { toast } from "sonner";
import { CollectionTypes } from "@/lib/types";
import { Loader, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export const DeleteCollectionButton = ({
    collection,
    storeId
}: {
    collection: CollectionTypes;
    storeId: string;
}) => {
    const router = useRouter();

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Collection",
        "All groups under this collection will be deleted",
        "destructive"
    );

    const {
        execute,
        isPending
    } = useAction(deleteCollection, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success);
                router.push(`/admin/stores/${storeId}/collections`)
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const handleDeleteCollection = async () => {
        const ok = await confirmDelete();
        if (!ok) return;
        execute({
            bannerImageId: collection?.bannerImageId,
            collectionId: collection.$id
        })
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