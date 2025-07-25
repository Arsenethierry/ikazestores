import React from 'react';
import { getPaginatedVirtualProducts } from '@/lib/actions/virtual-products-actions';
import { VirtualProductCard } from '@/features/products/components/product-cards/virtual-product-card';
import { VirtualProductsSearchParams } from '@/lib/types';
import { NoItemsCard } from '@/components/no-items-card';

async function ProductFilterPage({ params }: { params: VirtualProductsSearchParams }) {
    const products = await getPaginatedVirtualProducts({ searchParams: params });

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
    } else {
        return <NoItemsCard />
    }
}

export default ProductFilterPage;