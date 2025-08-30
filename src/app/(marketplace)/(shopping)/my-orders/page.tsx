import { NoItemsCard } from '@/components/no-items-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OrderItemRow from '@/features/order/my-orders/order-item-row';
import { getLogedInUserOrders, getOrderById } from '@/lib/actions/product-order-actions';
import { getAuthState } from '@/lib/user-permission';
import { dateFormatter } from '@/lib/utils';
import { CircleAlert } from 'lucide-react';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

async function page() {
    const { user } = await getAuthState();

    if (!user) redirect("/sign-in");
    const myOrders = await getLogedInUserOrders();

    if (myOrders.success && myOrders.data.total === 0 || !myOrders.data) {
        return <NoItemsCard />
    }

    return (
        <div className='main-container mx-auto max-w-5xl p-6'>
            <h1 className="text-2xl font-bold mb-8">Your Orders</h1>

            <div className="space-y-6">
                {myOrders.data.documents.map(order => (
                    <Card key={order.$id}>
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg w-full flex justify-between">
                                <span>Order #{order.$id.toUpperCase()}</span>
                                <Badge className='capitalize' variant={'secondary'}>{order.status}</Badge>
                            </CardTitle>
                            {order?.orderDate ?
                                <p className="text-sm text-gray-500">
                                    {dateFormatter(new Date(order.orderDate))}
                                </p> : null}
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
                        </CardContent>
                    </Card>
                ))}
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

    return orderItems.data.items.map((item) => (
        <>
            <OrderItemRow item={item} />
        </>
    ))
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
                    {/* Product Image Skeleton */}
                    <div className="relative">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                    </div>

                    {/* Product Info Skeleton */}
                    <div className="flex flex-col space-y-2 flex-1">
                        {/* Product Name Skeleton */}
                        <Skeleton className="h-4 w-32" />

                        {/* SKU Badge Skeleton */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <Skeleton className="h-4 w-24" />
            </TableCell>

            {/* Quantity Column Skeleton */}
            <TableCell>
                <Skeleton className="h-4 w-8" />
            </TableCell>

            {/* Price Column Skeleton */}
            <TableCell className="text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
            </TableCell>
        </TableRow>
    );
};
