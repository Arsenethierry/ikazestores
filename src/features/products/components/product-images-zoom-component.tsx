"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BoltIcon, Loader2, ShoppingCart, ShoppingCartIcon } from 'lucide-react';
import Image from 'next/image';
import { EasyZoomOnHover, EasyZoomOnMove } from "easy-magnify";
import { useMedia } from 'react-use';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { VirtualProductTypes } from '@/lib/types';
interface ProductImagesZoomComponentProps {
    productImages: string[];
    productTitle: string;
    product: VirtualProductTypes
}

const useImagePreloader = (images: string[]) => {
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

    const preloadImage = useCallback((src: string) => {
        if (loadedImages.has(src) || loadingImages.has(src)) return;

        setLoadingImages(prev => new Set(prev).add(src));

        const img = new window.Image();
        img.onload = () => {
            setLoadedImages(prev => new Set(prev).add(src));
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(src);
                return newSet;
            });
        };
        img.onerror = () => {
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(src);
                return newSet;
            });
        };
        img.src = src;
    }, [loadedImages, loadingImages]);

    return { loadedImages, loadingImages, preloadImage };
};

export const ProductImagesZoomComponent = ({
    productImages,
    productTitle,
    product
}: ProductImagesZoomComponentProps) => {
    const [selectedImage, setSelectedImage] = useState(0);
    const [imageLoadError, setImageLoadError] = useState<Set<number>>(new Set());
    const isDesktop = useMedia('(min-width: 480px)');

    const { loadedImages, loadingImages, preloadImage } = useImagePreloader(productImages);

    useEffect(() => {
        productImages.forEach((img, index) => {
            if (index === 0) {
                preloadImage(img);
            } else {
                setTimeout(() => preloadImage(img), index * 100);
            }
        });
    }, [productImages, preloadImage]);

    useEffect(() => {
        const preloadAdjacent = () => {
            const adjacentIndexes = [
                selectedImage - 1,
                selectedImage + 1,
                selectedImage - 2,
                selectedImage + 2
            ].filter(index => index >= 0 && index < productImages.length);

            adjacentIndexes.forEach(index => {
                preloadImage(productImages[index]);
            });
        };

        const timeoutId = setTimeout(preloadAdjacent, 50);
        return () => clearTimeout(timeoutId);
    }, [selectedImage, productImages, preloadImage]);

    const handleImageSelect = useCallback((index: number) => {
        setSelectedImage(index);
        preloadImage(productImages[index]);
    }, [productImages, preloadImage]);

    const handleImageError = useCallback((index: number) => {
        setImageLoadError(prev => new Set(prev).add(index));
    }, []);

    const currentImageData = useMemo(() => ({
        src: productImages[selectedImage],
        alt: `${productTitle} - view ${selectedImage + 1}`,
        isLoaded: loadedImages.has(productImages[selectedImage]),
        isLoading: loadingImages.has(productImages[selectedImage]),
        hasError: imageLoadError.has(selectedImage)
    }), [productImages, selectedImage, productTitle, loadedImages, loadingImages, imageLoadError]);

    const ThumbnailImage = React.memo(({
        src,
        index,
        isSelected,
        onClick
    }: {
        src: string;
        index: number;
        isSelected: boolean;
        onClick: () => void;
    }) => {
        const [thumbnailError, setThumbnailError] = useState(false);
        const isLoaded = loadedImages.has(src);
        const isLoading = loadingImages.has(src);

        return (
            <div
                className={`relative border-2 min-w-[60px] h-[60px] cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                onClick={onClick}
            >
                {!thumbnailError ? (
                    <>
                        <Image
                            src={src}
                            alt={`${productTitle} - thumbnail ${index + 1}`}
                            width={60}
                            height={60}
                            className={`object-cover w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            onError={() => setThumbnailError(true)}
                            priority={index < 2}
                            quality={75}
                            sizes="60px"
                        />
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Error</span>
                    </div>
                )}
            </div>
        );
    });

    const MainImageDisplay = () => {
        if (currentImageData.hasError) {
            return (
                <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-500">Failed to load image</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setImageLoadError(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(selectedImage);
                                    return newSet;
                                });
                                preloadImage(currentImageData.src);
                            }}
                            className="mt-2"
                        >
                            Retry
                        </Button>
                    </div>
                </div>
            );
        }

        const ZoomComponent = isDesktop ? EasyZoomOnHover : EasyZoomOnMove;

        return (
            <div className="relative">
                {!currentImageData.isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                )}

                <div className={`transition-opacity duration-300 ${currentImageData.isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <ZoomComponent
                        mainImage={{
                            src: currentImageData.src,
                            alt: currentImageData.alt,
                            width: 500,
                            height: 500
                        }}
                        zoomImage={{
                            src: currentImageData.src,
                            alt: `${currentImageData.alt} - Zoomed`,
                        }}
                        {...(isDesktop && {
                            zoomContainerHeight: 500,
                            zoomContainerWidth: 500
                        })}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className='space-y-4 sticky top-[100px]'>
            <Card className='p-4 flex flex-col md:flex-row gap-4 border-none shadow-none'>
                <div className="md:min-w-16 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300">
                    {productImages.map((img, index) => (
                        <ThumbnailImage
                            key={`${img}-${index}`}
                            src={img}
                            index={index}
                            isSelected={selectedImage === index}
                            onClick={() => handleImageSelect(index)}
                        />
                    ))}
                </div>

                <div className="flex-1 min-h-[400px] md:min-h-[500px]">
                    <MainImageDisplay />
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
                <AddToCartButton
                    item={product}
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    showText={true}
                    text="Add To Cart"
                    iconSize="h-5 w-5"
                    showTooltip={false}
                />
                <Button className="flex-1" variant={'teritary'} size="lg">
                    <BoltIcon className="mr-2 h-5 w-5" /> BUY NOW
                </Button>
            </div>

            <div className="hidden">
                {productImages.map((img, index) => (
                    <Image
                        key={`preload-${img}-${index}`}
                        src={img}
                        alt=""
                        width={1}
                        height={1}
                        priority={index < 3}
                        onError={() => handleImageError(index)}
                    />
                ))}
            </div>
        </div>
    );
}