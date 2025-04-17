import { StoreCarousel } from '@/features/stores/components/store-carousel';
import React, { Suspense } from 'react';
import { getVirtualStoreById } from '@/lib/actions/vitual-store.action';
import { ProductListSkeleton } from '@/features/products/components/products-list-sekeleton';
import { StoreProductsList } from '@/features/products/components/store-products-list';
import { Skeleton } from '@/components/ui/skeleton';
import { TagsNav } from './tags-nav';

async function page({
    params,
}: {
    params: Promise<{ currentStoreId: string }>
}) {
    const { currentStoreId } = await params;
    const store = await getVirtualStoreById(currentStoreId);

    if (!store) return <h3 className='text-3xl'>store with id: {currentStoreId} is not found.</h3>;

    return (
        <>
            <Suspense fallback={<Skeleton />}>
                <StoreCarousel carouselImages={store?.bannerUrls} />
            </Suspense>

            <TagsNav />
            <section className="main-container p-2">
                <Suspense fallback={<ProductListSkeleton />}>
                    <StoreProductsList storeId={store.$id} />
                </Suspense>
            </section>
        </>
    );
}

export default page;