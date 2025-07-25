import React from 'react';
import { getPaginatedVirtualProducts } from '@/lib/actions/virtual-products-actions';
import { VirtualProductCard } from '@/features/products/components/product-cards/virtual-product-card';
import { VirtualProductsSearchParams } from '@/lib/types';

async function ProductPage({
    currentStoreId,
    searchParams
}: {
    currentStoreId: string,
    searchParams: VirtualProductsSearchParams
}) {
    
    const products = await getPaginatedVirtualProducts({searchParams, storeId: currentStoreId});


    if (products.data.total > 0) {
        return (
            products.data.documents.map((product) => (
                <div key={product.$id}>
                    <VirtualProductCard
                        product={product}
                    />
                </div>
            ))
        )
    }
}

export default ProductPage;