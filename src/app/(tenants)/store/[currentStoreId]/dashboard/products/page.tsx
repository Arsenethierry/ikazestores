import { NoItemsCard } from '@/components/no-items-card';
import { buttonVariants } from '@/components/ui/button';
import { getVirtualStoreProducts } from '@/features/products/actions/virtual-products-actions';
import Link from 'next/link';
import React from 'react';

const StoreProductsPage = async ({
    params,
}: {
    params: Promise<{ currentStoreId: string }>
}) => {
    const { currentStoreId } = await params;
    const products = await getVirtualStoreProducts({ virtualStoreId: currentStoreId, limit: 10 });

    return (
        <div>
            <div className='flex justify-between'>
                <h4>all products</h4>
                <Link href={'/admi'} className={buttonVariants()}>Add new products</Link>
            </div>
            {products && products.total === 0 ? (
                <NoItemsCard />
            ) : (
                <div>products list</div>
            )}
        </div>
    );
}

export default StoreProductsPage;