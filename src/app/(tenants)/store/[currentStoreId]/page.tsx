import { StoreCarousel } from '@/features/stores/components/store-carousel';
import React, { Suspense } from 'react';
import { getVirtualStoreById } from '@/lib/actions/vitual-store.action';
import { ProductListSkeleton, ProductSekeleton } from '@/features/products/components/products-list-sekeleton';
import { StoreProductsList } from '@/features/products/components/store-products-list';
import { Skeleton } from '@/components/ui/skeleton';
import { TagsNav } from './tags-nav';
import { getVirtualStoreProducts } from '@/features/products/actions/virtual-products-actions';
import { VirtualProductCard } from '@/features/products/components/product-cards/virtual-product-card';

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
            <TagsNav />
            <section className="main-container p-2">
                <div className="container mx-auto">
                    <div className="flex md:flex-row flex-col gap-5 my-5">
                        <div className="md:w-fit flex md:flex-col sm:flex-row flex-col w-full gap-5">
                            <div className="w-fit">
                                {storeProducts && 
                                        <Suspense key={storeProducts.documents[1].$id} fallback={<ProductSekeleton />}>
                                          <VirtualProductCard
                                            product={storeProducts.documents[1]}
                                            storeId={currentStoreId}
                                          />
                                        </Suspense>
                                      }
                            </div>
                            <div className="w-fit">
                                {storeProducts && 
                                        <Suspense key={storeProducts.documents[1].$id} fallback={<ProductSekeleton />}>
                                          <VirtualProductCard
                                            product={storeProducts.documents[1]}
                                            storeId={currentStoreId}
                                          />
                                        </Suspense>
                                      }
                            </div>
                        </div>
                        <div className="w-full md:shadow-lg shadow-md rounded-lg w-full">
                            <section className=" w-full py-9 bg-md px-8 ">
                                <div className="mx-auto flex  flex-col items-center lg:flex-row justify-center gap-10 py-40 max-w-[1440px] bg-no-repeat ">
                                    <div className="w-[660px]  flex-col justify-center items-start gap-20 inline-flex">
                                    <div className="self-stretch  flex-col justify-start items-start gap-5 flex">
                                        <h1 className="self-stretch">
                                        <span className="text-gray-400 text-5xl font-bold font-['Roboto']">Redefining Motion:</span><span className="text-[#3e9d26] text-5xl font-bold font-['Roboto']">The Future of Footwear is Here</span>
                                        </h1>
                                        <p className="self-stretch text-gray-400 text-xl font-normal font-['Roboto']">Experience unparalleled comfort and
                                        innovative design with our state-of-the-art, futuristic sports shoes. Built for champions, designed for you.
                                        </p>
                                    </div>
                                    <div className="justify-start items-center gap-5 inline-flex">
                                        <div className="justify-start items-center gap-2.5 flex">
                                        <p className="text-gray-400 text-sm font-normal font-['Roboto']">Step into the Future</p>
                                        <div data-svg-wrapper="true" className="relative"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M20.7806 12.5306L14.0306 19.2806C13.8899 19.4213 13.699 19.5004 13.5 19.5004C13.301 19.5004 13.1101 19.4213 12.9694 19.2806C12.8286 19.1399 12.7496 18.949 12.7496 18.75C12.7496 18.551 12.8286 18.3601 12.9694 18.2194L18.4397 12.75H3.75C3.55109 12.75 3.36032 12.671 3.21967 12.5303C3.07902 12.3897 3 12.1989 3 12C3 11.8011 3.07902 11.6103 3.21967 11.4697C3.36032 11.329 3.55109 11.25 3.75 11.25H18.4397L12.9694 5.78061C12.8286 5.63988 12.7496 5.44901 12.7496 5.24999C12.7496 5.05097 12.8286 4.8601 12.9694 4.71936C13.1101 4.57863 13.301 4.49957 13.5 4.49957C13.699 4.49957 13.8899 4.57863 14.0306 4.71936L20.7806 11.4694C20.8504 11.539 20.9057 11.6217 20.9434 11.7128C20.9812 11.8038 21.0006 11.9014 21.0006 12C21.0006 12.0986 20.9812 12.1961 20.9434 12.2872C20.9057 12.3782 20.8504 12.461 20.7806 12.5306Z"
                                                fill="gray"></path>
                                            </svg></div>
                                        </div>
                                        <button className="px-8 py-2.5 bg-[#3e9d26] rounded-[10px] justify-center items-center gap-2.5 flex text-white text-sm font-semibold font-['Roboto']">Shop Now</button>
                                    </div>
                                    </div><img className="w-full max-w-[400px]" src="https://iili.io/338c9je.png" alt=""/>
                                </div>
                                </section>
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
            </section>
            <div className="container mx-auto flex rounded-lg">
                <div className="flex py-3 w-full">
                    <input type="text" placeholder="Enter your email" className="bg-white border rounded-l-lg text-black p-4 w-full" />
                </div>
                <div className="flex py-3">
                    <button className="bg-green-600 text-white py-2 px-8 w-full rounded-r-lg text-sm">Subscribe</button>
                </div>
            </div>
            <footer className="px-3 pt-4 lg:px-9 border-t-2 bg-gray-50">
                <div className="grid gap-10 row-gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="sm:col-span-2">
                        <a href="#" className="inline-flex items-center">
                            <img src="https://mcqmate.com/public/images/logos/60x60.png" alt="logo" className="h-8 w-8"/>
                            <span className="ml-2 text-xl font-bold tracking-wide text-gray-800">Company Name</span>
                        </a>
                        <div className="mt-6 lg:max-w-xl">
                            <p className="text-sm text-gray-800">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi felis mi, faucibus dignissim lorem
                                id, imperdiet interdum mauris. Vestibulum ultrices sed libero non porta. Vivamus malesuada urna eu
                                nibh malesuada, non finibus massa laoreet. Nunc nisi velit, feugiat a semper quis, pulvinar id
                                libero. Vivamus mi diam, consectetur non orci ut, tincidunt pretium justo. In vehicula porta
                                molestie. Suspendisse potenti. 
                                </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm">
                        <p className="text-base font-bold tracking-wide text-gray-900">Popular Categories</p>
                        <a href="#">Footwear</a>
                        <a href="#">T-shirts</a>
                        <a href="#">Bags</a>
                        <p className="text-base font-bold tracking-wide text-gray-900">Popular Collections</p>
                        <a href="#">Chrismass</a>
                        <a href="#">Summer wear</a>
                        <a href="#">Party Clothes</a>
                    </div>

                    <div>
                        <p className="text-base font-bold tracking-wide text-gray-900">COMPANY's Social Medias</p>
                        <div className="flex items-center gap-1 px-2">
                            <a href="#" className="w-full min-w-xl">
                                <img src="https://mcqmate.com/public/images/icons/playstore.svg" alt="Playstore Button"
                                    className="h-10"/>
                            </a>
                            <a className="w-full min-w-xl" href="https://www.youtube.com/channel/UCo8tEi6SrGFP8XG9O0ljFgA">
                                <img src="https://mcqmate.com/public/images/icons/youtube.svg" alt="Youtube Button"
                                    className="h-28"/>
                            </a>
                        </div>
                        <p className="text-base font-bold tracking-wide text-gray-900">Contacts</p>
                        <div className="flex">
                            <p className="mr-1 text-gray-800">Email:</p>
                            <a href="#" title="send email">Owner@company.com</a>
                        </div>
                    </div>

                </div>

                <div className="flex flex-col-reverse justify-between pt-5 pb-10 border-t lg:flex-row">
                    <p className="text-sm text-gray-600">© Copyright 2023 Company. All rights reserved.</p>
                    <ul className="flex flex-col mb-3 space-y-2 lg:mb-0 sm:space-y-0 sm:space-x-5 sm:flex-row">
                        <li>
                            <a href="#"
                                className="text-sm text-gray-600 transition-colors duration-300 hover:text-deep-purple-accent-400">Privacy
                                &amp; Cookies Policy
                            </a>
                        </li>
                        <li>
                            <a href="#"
                                className="text-sm text-gray-600 transition-colors duration-300 hover:text-deep-purple-accent-400">Disclaimer
                            </a>
                        </li>
                    </ul>
                </div>

            </footer>
        </>
    );
}

export default page;