import { getAllCategoriesByStoreId } from '@/features/categories/actions/categories-actions';
import React, { Suspense } from 'react';
import ProductPage from './product-page';
import { SearchParams } from 'nuqs';
import { ProductListSkeleton } from '@/features/products/components/products-list-sekeleton';
import { FilterSidebar } from '@/features/products/components/filter-side-bar';
import { SortControl } from '@/features/products/components/sort-controls';

async function page({
    params,
    searchParams
}: {
    params: Promise<{ currentStoreId: string }>,
    searchParams: Promise<SearchParams>
}) {
    const { currentStoreId } = await params;
    const queries = await searchParams
    const categories = await getAllCategoriesByStoreId({ storeId: currentStoreId });
    
    return (
        <div className='flex gap-4 main-container py-5'>
            <aside className='w-64 shrink-0'>
                <FilterSidebar categories={categories.documents} />
            </aside>
            <section>
                <SortControl />
                <div className='flex-1 flex flex-wrap gap-2 p-5'>
                    <Suspense fallback={<ProductListSkeleton />}>
                        <ProductPage currentStoreId={currentStoreId} searchParams={queries} />
                    </Suspense>
                </div>
            </section>
        </div>
    );
}

export default page;