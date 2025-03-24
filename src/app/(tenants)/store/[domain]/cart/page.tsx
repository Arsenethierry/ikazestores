import { NoItemsCard } from '@/components/no-items-card';
import SpinningLoader from '@/components/spinning-loader';
import { CartPage } from '@/features/cart/components/cart-page';
import { getCart } from '@/lib/cart';
import React, { Suspense } from 'react';

async function page() {
    const cartItems = await getCart();

    if (cartItems.totalItems === 0) {
        return (
            <div className='ppy-10 md:py-20'>
                <NoItemsCard />
            </div>
        )
    }
    return (
        <Suspense fallback={<SpinningLoader />}>
            <CartPage cartItems={cartItems} />
        </Suspense>
    )
}

export default page;