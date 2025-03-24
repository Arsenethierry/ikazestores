import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { DocumentType } from '@/lib/types';
import { getVirtualProductById } from '@/features/products/actions/virtual-products-actions';
import Image from 'next/image';

export const OrderItemRow = async ({ item }: { item: DocumentType }) => {
    const product = await getVirtualProductById(item.productId);
    console.log(product);
    return (
        <TableRow>
            <TableCell>
                <div className="relative h-16 w-16">
                    <Image
                        src={product.imageUrls[0]}
                        alt={product.title}
                        fill
                        className="object-contain rounded-lg"
                    />
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