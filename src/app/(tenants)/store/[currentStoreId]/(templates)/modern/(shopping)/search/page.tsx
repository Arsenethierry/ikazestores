import { getGeneralCategories } from '@/features/categories/actions/categories-actions'
import { FilterSidebar } from '@/features/products/components/filter-side-bar';
import { ProductListSkeleton } from '@/features/products/components/products-list-sekeleton';
import { SearchResultsPage } from '@/features/products/components/search/search-results';
import { SearchResultsHeader } from '@/features/products/components/search/search-results-header';
import { SortControl } from '@/features/products/components/sort-controls';
import React, { Suspense } from 'react';

export default async function SearchPage(
    props: {
        searchParams: Promise<{
            query?: string;
            category?: string;
            minPrice?: string;
            maxPrice?: string;
            sortBy?: string;
            lastId?: string;
            firstId?: string;
        }>
    }
) {
    const searchParams = await props.searchParams;
    const categories = await getGeneralCategories();
    const searchQuery = (await searchParams.query) || '';

    return (
        <div className='flex gap-4 main-container py-5'>
            <aside className='w-64 shrink-0'>
                <FilterSidebar categories={categories.documents} />
            </aside>
            <section className='flex-1'>
                <SearchResultsHeader query={searchQuery} />
                <SortControl />
                <div className='flex-1 flex flex-wrap gap-4'>
                    <Suspense fallback={<ProductListSkeleton />}>
                        <SearchResultsPage searchParams={searchParams} />
                    </Suspense>
                </div>
            </section>
        </div>
    );
}