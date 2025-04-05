import { StoreCarousel } from '@/features/stores/components/store-carousel';
import React, { Suspense } from 'react';
import { getVirtualStoreByDomain } from '@/lib/actions/vitual-store.action';
import { ProductListSkeleton } from '@/features/products/components/products-list-sekeleton';
import { StoreProductsList } from '@/features/products/components/store-products-list';
import { Skeleton } from '@/components/ui/skeleton';
import { TagsNav } from './tags-nav';

async function page({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params;
    const store = await getVirtualStoreByDomain(domain);

    return (
        <>
            <Suspense fallback={<Skeleton />}>
                <StoreCarousel carouselImages={store.documents[0].bannerUrls} />
            </Suspense>
            
            <TagsNav />
            <section className="main-container p-2">
                <Suspense fallback={<ProductListSkeleton />}>
                    <StoreProductsList storeId={store.documents[0].$id} />
                </Suspense>
            </section>
        </>
    );
}

export default page;