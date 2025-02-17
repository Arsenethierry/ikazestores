"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";
import { Bolt, Ellipsis, Trash } from "lucide-react";
import { useDeleteVirtualStore } from "../mutations/use-virtual-store-mutations";
import { useDeletePhysicalStore } from "../mutations/use-physical-store-mutations";
import { StoreTypes } from "@/lib/types";

export const StoreQuickActions = ({ store }: StoreTypes) => {
    const { mutate: deleteVirtualStore } = useDeleteVirtualStore();
    const { mutate: deletePhysicalStore } = useDeletePhysicalStore();

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Store",
        "This action can not be undone",
        "destructive"
    );


    const handleDeleteStore = async () => {
        const ok = await confirmDelete();

        if (!ok) return;
        if(store.storeType === 'virtualStore') {
            deleteVirtualStore([store.$id, store.bannerIds])
        } else if(store.storeType === 'physicalStore') {
            deletePhysicalStore([store.$id, store.bannerIds])
        }
    }

    return (
        <DropdownMenu>
            <DeleteDialog />
            <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full shadow-none"
                    aria-label="Open edit menu"
                >
                    <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <Bolt size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleDeleteStore}
                        className="text-destructive focus:text-destructive cursor-pointer"
                    >
                        <Trash size={16} strokeWidth={2} aria-hidden="true" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
