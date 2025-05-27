import { StoreCarousel } from '@/features/stores/components/store-carousel';
import React, { Suspense } from 'react';
import { getVirtualStoreById } from '@/lib/actions/vitual-store.action';
import { ProductListSkeleton } from '@/features/products/components/products-list-sekeleton';
import { StoreProductsList } from '@/features/products/components/store-products-list';
import { Skeleton } from '@/components/ui/skeleton';
import { TagsNav } from './tags-nav';
import { getVirtualStoreProducts } from '@/features/products/actions/virtual-products-actions';

async function page({
    params,
}: {
    params: Promise<{ currentStoreId: string }>
}) {
    const { currentStoreId } = await params;
    const store = await getVirtualStoreById(currentStoreId);
      const storeProducts = await getVirtualStoreProducts({ virtualStoreId: currentStoreId, limit: 6 });
    
    if (!store) return <h3 className='text-3xl'>store with id: {currentStoreId} is not found.</h3>;

    return (
        <>
            <Suspense fallback={<Skeleton />}>
                {/* <StoreCarousel carouselImages={store?.bannerUrls} /> */}
            </Suspense>
            {storeProducts?.total}

            <TagsNav />
            <section className="main-container p-2">
                <div className="container mx-auto">
                    <div className="flex flex-row gap-5 my-5">
                        <div className="w-1/3 flex flex-col gap-5">
                            <div className="bg-green-200 h-48"></div>
                            <div className="bg-green-200 h-48"></div>
                        </div>
                        <div className="w-2/3 bg-gray-300 p-8"></div>
                    </div>
                    
                    <div className="py-5">
                        <h4 className="text-2xl font-bold text-center">Heading 4</h4>
                    </div>
                    <div className="container mx-auto">
                        <Suspense fallback={<ProductListSkeleton />}>
                            <StoreProductsList storeId={store.$id} />
                        </Suspense>
                    </div>
                <section className="bg-white dark:bg-gray-900">
                    <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
                        <div className="mr-auto place-self-center lg:col-span-7">
                            <h1 className="max-w-l mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-xl xl:text-2xl dark:text-white">Payments tool for software companies</h1>
                            <p className="max-w-l mb-6 font-light text-gray-500 lg:mb-8 md:text-md lg:text-lg dark:text-gray-400">From checkout to global sales tax compliance, companies around the world use Flowbite to simplify their payment stack.</p>
                            
                            <a href="#" className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
                                Speak to Sales
                            </a> 
                        </div>
                        <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
                            <img src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/hero/phone-mockup.png" alt="mockup"/>
                        </div>                
                    </div>
                </section>
                <div className="py-5">
                        <h4 className="text-2xl font-bold text-center">Heading 5</h4>
                    </div>
                    <div className="container mx-auto">
                        <Suspense fallback={<ProductListSkeleton />}>
                            <StoreProductsList storeId={store.$id} />
                            <StoreProductsList storeId={store.$id} />
                        </Suspense>
                    </div>
                </div>
            </section>
        </>
    );
}

export default page;