import { NoItemsCard } from '@/components/no-items-card';
import SpinningLoader from '@/components/spinning-loader';
import { CartPage } from '@/features/cart/components/cart-page';
import { getCart } from '@/lib/cart';
import { QueryClient } from '@tanstack/react-query';
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

    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: ['cartItems'],
        queryFn: getCart,
    })

    return (
        <Suspense fallback={<SpinningLoader />}>
            <CartPage cartItems={cartItems} />
        </Suspense>
    )
}

export default page;