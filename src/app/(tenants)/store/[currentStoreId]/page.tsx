import React, { Suspense } from 'react';
import { getVirtualStoreById } from '@/lib/actions/vitual-store.action';
import { ProductListSkeleton, ProductSekeleton } from '@/features/products/components/products-list-sekeleton';
import { StoreProductsList } from '@/features/products/components/store-products-list';
import { TagsNav } from './tags-nav';
import { getVirtualStoreProducts } from '@/features/products/actions/virtual-products-actions';
import { VirtualProductCard } from '@/features/products/components/product-cards/virtual-product-card';
import VSFooter from '@/features/products/components/virtual-shop/footer';
import VerticalCarousel from '@/features/products/components/virtual-shop/VerticalCrousel';
import ReviewsSection from '@/features/products/components/virtual-shop/Reviews';

async function page({
    params,
    // searchParams
}: {
    params: Promise<{ currentStoreId: string }>;
    // searchParams: Promise<SearchParams>;
}) {
    const { currentStoreId } = await params;
    // const filters = await searchParams;

    const store = await getVirtualStoreById(currentStoreId);
    const storeProducts = await getVirtualStoreProducts({ virtualStoreId: currentStoreId, limit: 6, withStoreData: true });

    if (!store) return <h3 className='text-3xl'>store with id: {currentStoreId} is not found.</h3>;

    return (
        <>
            <TagsNav />
            <section className="main-container p-2">
                <div className="container mx-auto">
                    <div className="flex md:flex-row flex-col gap-5 my-5">
                        <div className="md:w-fit flex md:flex-col sm:flex-row flex-col w-full gap-5">
                            <div className="w-fit">
                                {storeProducts &&
                                    <Suspense fallback={<ProductSekeleton />}>
                                        <VirtualProductCard
                                            product={storeProducts.documents[0]}
                                            storeId={currentStoreId}
                                        />
                                    </Suspense>
                                }
                            </div>
                            <div className="w-fit">
                                {storeProducts &&
                                    <Suspense fallback={<ProductSekeleton />}>
                                        <VirtualProductCard
                                            product={storeProducts.documents[0]}
                                            storeId={currentStoreId}
                                        />
                                    </Suspense>
                                }
                            </div>
                        </div>
                        <div className="w-full ">
                            <div className="md:shadow-lg shadow-md border rounded-lg w-full">
                                <VerticalCarousel />
                            </div>
                            <ReviewsSection />
                        </div>
                    </div>

                    <div className="py-5">
                        <h4 className="text-2xl font-bold text-center">Heading 4</h4>
                    </div>
                    <div className="container mx-auto">
                        <Suspense fallback={<ProductListSkeleton />}>
                            <StoreProductsList storeId={store.$id} />
                        </Suspense>
                    </div>
                    <div className="relative w-full min-h-[500px] overflow-hidden rounded-lg shadow-lg  mt-12">
                        <div className="absolute inset-0">
                            <img src="https://images.pexels.com/photos/953864/pexels-photo-953864.jpeg" alt="დუბროვნიკი" className="w-full h-full object-cover" />
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
                                        <button className="bg-green-400 dark:bg-green-400 text-white px-6 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors">
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
                <div className="container mx-auto flex rounded-lg">
                    <div className="flex-col sm:flex py-3 w-full">
                        <input type="text" placeholder="Enter your email" className="bg-white border rounded-l-lg text-black p-4 w-full" />
                    </div>
                    <div className="flex items-center md:w-1/3 sm:w-1/2  border border-solid border-gray-300 px-2 my-3">
                        <input checked id="checked-checkbox" type="checkbox" value="" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                        <label htmlFor="checked-checkbox" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">I agree to recieve notifications</label>
                    </div>
                    <div className="flex py-3">
                        <button className="bg-green-600 hover:bg-green-400 text-white py-2 px-8 w-full rounded-r-lg text-sm">Subscribe</button>
                    </div>
                </div>
            </section>
            <VSFooter />
        </>
    );
}

export default page;