import { NoItemsCard } from '@/components/no-items-card';
import SpinningLoader from '@/components/spinning-loader';
import { ProductDetails } from '@/features/products/components/product-details';
import { getVirtualProductById, getVirtualStoreProducts } from '@/lib/actions/affiliate-product-actions';
import React, { Suspense } from 'react';

async function page({
    params,
}: {
    params: Promise<{ productId: string; }>
}) {
    const { productId } = await params;

    const product = await getVirtualProductById(productId);

    if (!product) {
        return <NoItemsCard title="Product not found" />;
    }

    return (
        <div>
            <Suspense fallback={<SpinningLoader />}>
                <ProductDetails product={product} />
            </Suspense>
        </div>
    );
}

export default page;