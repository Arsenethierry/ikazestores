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
                    <div className="flex md:flex-row flex-col gap-5 my-5">
                        <div className="w-1/3 flex md:flex-col sm:flex-row flex-col w-full gap-5">
                            <div className="bg-green-200 h-48 w-full"></div>
                            <div className="bg-green-200 h-48 w-full"></div>
                        </div>
                        <div className="w-2/3 bg-gray-300 p-8 w-full"></div>
                    </div>
                    
                    <div className="py-5">
                        <h4 className="text-2xl font-bold text-center">Heading 4</h4>
                    </div>
                    <div className="container mx-auto">
                        <Suspense fallback={<ProductListSkeleton />}>
                            <StoreProductsList storeId={store.$id} />
                        </Suspense>
                    </div>
                <div className="relative w-full min-h-[500px] overflow-hidden">
    <div className="absolute inset-0 mt-12">
        <img src="https://www.mustgo.com/wp-content/uploads/2018/04/iStock-692910484.jpg" alt="დუბროვნიკი" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 dark:bg-black/40"></div>
    </div>

    <div className="relative w-full md:w-[600px] lg:w-[700px] p-8 md:p-12 mt-8 md:mt-12 mx-auto md:mr-8 lg:mr-12">
        <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-lg backdrop-blur-sm">
            <div className="max-w-2xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 dark:text-white">
                    Discount 50%
                </h2>

                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg mb-6">
                    From checkout to global sales tax compliance, companies around the world use Flowbite to simplify their payment stack.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button className="bg-red-600 dark:bg-red-700 text-white px-6 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors">
                        Buy Now
                    </button>
                    
                </div>
            </div>
        </div>
    </div>
</div>
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