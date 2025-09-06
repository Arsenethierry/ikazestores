import { NoItemsCard } from '@/components/no-items-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OrderItemRow from '@/features/order/my-orders/order-item-row';
import { getOrderById, getOrdersByCustomerAction } from '@/lib/actions/product-order-actions';
import { getAuthState } from '@/lib/user-permission';
import { dateFormatter } from '@/lib/utils';
import { CircleAlert } from 'lucide-react';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';
import { OrderActionsMenu } from './OrderActionsMenu';

async function page() {
    const { user } = await getAuthState();

    if (!user) redirect("/sign-in");
    const myOrders = await getOrdersByCustomerAction({customerId: user.$id});

    if (myOrders?.data?.success && myOrders.data.data.total === 0 || !myOrders?.data?.data) {
        return <NoItemsCard />
    }

    return (
        <div className='main-container mx-auto max-w-5xl p-6'>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Your Orders</h1>
                <div className="text-sm text-gray-500">
                    {myOrders.data.data.total} {myOrders.data.data.total=== 1 ? 'order' : 'orders'}
                </div>
            </div>

            <div className="space-y-6">
                {myOrders.data.data.orders.map(order => {
                    if(!order) return <NoItemsCard />

                    const canCancel = order.status === 'pending' || order.status === 'processing';
                    const canTrack = order.status === 'shipped' || order.status === 'delivered';

                    return (
                        <Card key={order.$id}>
                            <CardHeader className="border-b">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">
                                            Order #{order.orderNumber || order.$id.slice(-8).toUpperCase()}
                                        </CardTitle>
                                        {order?.orderDate && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Placed on {dateFormatter(new Date(order.orderDate))}
                                            </p>
                                        )}
                                        {order?.estimatedDeliveryDate && (
                                            <p className="text-sm text-gray-500">
                                                Estimated delivery: {dateFormatter(new Date(order.estimatedDeliveryDate))}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className='capitalize'
                                            variant={getStatusVariant(order.status)}
                                        >
                                            {order.status}
                                        </Badge>
                                        <OrderActionsMenu
                                            orderId={order.$id}
                                            canCancel={canCancel}
                                            canTrack={canTrack}
                                            orderNumber={order.orderNumber || order.$id.slice(-8).toUpperCase()}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Product</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <Suspense fallback={<TableSkeletonLoader rows={2} />}>
                                            <OrderItemsComponent orderId={order.$id} />
                                        </Suspense>
                                    </TableBody>
                                </Table>

                                <div className="p-4 border-t bg-gray-50/30">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            {order.itemCount || 1} {order.itemCount === 1 ? 'item' : 'items'}
                                        </span>
                                        <div className="text-right">
                                            <div className="text-lg font-semibold">
                                                {order.customerCurrency} {order.customerTotalAmount?.toFixed(2) || '0.00'}
                                            </div>
                                            {order.isExpressDelivery && (
                                                <Badge variant="outline" className="text-xs">
                                                    Express Delivery
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}

export default page;

const OrderItemsComponent = async ({ orderId }: { orderId: string }) => {
    const orderItems = await getOrderById(orderId);

    if (!orderItems || orderItems.error || !orderItems.data?.items || !orderItems.data) {
        return (
            <div className="rounded-lg border border-red-500/50 px-4 py-3 text-red-600">
                <p className="text-sm">
                    <CircleAlert
                        className="-mt-0.5 me-3 inline-flex opacity-60"
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                    />
                    {orderItems.error || "something went wrong..."}
                </p>
            </div>
        )
    }

    return orderItems.data.items.map((item) => <OrderItemRow item={item} orderCurrency={orderItems.data.customerCurrency} />)
}

const TableSkeletonLoader = ({ rows = 3 }: { rows?: number }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <OrderItemRowSkeleton key={index} />
            ))}
        </>
    );
};

const OrderItemRowSkeleton = () => {
    return (
        <TableRow className='hover:bg-gray-50/50'>
            <TableCell>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                    </div>

                    <div className="flex flex-col space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />

                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <Skeleton className="h-4 w-24" />
            </TableCell>

            <TableCell>
                <Skeleton className="h-4 w-8" />
            </TableCell>

            <TableCell className="text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
            </TableCell>
        </TableRow>
    );
};

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'outline';
        case 'processing':
            return 'secondary';
        case 'shipped':
            return 'default';
        case 'delivered':
            return 'default';
        case 'cancelled':
            return 'destructive';
        default:
            return 'secondary';
    }
}