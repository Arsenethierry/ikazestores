import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { OrderItems } from '@/lib/types/appwrite/appwrite';
import Image from 'next/image';
import React from 'react';

function OrderItemRow({ item }: { item: OrderItems }) {

    return (
        <TableRow className='hover:bg-gray-50/50'>
            <TableCell className="w-[100px]">
                <div className="flex items-center space-x-3">
                    {item.productImage && (
                        <div className="relative flex-shrink-0">
                            <Image
                                src={item.productImage}
                                alt={item.productName}
                                width={100}
                                height={100}
                                className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                            />
                        </div>
                    )}
                    <div className="flex flex-col space-y-1 min-w-0">
                        <span className="text-xs text-gray-500 font-mono">
                            {item.sku}
                        </span>
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <div className="space-y-1">
                    <span className="font-medium text-gray-900 leading-tight">
                        {item.productName}
                    </span>
                    {item.variant && (
                        <p className="text-sm text-gray-500">
                            {item.variant}
                        </p>
                    )}
                </div>
            </TableCell>

            {/* Quantity Column */}
            <TableCell>
                <span className="font-medium">
                    {item.quantity}
                </span>
            </TableCell>

            {/* Price Column */}
            <TableCell className="text-right">
                <span className="font-medium text-gray-900">
                    ${((item.basePrice + item.commission) * (item.quantity || 1))}
                </span>
                {item.quantity && item.quantity > 1 && (
                    <p className="text-sm text-gray-500">
                        ${item.basePrice + item.commission} each
                    </p>
                )}
            </TableCell>
        </TableRow>
    );
}

export default OrderItemRow;