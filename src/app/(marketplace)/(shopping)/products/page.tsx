import { getGeneralCategories } from '@/features/categories/actions/categories-actions';
import React, { Suspense } from 'react';
import { SearchParams } from 'nuqs';
import { ProductListSkeleton } from '@/features/products/components/products-list-sekeleton';
import { FilterSidebar } from '@/features/products/components/filter-side-bar';
import { SortControl } from '@/features/products/components/sort-controls';
import ProductFilterPage from '../../../../features/products/components/product-filter-page';

interface PageProps {
    params: Promise<{ storeId: string }>; // Add storeId from URL params
    searchParams: Promise<SearchParams>;
}

async function page({ params, searchParams }: PageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const categories = await getGeneralCategories();

    // Validate storeId
    if (!resolvedParams.storeId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Store Required</h2>
                    <p className="text-muted-foreground">Please specify a virtual store to browse products</p>
                </div>
            </div>
        );
    }

    return (
        <div className='flex gap-4 main-container py-5'>
            <aside className='w-64 shrink-0'>
                <FilterSidebar categories={categories.documents} />
            </aside>
            <section className="flex-1">
                <SortControl />
                <div className='p-5'>
                    <Suspense fallback={<ProductListSkeleton />}>
                        <ProductFilterPage 
                            params={{
                                ...resolvedSearchParams,
                                storeId: resolvedParams.storeId
                            }} 
                        />
                    </Suspense>
                </div>
            </section>
        </div>
    );
}

export default page;