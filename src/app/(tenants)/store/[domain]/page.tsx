import { StoreCarousel } from '@/components/store-carousel';
import { Separator } from '@/components/ui/separator';
import { Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import productSample from '../../../../../public/images/logo2.png'

function page() {
    return (
        <>
            <StoreCarousel />
            <section className='main-container mt-2'>
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

            <div className="mt-12 flex gap-x-8 gap-y-16 justify-between flex-wrap">
                <Link
                    href={"/"}
                    className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
                >
                    <div className="relative w-full h-80">
                        <Image
                            src={productSample}
                            alt=""
                            fill
                            sizes="25vw"
                            className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
                        />
                        {/* {product.media?.items && (
                            <Image
                                src={product.media?.items[1]?.image?.url || "/product.png"}
                                alt=""
                                fill
                                sizes="25vw"
                                className="absolute object-cover rounded-md"
                            />
                        )} */}
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">product name</span>
                        <span className="font-semibold">$50</span>
                    </div>
                    {/* {product.additionalInfoSections && (
                        <div
                            className="text-sm text-gray-500"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                    product.additionalInfoSections.find(
                                        (section: any) => section.title === "shortDesc"
                                    )?.description || ""
                                ),
                            }}
                        ></div>
                    )} */}
                    <button className="rounded-2xl ring-1 ring-[#F35C7A] text-[#F35C7A] w-max py-2 px-4 text-xs hover:bg-[#F35C7A] hover:text-white">
                        Add to Cart
                    </button>
                </Link>
            </div>
        </>
    );
}

export default page;