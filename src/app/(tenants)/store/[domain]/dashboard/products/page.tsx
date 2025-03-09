import { NoItemsCard } from '@/components/no-items-card';
import { buttonVariants } from '@/components/ui/button';
import { getVirtualStoreProducts } from '@/features/products/actions/virtual-products-actions';
import { loadSearchParams } from '@/lib/searchParams';
import Link from 'next/link';
import { SearchParams } from 'nuqs';
import React from 'react';

type PageProps = {
    searchParams: Promise<SearchParams>
}

const StoreProductsPage = async ({ searchParams }: PageProps) => {
    const { storeId } = await loadSearchParams(searchParams);

    const products = await getVirtualStoreProducts(storeId);

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