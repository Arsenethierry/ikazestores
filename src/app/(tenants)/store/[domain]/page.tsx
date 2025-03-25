import { StoreCarousel } from '@/features/stores/components/store-carousel';
import { Separator } from '@/components/ui/separator';
import { Truck } from 'lucide-react';
import React, { Suspense } from 'react';
import { getVirtualStoreByDomain } from '@/lib/actions/vitual-store.action';
import { ProductListSkeleton } from '@/features/products/components/products-list-sekeleton';
import { StoreProductsList } from '@/features/products/components/store-products-list';
import { Skeleton } from '@/components/ui/skeleton';

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
            <section className='main-container mt-2 md:block hidden'>
                <div className='w-full p-5 border rounded-md'>
                    <div className="flex h-10 items-center justify-evenly space-x-4 text-sm">
                        <div className='inline-flex items-center gap-2'>
                            <Truck size={50} color="#FF9600" />
                            <div className='flex flex-col'>
                                <b>Free delivery</b>
                                <p>Free delivery</p>
                            </div>
                        </div>
                        <Separator orientation="vertical" />
                        <div className='inline-flex items-center gap-2'>
                            <Truck size={50} color="#FF9600" />
                            <div className='flex flex-col'>
                                <b>Free delivery</b>
                                <p>Free delivery</p>
                            </div>
                        </div>
                        <Separator orientation="vertical" />
                        <div className='inline-flex items-center gap-2'>
                            <Truck size={50} color="#FF9600" />
                            <div className='flex flex-col'>
                                <b>Free delivery</b>
                                <p>Free delivery</p>
                            </div>
                        </div>
                        <Separator orientation="vertical" />
                        <div className='inline-flex items-center gap-2'>
                            <Truck size={50} color="#FF9600" />
                            <div className='flex flex-col'>
                                <b>Free delivery</b>
                                <p>Free delivery</p>
                            </div>
                        </div>
                        <Separator orientation="vertical" />
                        <div className='inline-flex items-center gap-2'>
                            <Truck size={50} color="#FF9600" />
                            <div className='flex flex-col'>
                                <b>Free delivery</b>
                                <p>Free delivery</p>
                            </div>
                        </div>
                        <Separator orientation="vertical" className='text-yellow-600' />
                        <div className='inline-flex items-center gap-2'>
                            {/* <Truck  /> */}
                            <Truck size={50} color="#FF9600" />
                            <div className='flex flex-col'>
                                <b>Free delivery</b>
                                <p>Free delivery</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="main-container p-2">
                <Suspense fallback={<ProductListSkeleton />}>
                    <StoreProductsList storeId={store.documents[0].$id} />
                </Suspense>
            </section>
        </>
    );
}

export default page;