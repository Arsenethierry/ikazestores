import { buttonVariants } from '@/components/ui/button';
import { getOriginalProducts } from '@/features/products/actions/original-products-actions';
import ProductCard from '@/features/products/components/product-card';
import { DocumentType } from '@/lib/types';
import { getAuthState } from '@/lib/user-label-permission';
import Link from 'next/link';
import React from 'react';

async function CloneProductsPage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    const { isVirtualStoreOwner } = await getAuthState();

    if(!isVirtualStoreOwner) {
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
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CloneProductsPage;