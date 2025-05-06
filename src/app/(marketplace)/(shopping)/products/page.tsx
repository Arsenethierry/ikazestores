import { getGeneralCategories } from '@/features/categories/actions/categories-actions';
import React, { Suspense } from 'react';
import { SearchParams } from 'nuqs';
import { ProductListSkeleton } from '@/features/products/components/products-list-sekeleton';
import { FilterSidebar } from '@/features/products/components/filter-side-bar';
import { SortControl } from '@/features/products/components/sort-controls';
import ProductFilterPage from '../../../../features/products/components/product-filter-page';

async function page({
    searchParams
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams;
    const categories = await getGeneralCategories();

    return (
        <div className='flex gap-4 main-container py-5'>
            <aside className='w-64 shrink-0'>
                <FilterSidebar categories={categories.documents} />
            </aside>
            <section>
                <SortControl />
                <div className='flex-1 flex flex-wrap gap-2 p-5'>
                    <Suspense fallback={<ProductListSkeleton />}>
                        <ProductFilterPage params={params} />
                    </Suspense>
                </div>
            </section>
        </div>
    );
}

export default page;