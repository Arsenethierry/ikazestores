"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BoltIcon, ShoppingCartIcon } from 'lucide-react';
import Image from 'next/image';
import { EasyZoomOnHover, EasyZoomOnMove } from "easy-magnify";
import { useMedia } from 'react-use';

export const ProductImagesZoomComponent = ({
    productImages,
    productTitle
}: {
    productImages: string[],
    productTitle: string
}) => {
    const [selectedImage, setSelectedImage] = useState(0);
    const isDesktop = useMedia('(min-width: 480px)');

    return (
        <div className='space-y-4 sticky top-[100px]'>
            <Card className='p-4 flex flex-col md:flex-row gap-4 border-none shadow-none'>
                <div className="md:min-w-16 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
                    {productImages.map((img, index) => (
                        <div
                            key={index}
                            className={`border-2 min-w-[60px] cursor-pointer ${selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                                }`}
                            onClick={() => setSelectedImage(index)}
                        >
                            <Image
                                src={img}
                                alt={`${productTitle} - view ${index + 1}`}
                                width={60}
                                height={60}
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
                {isDesktop ? (
                    <EasyZoomOnHover
                        mainImage={{
                            src: productImages[selectedImage],
                            alt: "My Product",
                            width: 500,
                            height: 500
                        }}
                        zoomImage={{
                            src: productImages[selectedImage],
                            alt: "My Product Zoom",
                        }}
                        zoomContainerHeight={500}
                        zoomContainerWidth={500}
                    />
                ) : (
                    <EasyZoomOnMove
                        mainImage={{
                            src: productImages[selectedImage],
                            alt: "My Product",
                            width: 500,
                            height: 500
                        }}
                        zoomImage={{
                            src: productImages[selectedImage],
                            alt: "My Product Zoom",
                        }}
                    />
                )}

            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1" size="lg">
                    <ShoppingCartIcon className="mr-2 h-5 w-5" /> ADD TO CART
                </Button>
                <Button className="flex-1" variant={'teritary'} size="lg">
                    <BoltIcon className="mr-2 h-5 w-5" /> BUY NOW
                </Button>
            </div>
        </div>
    );
}