"use client";

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { DecreaseCartItemQuantity, IncreaseCartItemQuantity, RemoveCartItem } from './cart-actions-buttons';
import { Button } from '@/components/ui/button';
import { useCartStore } from '../use-cart-store';
import { NoItemsCard } from '@/components/no-items-card';
import { Separator } from '@/components/ui/separator';
import { getCurrencySymbol } from '@/features/products/currency/currency-utils';

export const CartPage = () => {
    const { items, totalItems } = useCartStore();


    const router = useRouter();
    const [selectedItems, setSelectedItems] = useState<string[]>(items.map(item => item.id));

    if (totalItems === 0) {
        return (
            <div className='ppy-10 md:py-20'>
                <NoItemsCard />
            </div>
        )
    }


    const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
    const selectedTotalItems = selectedItemsData.reduce((acc, item) => acc + item.quantity, 0);

    const handleCheckedChange = (itemId: string) => (checked: boolean) => {
        setSelectedItems(prev =>
            checked ? [...prev, itemId] : prev.filter(id => id !== itemId)
        )
    }

    const handlePlaceOrder = () => {
        router.push(`/place-order?products=${encodeURIComponent(selectedItems.join(','))}`);
    };

    return (
        <div className='grid md:grid-cols-3 gap-5 py-10 md:py-5 px-4 max-w-7xl mx-auto'>
            <div className='md:col-span-2 flex flex-col gap-5'>
                {items.map(item => (
                    <Card key={item.id} className='shadow-sm hover:shadow-md transition-shadow'>
                        <CardContent className='flex items-center p-4 gap-4'>
                            <Checkbox
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={handleCheckedChange(item.id)}
                                className='mr-2 h-5 w-5'
                            />

                            <div className='relative h-20 w-20 flex-shrink-0'>
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className='object-contain rounded-lg'
                                />
                            </div>

                            <div className='flex-1'>
                                <h3 className='font-medium text-base truncate max-w-[250px] w-full' title={item.name}>
                                    {item.name}
                                </h3>
                                <div className='text-sm text-gray-500'>
                                    {getCurrencySymbol(item.productCurrency)} {item.price}
                                    each
                                </div>

                                <div className='flex items-center gap-3 mt-2'>
                                    <DecreaseCartItemQuantity item={item} />
                                    <span className='w-6 text-center'>{item.quantity}</span>
                                    <IncreaseCartItemQuantity item={item} />
                                </div>
                            </div>

                            <div className='flex flex-col items-end gap-2'>
                                <div className='font-semibold text-lg'>
                                    {getCurrencySymbol(item.productCurrency)} {item.price * item.quantity}
                                </div>
                                <RemoveCartItem item={item} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className='md:sticky md:top-20 h-fit'>
                <Card className='shadow-sm hover:shadow-md transition-shadow'>
                    <CardContent className='p-4 gap-4'>
                        {(() => {
                            const currencies = [...new Set(selectedItemsData.map(item => item.productCurrency || 'USD'))];

                            return currencies.length > 1 ? (
                                <div className='space-y-2 mb-3 p-3 bg-gray-50 rounded-lg'>
                                    <span className='text-sm font-medium text-gray-600'>Items by currency:</span>
                                    {currencies.map(currency => {
                                        const currencyItems = selectedItemsData.filter(item => (item.productCurrency || 'USD') === currency);
                                        const currencySubtotal = currencyItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                        const itemCount = currencyItems.reduce((sum, item) => sum + item.quantity, 0);

                                        return (
                                            <div key={currency} className='flex justify-between text-sm'>
                                                <span>{itemCount} items ({currency})</span>
                                                {getCurrencySymbol(currency)} {currencySubtotal}
                                            </div>
                                        );
                                    })}
                                    <Separator className='border-gray-200' />
                                </div>
                            ) : null;
                        })()}

                        {/* <div className='flex justify-between'>
                            <span>Subtotal ({selectedTotalItems} items)</span>
                            <div className='text-right'>
                                {exchangeRatesLoading ? (
                                    <span className='text-sm text-gray-500'>Calculating...</span>
                                ) : (
                                    <>
                                        {getCurrencySymbol(currentCurrency)} {subtotal}
                                        {[...new Set(selectedItemsData.map(item => item.productCurrency || 'USD'))].length > 1 && (
                                            <div className='text-xs text-gray-500'>
                                                Total in {currentCurrency}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <div className='flex justify-between'>
                            <span>Shipping</span>
                            <span>FREE</span>
                        </div>

                        <Separator className='my-4' />

                        <div className='flex justify-between font-bold text-lg'>
                            <span>Total</span>
                            <div className='text-right'>
                                {exchangeRatesLoading ? (
                                    <span className='text-sm text-gray-500'>Calculating...</span>
                                ) : (
                                    <>
                                        {getCurrencySymbol(currentCurrency)} {total}
                                    </>
                                )}
                            </div>
                        </div> */}

                
                    </CardContent>

                    <Separator className='my-4' />

                    <CardFooter className='p-6 pt-0'>
                        <Button
                            onClick={handlePlaceOrder}
                            disabled={selectedItems.length === 0}
                        >
                            Place order
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}