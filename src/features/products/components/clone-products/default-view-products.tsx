import { getOriginalProductsWithVirtualProducts } from '@/features/products/actions/original-products-actions';
import { PhysicalProductCard } from '@/features/products/components/product-cards/physical-product-card';
import { ProductSekeleton } from '@/features/products/components/products-list-sekeleton';
import { CurrentUserType, DocumentType } from '@/lib/types';
import React, { Suspense } from 'react';

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

    const result = await getOriginalProductsWithVirtualProducts();

    if (result === undefined) {
        return <p>Loading...</p>;
    }

    if (result.serverError) {
        return <p>Error: {result.serverError}</p>;
    }

    const products = result.data?.products;

    if (!products || !products.documents) {
        return <p>No products found</p>;
    }

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {products.documents.map((product: DocumentType) => (
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
        </div>
    );
}

export default CloneProductsPage;