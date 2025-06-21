"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PhysicalProductMenuActions } from "../physical-product-actions"
import { OriginalProductTypes } from "@/lib/types"
import Image from "next/image"

export const productListColumns: ColumnDef<OriginalProductTypes>[] = [
    {
        accessorKey: "title",
        header: "Product Title",
        cell: ({ row }) => {
            const product = row.original;
            return (
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                        {product.generalProductImages && product.generalProductImages.length > 0 ? (
                            <Image
                                src={product.generalProductImages[0]}
                                alt={product.title}
                                width={50}
                                height={50}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{product.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "basePrice",
        header: "Price",
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("basePrice"));
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(price);
            return <div className="font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "inventoryQuantity",
        header: "Stock",
        cell: ({ row }) => {
            const stock: number = row.getValue("inventoryQuantity") || 0;
            return (
                <div className={`font-medium ${stock === 0 ? 'text-red-600' : stock < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {stock}
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const rawStatus = row.getValue("status");
            const status = typeof rawStatus === 'string' ? rawStatus : 'draft';

            let colorClass = 'bg-gray-100 text-gray-800';

            if (status === 'draft' || status === 'archived') {
                colorClass = 'bg-red-100 text-red-800';
            } else {
                colorClass = 'bg-green-100 text-green-800';
            }

            return (
                <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
                    {status}
                </span>
            );
        },
    },
    {
        accessorKey: "featured",
        header: "Featured",
        cell: ({ row }) => {
            const featured = row.getValue("featured");
            return featured ? (
                <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ) : null;
        },
    },
    {
        accessorKey: "vitualProducts",
        header: "Clones",
        cell: ({ row }) => {
            const clones = row.original.vitualProducts?.length || 0;
            return (
                <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{clones}</span>
                </div>
            );
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const product = row.original;
            return <PhysicalProductMenuActions product={product} />;
        },
    },
];