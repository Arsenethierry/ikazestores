"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "@/lib/constants";
import { OrderWithRelations } from "@/lib/models/OrderModel";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    Calendar,
    CreditCard,
    DollarSign,
    Info,
    Mail,
    MapPin,
    Package,
    Phone,
    Truck,
    User,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { OrderActionsMenu } from "./order-actions-menu";
import { getOrderByIdAction } from "@/lib/actions/product-order-actions";

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
            const result = await getOrderByIdAction({ orderId });
            if (result?.data?.success && result.data.data) {
                setOrder(result.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch order details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case OrderStatus.PENDING:
                return <Clock className="h-4 w-4" />;
            case OrderStatus.PROCESSING:
            case PhysicalStoreFulfillmentOrderStatus.PROCESSING:
                return <AlertCircle className="h-4 w-4" />;
            case OrderStatus.SHIPPED:
                return <Truck className="h-4 w-4" />;
            case OrderStatus.DELIVERED:
            case PhysicalStoreFulfillmentOrderStatus.COMPLETED:
                return <CheckCircle className="h-4 w-4" />;
            case OrderStatus.CANCELLED:
            case PhysicalStoreFulfillmentOrderStatus.CANCELLED:
                return <XCircle className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case OrderStatus.PENDING:
                return "bg-yellow-500";
            case OrderStatus.PROCESSING:
                return "bg-blue-500";
            case OrderStatus.SHIPPED:
                return "bg-purple-500";
            case OrderStatus.DELIVERED:
                return "bg-green-500";
            case OrderStatus.CANCELLED:
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getPaymentStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            paid: "default",
            pending: "secondary",
            failed: "destructive",
            refunded: "outline"
        };
        return (
            <Badge variant={variants[status] || "secondary"} className="capitalize">
                {status}
            </Badge>
        );
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">
                                Order #{order?.orderNumber || orderId}
                            </DialogTitle>
                            <DialogDescription>
                                Complete information about the order
                            </DialogDescription>
                        </div>
                        {order && (
                            <OrderActionsMenu
                                order={order}
                                permissions={permissions}
                                onOrderUpdate={() => {
                                    fetchOrderDetails();
                                    onOrderUpdate();
                                }}
                                onViewDetails={() => { }}
                            />
                        )}
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : order ? (
                    <Tabs defaultValue="overview" className="mt-4">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="items">Items</TabsTrigger>
                            <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            Order Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Status</span>
                                            <Badge className={cn("capitalize", getStatusColor(order.orderStatus))}>
                                                {order.orderStatus}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Order Date</span>
                                            <span className="text-sm font-medium">
                                                {format(new Date(order.orderDate), 'PPP')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Items</span>
                                            <span className="text-sm font-medium">{order.itemCount}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Customer Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {order.customerEmail && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{order.customerEmail}</span>
                                            </div>
                                        )}
                                        {order.customerPhone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{order.customerPhone}</span>
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                            ID: {order.customerId}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Payment Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Method</span>
                                            <span className="text-sm font-medium capitalize">
                                                {order.paymentMethod}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Status</span>
                                            {getPaymentStatusBadge(order.paymentStatus)}
                                        </div>
                                        <Separator />
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span>{order.subtotal.toFixed(2)} {order.currency}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Shipping</span>
                                                <span>{order.shippingCost.toFixed(2)} {order.currency}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Tax</span>
                                                <span>{order.taxAmount.toFixed(2)} {order.currency}</span>
                                            </div>
                                            {order.discountAmount > 0 && (
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span>Discount</span>
                                                    <span>-{order.discountAmount.toFixed(2)} {order.currency}</span>
                                                </div>
                                            )}
                                            <Separator />
                                            <div className="flex justify-between font-semibold">
                                                <span>Total</span>
                                                <span>{order.totalAmount.toFixed(2)} {order.currency}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Delivery Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium mb-1">Shipping Address</p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.deliveryAddress}
                                            </p>
                                        </div>
                                        {order.isExpressDelivery && (
                                            <Badge variant="outline" className="w-fit">
                                                <Truck className="h-3 w-3 mr-1" />
                                                Express Delivery
                                            </Badge>
                                        )}
                                        {order.estimatedDeliveryDate && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Est. Delivery</p>
                                                <p className="text-sm font-medium">
                                                    {format(new Date(order.estimatedDeliveryDate), 'PPP')}
                                                </p>
                                            </div>
                                        )}
                                        {order.deliveredAt && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Delivered On</p>
                                                <p className="text-sm font-medium">
                                                    {format(new Date(order.deliveredAt), 'PPP')}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {order.notes && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Order Notes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{order.notes}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="items" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Order Items ({order.items?.documents?.length || 0})</CardTitle>
                                    <CardDescription>Products included in this order</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {order.items?.documents?.map((item) => (
                                            <div key={item.$id} className="flex items-start gap-4 p-4 border rounded-lg">
                                                {item.productImage && (
                                                    <img
                                                        src={item.productImage}
                                                        alt={item.productName}
                                                        className="w-16 h-16 object-cover rounded"
                                                    />
                                                )}
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-medium">{item.productName}</p>
                                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                                        <span>SKU: {item.sku}</span>
                                                        <span>Qty: {item.quantity}</span>
                                                    </div>
                                                    {item.commission > 0 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Commission: {item.commission.toFixed(2)} {order.currency}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">
                                                        {item.subtotal.toFixed(2)} {order.currency}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.sellingPrice.toFixed(2)} each
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="fulfillment" className="space-y-4">
                            {order.fulfillmentRecords && order.fulfillmentRecords.length > 0 ? (
                                order.fulfillmentRecords.map((record) => (
                                    <Card key={record.$id}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Package className="h-4 w-4" />
                                                    Fulfillment Record
                                                </CardTitle>
                                                <Badge className={cn("capitalize",
                                                    record.physicalStoreFulfillmentOrderStatus === 'completed'
                                                        ? "bg-green-500"
                                                        : record.physicalStoreFulfillmentOrderStatus === "cancelled"
                                                            ? "bg-red-500"
                                                            : "bg-blue-500"
                                                )}>
                                                    {record.physicalStoreFulfillmentOrderStatus}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Physical Store ID</span>
                                                    <p className="font-medium">{record.physicalStoreId}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Virtual Store ID</span>
                                                    <p className="font-medium">{record.virtualStoreId}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Items</span>
                                                    <p className="font-medium">{record.itemCount}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Value</span>
                                                    <p className="font-medium">
                                                        {record.totalValue} {order.currency}
                                                    </p>
                                                </div>
                                            </div>
                                            {record.cancelledAt && (
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Cancelled At</span>
                                                    <p className="font-medium">
                                                        {format(new Date(record.cancelledAt), 'PPpp')}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="py-8">
                                        <p className="text-center text-muted-foreground">
                                            No fulfillment records available
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {order.commissionRecords && order.commissionRecords.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Commission Records
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {order.commissionRecords.map((record) => (
                                                <div key={record.$id} className="flex justify-between items-center p-3 border rounded">
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            Store: {record.physicalStoreId}
                                                        </p>
                                                        <Badge variant="outline" className="mt-1 capitalize">
                                                            {record.commissionStatus}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">
                                                            {record.totalCommission.toFixed(2)} {order.currency}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Order Value: {record.orderValue.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Status History</CardTitle>
                                    <CardDescription>Timeline of order status changes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {order.statusHistory ? (
                                        <div className="space-y-4">
                                            {JSON.parse(order.statusHistory).map((entry: any, index: number) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <div className="mt-1">
                                                        {getStatusIcon(entry.status)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="capitalize">
                                                                {entry.status}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {format(new Date(entry.timestamp), 'PPpp')}
                                                            </span>
                                                        </div>
                                                        {entry.reason && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {entry.reason}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Updated by: {entry.updatedBy}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground">
                                            No status history available
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        Failed to load order details
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}