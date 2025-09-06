"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrderById } from "@/lib/actions/product-order-actions";
import { OrderWithRelations } from "@/lib/models/OrderModel";
import { format } from "date-fns";
import { useEffect, useState } from "react";

interface OrderDetailsDialogProps {
    orderId: string;
    isOpen: boolean;
    onClose: () => void;
    permissions: {
        canUpdateStatus: boolean;
        canUpdateFulfillment: boolean;
        canCancel: boolean;
        canBulkUpdate: boolean;
        canViewAll: boolean;
    };
    onOrderUpdate: () => void;
}

export function OrderDetailsDialog({
    orderId,
    isOpen,
    onClose,
    permissions,
    onOrderUpdate
}: OrderDetailsDialogProps) {
    const [order, setOrder] = useState<OrderWithRelations | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails();
        }
    }, [isOpen, orderId]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const result = await getOrderById(orderId);
            if (result?.success && result.data) {
                setOrder(result.data as OrderWithRelations);
            }
        } catch (error) {
            console.error('Failed to fetch order details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogDescription>
                        Complete information about the order
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : order ? (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Order Number:</span>
                                    <p className="font-medium">#{order.orderNumber}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge className="ml-2 capitalize">{order.orderStatus}</Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Order Date:</span>
                                    <p className="font-medium">{format(new Date(order.$createdAt), 'PPP')}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Total Amount:</span>
                                    <p className="font-medium">
                                        {order.customerTotalAmount.toFixed(2)} {order.customerCurrency}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <p className="font-medium">{order.customerEmail || 'Guest'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Customer ID:</span>
                                    <p className="font-medium">{order.customerId}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                            <div className="space-y-2">
                                {order.items?.map((item) => (
                                    <div key={item.$id} className="flex justify-between items-center p-3 border rounded">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                SKU: {item.sku} | Qty: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                {item.subtotal.toFixed(2)} {order.customerCurrency}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.sellingPrice.toFixed(2)} each
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-lg font-semibold mb-3">Shipping Information</h3>
                            <div className="text-sm">
                                <p className="text-muted-foreground mb-1">Shipping Address:</p>
                                <p className="font-medium">{order.shippingAddress}</p>
                                {order.estimatedDeliveryDate && (
                                    <p className="mt-2 text-muted-foreground">
                                        Estimated Delivery: {format(new Date(order.estimatedDeliveryDate), 'PPP')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {order.notes && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Notes</h3>
                                    <p className="text-sm">{order.notes}</p>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">Failed to load order details</p>
                )}
            </DialogContent>
        </Dialog>
    )
}