import SpinningLoader from '@/components/spinning-loader';
import { buttonVariants } from '@/components/ui/button';
import { getOriginalProducts } from '@/features/products/actions/original-products-actions';
import { getVirtualStoreProducts } from '@/features/products/actions/virtual-products-actions';
import { VirtualProductCard } from '@/features/products/components/product-cards/virtual-product-card';
import { ProductSekeleton } from '@/features/products/components/products-list-sekeleton';
import { productListColumns } from '@/features/products/components/products-list-table/columns';
import { ProductsDataTable } from '@/features/products/components/products-list-table/data-table';
import { DocumentType } from '@/lib/types';
import { getAuthState } from '@/lib/user-label-permission';
import Link from 'next/link';
import React, { Suspense } from 'react';

async function StoreProductsPage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    const { isPhysicalStoreOwner, isVirtualStoreOwner } = await getAuthState();

    const originalProducts = isPhysicalStoreOwner ? await getOriginalProducts() : { data: { products: { documents: [] } }, serverError: null };
    const virtualProducts = isVirtualStoreOwner ? await getVirtualStoreProducts(storeId) : null;

    if (originalProducts === undefined) {
        return <p>Loading...</p>;
    }

    if (originalProducts.serverError) {
        return <p>Error: {originalProducts.serverError}</p>;
    }

    const products = originalProducts.data?.products;

    if (!products || !products.documents) {
        return <p>No products found</p>;
    }


    return (
        isVirtualStoreOwner ? (
            <>
                <Link href={`/admin/stores/${storeId}/products/clone-products`} className={`${buttonVariants()} mb-5`}>Add Products</Link>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {virtualProducts && virtualProducts.documents.map((product: DocumentType) => (
                        <div key={product.$id}>
                            <Suspense fallback={<ProductSekeleton />}>
                                <VirtualProductCard product={product} storeId={storeId} />
                            </Suspense>
                        </div>
                    ))}
                </div>
            </>
        ) : isPhysicalStoreOwner ? (
            <div className="container mx-auto py-10">
                <Suspense fallback={<SpinningLoader />}>
                    <ProductsDataTable columns={productListColumns} data={products.documents} />
                </Suspense>
            </div>
        ) : <></>
    );
}

export default StoreProductsPage;