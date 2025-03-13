import { buttonVariants } from '@/components/ui/button';
import { getOriginalProducts } from '@/features/products/actions/original-products-actions';
import { PhysicalProductCard } from '@/features/products/components/product-cards/physical-product-card';
import { ProductSekeleton } from '@/features/products/components/products-list-sekeleton';
import { DocumentType } from '@/lib/types';
import { getAuthState } from '@/lib/user-label-permission';
import Link from 'next/link';
import React, { Suspense } from 'react';

async function CloneProductsPage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    const { isVirtualStoreOwner } = await getAuthState();

    if (!isVirtualStoreOwner) {
        return <p className='text-3xl text-destructive font-bold'>Access denied!</p>
    }

    const result = await getOriginalProducts();

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
            <Link href={`/admin/stores/${storeId}/products/new`} className={`${buttonVariants()} mb-5`}>Create New Product</Link>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {products.documents.map((product: DocumentType) => (
                    <div key={product.$id}>
                        <Suspense fallback={<ProductSekeleton />}>
                            <PhysicalProductCard product={product} storeId={storeId} />
                        </Suspense>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CloneProductsPage;