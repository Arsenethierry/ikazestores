import { NoItemsCard } from '@/components/no-items-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllCustomerOrders } from '@/features/order/actions/order-actions';
import { OrderItemRow } from '@/features/order/my-orders/order-item-row';
import { OrderTypes } from '@/lib/types';
import { getAuthState } from '@/lib/user-permission';
import { dateFormatter } from '@/lib/utils';
import { redirect } from 'next/navigation';
import React from 'react';

async function page() {
    const { user } = await getAuthState();
    // if (!user) {
    //     return <AccessDeniedCard />
    // }
    if (!user) redirect("/sign-in");
    const myOrders = await getAllCustomerOrders(user.$id);

    if (myOrders.total === 0) {
        return <NoItemsCard />
    }

    return (
        <div className='main-container mx-auto max-w-5xl p-6'>
            <h1 className="text-2xl font-bold mb-8">Your Orders</h1>

            <div className="space-y-6">
                {myOrders.documents.map(order => (
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
                                    {order.orderItems.map((item: OrderTypes) => (
                                        <OrderItemRow
                                            item={item}
                                            key={item.$id}
                                        />
                                    ))}
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