import { PhysicalProductCard } from '@/features/products/components/product-cards/physical-product-card';
import { ProductSekeleton } from '@/features/products/components/products-list-sekeleton';
import { CurrentUserType, OriginalProductTypes } from '@/lib/types';
import React, { Suspense } from 'react';
import { getOriginalProductsWithVirtualProducts } from '../../../../lib/actions/virtual-products-actions';

async function CloneProductsPage({
    storeId,
    user,
    isSystemAdmin,
    isPhysicalStoreOwner,
    isVirtualStoreOwner
}: {
    storeId: string,
    isVirtualStoreOwner: boolean,
    isPhysicalStoreOwner: boolean,
    isSystemAdmin: boolean,
    user: CurrentUserType
}) {
    
    const result = await getOriginalProductsWithVirtualProducts({});

    if (result === undefined) {
        return <p>Loading...</p>;
    }

    if (result.error) {
        return <p>Error: {result.error}</p>;
    }

    const products = result.data?.products;

    if (!products || !products) {
        return <p>No products found</p>;
    }

    return (
        <div className="flex flex-wrap gap-4">
            {products.map((product: OriginalProductTypes) => (
                <div key={product.$id}>
                    <Suspense fallback={<ProductSekeleton />}>
                        <PhysicalProductCard
                            product={product}
                            storeId={storeId}
                            user={user}
                            isSystemAdmin={isSystemAdmin}
                            isPhysicalStoreOwner={isPhysicalStoreOwner}
                            isVirtualStoreOwner={isVirtualStoreOwner}
                        />
                    </Suspense>
                </div>
            ))}
        </div>
    );
}

export default CloneProductsPage;