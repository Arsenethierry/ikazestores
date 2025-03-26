import SpinningLoader from '@/components/spinning-loader';
import { CartPage } from '@/features/cart/components/cart-page';
import React, { Suspense } from 'react';

async function page() {
    return (
        <Suspense fallback={<SpinningLoader />}>
            <CartPage />
        </Suspense>
    )
}

export default page;