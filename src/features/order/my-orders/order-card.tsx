"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OrderStatus } from "@/lib/constants";
import { OrderWithRelations } from "@/lib/models/OrderModel";
import { format } from "date-fns";
import { ChevronRight, Clock, Package, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface OrderCardProps {
    order: OrderWithRelations;
}

export function OrderCard({ order }: OrderCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.PENDING: return 'secondary';
            case OrderStatus.PROCESSING: return 'default';
            case OrderStatus.SHIPPED: return 'outline';
            case OrderStatus.DELIVERED: return 'default';
            case OrderStatus.CANCELLED: return 'destructive';
            default: return 'secondary';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case OrderStatus.PENDING: return <Clock className="h-4 w-4" />;
            case OrderStatus.PROCESSING: return <Package className="h-4 w-4" />;
            case OrderStatus.SHIPPED: return <Truck className="h-4 w-4" />;
            case OrderStatus.DELIVERED: return <Package className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Order #{order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Placed on {format(new Date(order.orderDate), 'PPP')}
                        </p>
                    </div>
                    <Badge variant={getStatusColor(order.orderStatus)}>
                        <span className="flex items-center gap-1">
                            {getStatusIcon(order.orderStatus)}
                            {order.orderStatus}
                        </span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {order.items?.documents?.slice(0, 2).map((item) => (
                        <div key={item.$id} className="flex items-center gap-3">
                            {item.productImage && (
                                <Image
                                    src={item.productImage}
                                    alt={item.productName}
                                    width={50}
                                    height={50}
                                    className="rounded-md object-cover"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {item.productName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity} x {item.sellingPrice} RWF
                                </p>
                            </div>
                        </div>
                    ))}
                    {order.items && order.items.total > 2 && (
                        <p className="text-xs text-muted-foreground">
                            +{order.items.total - 2} more items
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                        <p className="text-sm font-medium">Total</p>
                        <p className="text-lg font-bold">
                            {order.customerTotalAmount} {order.customerCurrency}
                        </p>
                    </div>
                    <Link href={`/my-orders/${order.$id}`}>
                        <Button variant="outline" size="sm">
                            View Details
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {order.estimatedDeliveryDate && order.orderStatus !== 'delivered' && (
                    <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">
                            Estimated Delivery
                        </p>
                        <p className="text-sm font-medium">
                            {format(new Date(order.estimatedDeliveryDate), 'PPP')}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
