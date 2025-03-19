import { NoItemsCard } from '@/components/no-items-card';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { DecreaseCartItemQuantity, IncreaseCartItemQuantity, RemoveCartItem } from '@/features/cart/components/cart-actions-buttons';
import { getCart } from '@/lib/cart';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export const CartPage = async () => {
    const cartItems = await getCart();

    if (cartItems.totalItems === 0) {
        return (
            <div className='ppy-10 md:py-20'>
                <NoItemsCard />
            </div>
        )
    }

    const subtotal = cartItems?.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50

    return (
        <div className='grid md:grid-cols-3 gap-5 py-10 md:py-5 px-4 max-w-7xl mx-auto'>
            <div className='md:col-span-2 flex flex-col gap-5'>
                {cartItems.items.map((item) => {
                    return (
                        <Card key={item.id} className='shadow-sm hover:shadow-md transition-shadow'>
                            <CardContent className='flex flex-col lg:flex-row lg:items-center p-4 gap-4'>
                                <div className='relative h-20 w-20 flex-shrink-0'>
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className='object-contain rounded-lg'
                                    />
                                </div>

                                <div className='flex-1'>
                                    <h3 className='font-medium text-base truncate'>{item.name}</h3>
                                    <p className='text-sm text-gray-500'>${item.price.toFixed(2)} each</p>

                                    <div className='flex items-center gap-3 mt-2'>
                                        <DecreaseCartItemQuantity item={item} />
                                        <span className='w-6 text-center'>{item.quantity}</span>
                                        <IncreaseCartItemQuantity item={item} />
                                    </div>
                                </div>

                                <div className='flex flex-col items-end gap-2'>
                                    <p className='font-semibold text-lg'>${item.price.toFixed(2)}</p>
                                    <RemoveCartItem item={item} />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
            <div className='md:sticky md:top-20 h-fit'>
                <Card className='shadow-lg'>
                    <CardContent className='p-6'>
                        <h2 className='text-xl font-bold mb-4'>Order Summary</h2>
                        <div className='space-y-3'>
                            <div className='flex justify-between'>
                                <span>Subtotal ({cartItems.totalItems} items)</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span>Shipping</span>
                                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                            </div>
                        </div>

                        <hr className='my-4' />

                        <div className='flex justify-between font-bold text-lg'>
                            <span>Total</span>
                            <span>${(subtotal + shipping).toFixed(2)}</span>
                        </div>
                    </CardContent>

                    <CardFooter className='p-6 pt-0'>
                        <Link href={'/place-order'} className={buttonVariants()}>Place order</Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}