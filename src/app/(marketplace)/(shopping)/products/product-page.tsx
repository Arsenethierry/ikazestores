import React from 'react';
import { getPaginatedVirtualProducts } from '@/features/products/actions/virtual-products-actions';
import { VirtualProductCard } from '@/features/products/components/product-cards/virtual-product-card';
import { VirtualProductsSearchParams } from '@/lib/types';

async function ProductPage({ params }: { params: VirtualProductsSearchParams }) {
    const products = await getPaginatedVirtualProducts({ searchParams: params });

    if (products.total > 0) {
        return (
            products.documents.map((product) => (
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