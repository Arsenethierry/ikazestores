"use client";

import { ProductPriceDisplay } from '@/features/products/currency/converted-price-component';
import { VirtualProductTypes } from '@/lib/types';
import { Check } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import DOMPurify from "isomorphic-dompurify";

interface GroupProductSelectorProps {
    products: VirtualProductTypes[];
    onSelectionChange?: (selectedIds: string[]) => void;
    initialSelectedIds?: string[];
    existingProductIds?: string[];
}

const sanitizedProductDescription = (description: string) => {
  return DOMPurify.sanitize(description, { USE_PROFILES: { html: true } });
}

export const GroupProductSelector = ({
    products,
    onSelectionChange,
    initialSelectedIds = [],
    existingProductIds = []
}: GroupProductSelectorProps) => {
    const [selectedProductsIds, setSelectedProductsIds] = useState<string[]>(initialSelectedIds);

    useEffect(() => {
        setSelectedProductsIds(initialSelectedIds);
    }, [initialSelectedIds]);

    const toggleProductIdSelection = (productId: string) => {
        const newSelection = selectedProductsIds.includes(productId)
            ? selectedProductsIds.filter(id => id !== productId)
            : [...selectedProductsIds, productId];

        setSelectedProductsIds(newSelection);

        if (onSelectionChange) {
            onSelectionChange(newSelection);
        }
    };

    return (
        <>
            {products.map((product: VirtualProductTypes) => (
                <div
                    key={product.$id}
                    className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all duration-200 ${selectedProductsIds.includes(product.$id)
                        ? existingProductIds.includes(product.$id)
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-green-500 ring-2 ring-green-500/20'
                        : existingProductIds.includes(product.$id)
                            ? 'border-amber-500 ring-2 ring-amber-500/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                    onClick={() => toggleProductIdSelection(product.$id)}
                >
                    {selectedProductsIds.includes(product.$id) ? (
                        <div className={`absolute top-2 right-2 z-10 rounded-full p-1 ${existingProductIds.includes(product.$id)
                            ? 'bg-primary'
                            : 'bg-green-500'
                            }`}>
                            <Check className="h-4 w-4 text-white" />
                        </div>
                    ) : existingProductIds.includes(product.$id) ? (
                        <div className='absolute top-2 right-2 z-10 bg-amber-500 text-white rounded-full p-1'>
                            <Check className="h-4 w-4 opacity-50" />
                        </div>
                    ) : null}

                    {existingProductIds.includes(product.$id) && (
                        <div className={`absolute top-2 left-2 z-10 text-xs font-medium px-2 py-1 rounded ${selectedProductsIds.includes(product.$id)
                            ? 'bg-primary/20 text-primary'
                            : 'bg-amber-500/20 text-amber-600'
                            }`}>
                            {selectedProductsIds.includes(product.$id) ? 'Added' : 'Removing'}
                        </div>
                    )}

                    {!existingProductIds.includes(product.$id) && selectedProductsIds.includes(product.$id) && (
                        <div className='absolute top-2 left-2 z-10 bg-green-500/20 text-green-600 text-xs font-medium px-2 py-1 rounded'>
                            New
                        </div>
                    )}

                    <div className='relative h-40 w-full bg-muted'>
                        {product.generalImageUrls && product.generalImageUrls[0] ? (
                            <Image
                                src={product.generalImageUrls[0]}
                                alt={product.title}
                                fill
                                className='object-cover'
                            />
                        ) : (
                            <div className='absolute inset-0 flex items-center justify-center bg-secondary/20'>
                                <span className="text-muted-foreground">No image</span>
                            </div>
                        )}
                    </div>

                    <div className='p-3'>
                        <h3 className="font-medium line-clamp-1">{product.title}</h3>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            <div className="space-y-4" dangerouslySetInnerHTML={{ __html: sanitizedProductDescription(product.description) }}></div>
                            {product.description || 'No description'}
                        </div>
                        <ProductPriceDisplay
                            productPrice={product.sellingPrice}
                            productCurrency={product.currency || 'USD'}
                        />
                    </div>
                </div>
            ))}
        </>
    );
}