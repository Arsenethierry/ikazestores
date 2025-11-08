"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";
import { cancelOrderAction } from "@/lib/actions/product-order-actions";
import { Download, Eye, MoreHorizontal, Truck, X, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OrderActionsMenuProps {
    canCancel: boolean;
    canTrack: boolean;
    orderId: string;
    orderNumber: string;
}

export const OrderActionsMenu = ({
    canCancel,
    canTrack,
    orderId,
    orderNumber,
}: OrderActionsMenuProps) => {
    const router = useRouter();
    
    const [ConfirmDialog, confirm] = useConfirm(
        "Cancel Order",
        `Are you sure you want to cancel order #${orderNumber}? This action cannot be undone and any payment will be refunded within 3-5 business days.`,
        "destructive"
    );

    const { execute: executeCancel, isExecuting: isCancelling, result } = useAction(cancelOrderAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                console.log("ffff: ", data)
                toast.success('Order cancelled successfully');
                router.refresh();
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to cancel order');
        },
    });

    const handleCancelOrder = async () => {
        const confirmed = await confirm();
        if (confirmed) {
            executeCancel({ 
                orderId,
                reason: "Cancelled by customer"
            });
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isCancelling}>
                        {isCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/orders/${orderId}`} className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                        <Link href={`/orders/${orderId}/invoice`} className="flex items-center">
                            <Download className="mr-2 h-4 w-4" />
                            Download Invoice
                        </Link>
                    </DropdownMenuItem>

                    {canTrack && (
                        <DropdownMenuItem asChild>
                            <Link href={`/orders/${orderId}/tracking`} className="flex items-center">
                                <Truck className="mr-2 h-4 w-4" />
                                Track Package
                            </Link>
                        </DropdownMenuItem>
                    )}

                    {canCancel && (
                        <DropdownMenuItem 
                            onSelect={(e) => {
                                e.preventDefault();
                                handleCancelOrder();
                            }}
                            disabled={isCancelling}
                            className="text-red-600 focus:text-red-600"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel Order
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            
            <ConfirmDialog />
        </>
    );
};