import { NoItemsCard } from '@/components/no-items-card';
import SpinningLoader from '@/components/spinning-loader';
import { getVirtualProductById } from '@/lib/actions/virtual-products-actions';
import { ProductDetails } from '@/features/products/components/product-details-page';
import React, { Suspense } from 'react';

async function page({
    params,
}: {
    params: Promise<{ productId: string }>
}) {
    const { productId } = await params;
    const productData = await getVirtualProductById(productId);

    if (!productData || !productData.data) return <NoItemsCard />;
    
    return (
        <div>
            <Suspense fallback={<SpinningLoader />}>
                <ProductDetails product={productData.data} />
            </Suspense>
        </div>
    );
}

export default page;