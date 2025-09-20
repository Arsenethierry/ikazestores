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
    const [cancellationReason, setCancellationReason] = useState("");

    const handleStatusUpdate = async (status: OrderStatus) => {
        startTransition(async () => {
            try {
                const result = await updateOrderStatusAction({
                    orderId: order.$id,
                    status,
                    ...(status === OrderStatus.CANCELLED && {
                        cancellationReason: cancellationReason || 'Cancelled by admin'
                    })
                });

                if (result?.data?.success) {
                    toast.success(result.data.message || 'Order status updated successfully');
                    onOrderUpdate();
                } else if (result?.data?.error) {
                    toast.error(result.data.error);
                }
            } catch (error) {
                toast.error('Failed to update order status');
                console.error('Error updating order status:', error);
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
                    fulfillmentId: order.fulfillmentRecords![0].$id,
                    status: status as "pending" | "processing" | "ready" | "completed" | "cancelled"
                });

                if (result?.data?.success) {
                    toast.success(result.data.message || 'Fulfillment status updated successfully');
                    onOrderUpdate();
                } else if (result?.data?.error) {
                    toast.error(result.data.error);
                }
            } catch (error) {
                toast.error('Failed to update fulfillment status');
                console.error('Error updating fulfillment status:', error);
            }
        });
    };

    const handleCancelOrder = async () => {
        startTransition(async () => {
            try {
                const result = await cancelOrderAction({
                    orderId: order.$id,
                    reason: cancellationReason || 'Cancelled by admin'
                });

                if (result?.data?.success) {
                    toast.success(result.data.message || 'Order cancelled successfully');
                    onOrderUpdate();
                } else if (result?.data?.error) {
                    toast.error(result.data.error);
                }
            } catch (error) {
                toast.error('Failed to cancel order');
                console.error('Error cancelling order:', error);
            } finally {
                setShowCancelDialog(false);
                setCancellationReason("");
            }
        });
    };

    const canCancelOrder = permissions.canCancel &&
        [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(order.orderStatus as OrderStatus);

    const getNextFulfillmentStatus = (currentStatus: string): PhysicalStoreFulfillmentOrderStatus | null => {
        switch (currentStatus) {
            case PhysicalStoreFulfillmentOrderStatus.PENDING:
                return PhysicalStoreFulfillmentOrderStatus.PROCESSING;
            case PhysicalStoreFulfillmentOrderStatus.PROCESSING:
                return PhysicalStoreFulfillmentOrderStatus.COMPLETED;
            default:
                return null;
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
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
                            {(() => {
                                const currentStatus = order.fulfillmentRecords[0].physicalStoreFulfillmentOrderStatus;
                                const nextStatus = getNextFulfillmentStatus(currentStatus);

                                if (nextStatus && currentStatus !== 'completed' &&
                                    currentStatus !== 'cancelled') {
                                    return (
                                        <DropdownMenuItem
                                            onClick={() => handleFulfillmentUpdate(nextStatus)}
                                            disabled={isPending}
                                        >
                                            {nextStatus === PhysicalStoreFulfillmentOrderStatus.PROCESSING && "Start Processing"}
                                            {nextStatus === PhysicalStoreFulfillmentOrderStatus.COMPLETED && "Mark as Completed"}
                                        </DropdownMenuItem>
                                    );
                                }
                                return null;
                            })()}

                            {order.fulfillmentRecords[0].physicalStoreFulfillmentOrderStatus !== 'cancelled' &&
                                order.fulfillmentRecords[0].physicalStoreFulfillmentOrderStatus !== 'completed' && (
                                    <DropdownMenuItem
                                        onClick={() => handleFulfillmentUpdate(PhysicalStoreFulfillmentOrderStatus.CANCELLED)}
                                        disabled={isPending}
                                        className="text-destructive"
                                    >
                                        Cancel Fulfillment
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
                    <div className="my-4">
                        <label htmlFor="cancellation-reason" className="text-sm font-medium">
                            Cancellation Reason (optional)
                        </label>
                        <textarea
                            id="cancellation-reason"
                            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Enter reason for cancellation..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCancellationReason("")}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelOrder}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Yes, Cancel Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}