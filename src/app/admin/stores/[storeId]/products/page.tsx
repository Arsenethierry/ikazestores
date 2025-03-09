import { buttonVariants } from '@/components/ui/button';
import { getOriginalProducts } from '@/features/products/actions/original-products-actions';
import { getVirtualStoreProducts } from '@/features/products/actions/virtual-products-actions';
import { productListColumns } from '@/features/products/components/products-list-table/columns';
import { ProductsDataTable } from '@/features/products/components/products-list-table/data-table';
import { getAuthState } from '@/lib/user-label-permission';
import Link from 'next/link';
import React from 'react';

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
                virtual store products <br/>
                <Link href={`/admin/stores/${storeId}/products/clone-products`} className={`${buttonVariants()} mb-5`}>Create New Product</Link>
                <br/> <br/>
                {JSON.stringify(virtualProducts)}
                {/* <main className="container mx-auto py-8 px-4">
                <h1 className="text-2xl font-bold mb-6">Featured Products</h1>
                <ProductGridComponent />
            </main> */}
            </>
        ) : isPhysicalStoreOwner ? (
            <div className="container mx-auto py-10">
                <ProductsDataTable columns={productListColumns} data={products.documents} />
            </div>
        ) : <></>
    );
}

export default StoreProductsPage;