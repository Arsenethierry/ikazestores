"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cancelOrderAction, updateFulfillmentStatusAction, updateOrderStatusAction } from "@/lib/actions/product-order-actions";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "@/lib/constants";
import { OrderWithRelations } from "@/lib/models/OrderModel";
import { CheckCircle, Eye, MoreHorizontal, Package, Truck, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface OrderActionsMenuProps {
    order: OrderWithRelations;
    permissions: {
        canUpdateStatus: boolean;
        canUpdateFulfillment: boolean;
        canCancel: boolean;
        canBulkUpdate: boolean;
        canViewAll: boolean;
    };
    onOrderUpdate: () => void;
    onViewDetails: () => void;
}

export function OrderActionsMenu({
    order,
    permissions,
    onOrderUpdate,
    onViewDetails
}: OrderActionsMenuProps) {
    const [isPending, startTransition] = useTransition();
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const handleStatusUpdate = async (status: OrderStatus) => {
        startTransition(async () => {
            try {
                const result = await updateOrderStatusAction({
                    orderId: order.$id,
                    status,
                    notes: `Status updated to ${status}`
                });

                if (result?.data?.success) {
                    toast.success('Order status updated successfully');
                    onOrderUpdate();
                } else {
                    toast.error(result?.data?.error || 'Failed to update order status');
                }
            } catch (error) {
                toast.error('Failed to update order status');
            }
        });
    };

    const handleFulfillmentUpdate = async (status: PhysicalStoreFulfillmentOrderStatus) => {
        if (!order.fulfillmentRecords?.[0]) {
            toast.error('No fulfillment record found');
            return;
        }

        startTransition(async () => {
            try {
                const result = await updateFulfillmentStatusAction({
                    fulfillmentRecordId: order.fulfillmentRecords![0].$id,
                    status,
                    notes: `Fulfillment status updated to ${status}`
                });

                if (result?.data?.success) {
                    toast.success('Fulfillment status updated successfully');
                    onOrderUpdate();
                } else {
                    toast.error(result?.data?.error || 'Failed to update fulfillment status');
                }
            } catch (error) {
                toast.error('Failed to update fulfillment status');
            }
        });
    };

    const handleCancelOrder = async () => {
        startTransition(async () => {
            try {
                const result = await cancelOrderAction({
                    orderId: order.$id,
                    reason: 'Cancelled by admin'
                });

                if (result?.data?.success) {
                    toast.success('Order cancelled successfully');
                    onOrderUpdate();
                } else {
                    toast.error(result?.data?.error || 'Failed to cancel order');
                }
            } catch (error) {
                toast.error('Failed to cancel order');
            } finally {
                setShowCancelDialog(false);
            }
        });
    };

    const canCancelOrder = permissions.canCancel &&
        [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(order.orderStatus as OrderStatus);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={onViewDetails}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>

                    {permissions.canUpdateStatus && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            {order.orderStatus === OrderStatus.PENDING && (
                                <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(OrderStatus.PROCESSING)}
                                    disabled={isPending}
                                >
                                    <Package className="mr-2 h-4 w-4" />
                                    Mark as Processing
                                </DropdownMenuItem>
                            )}
                            {order.orderStatus === OrderStatus.PROCESSING && (
                                <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(OrderStatus.SHIPPED)}
                                    disabled={isPending}
                                >
                                    <Truck className="mr-2 h-4 w-4" />
                                    Mark as Shipped
                                </DropdownMenuItem>
                            )}
                            {order.orderStatus === OrderStatus.SHIPPED && (
                                <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(OrderStatus.DELIVERED)}
                                    disabled={isPending}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Delivered
                                </DropdownMenuItem>
                            )}
                        </>
                    )}

                    {permissions.canUpdateFulfillment && order.fulfillmentRecords?.[0] && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Update Fulfillment</DropdownMenuLabel>
                            {order.fulfillmentRecords[0].physicalStoreFulfillmentOrderStatus === "pending_fulfillment" && (
                                <DropdownMenuItem
                                    onClick={() => handleFulfillmentUpdate(PhysicalStoreFulfillmentOrderStatus.PROCESSING)}
                                    disabled={isPending}
                                >
                                    Start Processing
                                </DropdownMenuItem>
                            )}
                            {order.fulfillmentRecords[0].physicalStoreFulfillmentOrderStatus === "processing" && (
                                <DropdownMenuItem
                                    onClick={() => handleFulfillmentUpdate(PhysicalStoreFulfillmentOrderStatus.SHIPPED)}
                                    disabled={isPending}
                                >
                                    Mark as Shipped
                                </DropdownMenuItem>
                            )}
                        </>
                    )}

                    {canCancelOrder && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setShowCancelDialog(true)}
                                disabled={isPending}
                                className="text-destructive"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Order
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel order #{order.orderNumber}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelOrder}
                            disabled={isPending}
                        >
                            Yes, Cancel Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}