import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { getVirtualProductById } from '@/lib/actions/virtual-products-actions';
import Image from 'next/image';
import { OrderTypes } from '@/lib/types';
import { NoItemsCard } from '@/components/no-items-card';

export const OrderItemRow = async ({ item }: { item: OrderTypes }) => {
    const productRes = await getVirtualProductById(item.productId);
    const product = productRes.data
    if(!product) return <NoItemsCard />

    return (
        <TableRow>
            <TableCell>
                <div className="relative h-16 w-16">
                    {product?.generalImageUrls && (
                        <Image
                            src={product.generalImageUrls[0]}
                            alt={product.title}
                            fill
                            className="object-contain rounded-lg"
                        />
                    )}
                </div>
            </TableCell>
            <TableCell className="font-medium">
                {product.title}
            </TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell className="text-right">
                ${(item.price * item.quantity).toFixed(2)}
            </TableCell>
        </TableRow>
    );
}