"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroBanner {
    id: string;
    imageUrl: string;
    title: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundColor?: string;
}

interface FeaturedOffer {
    title: string;
    label: string;
    price: string;
    imageUrl: string;
    backgroundColor?: string;
}

interface DualHeroSectionProps {
    banners: HeroBanner[];
    featuredOffer?: FeaturedOffer;
    autoplayDelay?: number;
}

export const DualHeroSection = ({
    banners,
    featuredOffer,
    autoplayDelay = 5000,
}: DualHeroSectionProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, [banners.length]);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
    };

    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return;

        const interval = setInterval(goToNext, autoplayDelay);
        return () => clearInterval(interval);
    }, [isAutoPlaying, autoplayDelay, banners.length, goToNext]);

    if (!banners || banners.length === 0) {
        return null;
    }

    const currentBanner = banners[currentIndex];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Hero Carousel - Takes 2/3 width */}
            <div className="lg:col-span-2 relative h-[500px] rounded-lg overflow-hidden group">
                <div className="relative w-full h-full">
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id}
                            className={cn(
                                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                            )}
                            style={{ backgroundColor: banner.backgroundColor || '#f5f5f5' }}
                        >
                            <div className="relative w-full h-full flex items-center justify-center p-12">
                                {/* Text Content */}
                                <div className="absolute left-12 top-1/2 -translate-y-1/2 z-20 max-w-md space-y-6">
                                    {banner.subtitle && (
                                        <p className="text-lg font-medium text-gray-700">
                                            {banner.subtitle}
                                        </p>
                                    )}
                                    <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                                        {banner.title}
                                    </h2>
                                    {banner.ctaText && (
                                        <Button
                                            size="lg"
                                            className="rounded-full px-8"
                                            asChild
                                        >
                                            <a href={banner.ctaLink || '#'}>
                                                {banner.ctaText}
                                            </a>
                                        </Button>
                                    )}
                                </div>

                                {/* Product Image */}
                                <div className="relative w-full h-full">
                                    <Image
                                        src={banner.imageUrl}
                                        alt={banner.title}
                                        fill
                                        className="object-contain object-right"
                                        priority={index === 0}
                                        loading={index === 0 ? "eager" : "lazy"}
                                        sizes="(max-width: 1024px) 100vw, 66vw"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                {banners.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={goToPrevious}
                        >
                            <ChevronLeft className="h-6 w-6 text-gray-900" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={goToNext}
                        >
                            <ChevronRight className="h-6 w-6 text-gray-900" />
                        </Button>
                    </>
                )}

                {/* Dots Indicator */}
                {banners.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={cn(
                                    "h-2 rounded-full transition-all duration-300",
                                    index === currentIndex
                                        ? "w-8 bg-gray-900"
                                        : "w-2 bg-gray-400 hover:bg-gray-600"
                                )}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Featured Offer Card - Takes 1/3 width */}
            {featuredOffer && (
                <div
                    className="relative h-[500px] rounded-lg overflow-hidden p-8 flex flex-col justify-between"
                    style={{ backgroundColor: featuredOffer.backgroundColor || '#2c5f5d' }}
                >
                    {/* Offer Label */}
                    <div className="space-y-2">
                        <p className="text-sm text-white/80 font-medium">
                            {featuredOffer.label}
                        </p>
                        <h3 className="text-4xl font-bold text-white">
                            {featuredOffer.title}
                        </h3>
                        <p className="text-xl text-white font-semibold">
                            {featuredOffer.price}
                        </p>
                    </div>

                    {/* Product Image */}
                    <div className="relative flex-1 flex items-center justify-center">
                        <Image
                            src={featuredOffer.imageUrl}
                            alt={featuredOffer.title}
                            width={300}
                            height={300}
                            className="object-contain"
                            loading="lazy"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export const DualHeroSkeleton = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Hero Carousel Skeleton - 2/3 width */}
            <div className="lg:col-span-2 relative h-[500px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Skeleton className="absolute inset-0 w-full h-full" />

                {/* Text Content Skeleton */}
                <div className="absolute left-12 top-1/2 -translate-y-1/2 z-20 space-y-6">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-14 w-80" />
                    <Skeleton className="h-12 w-32 rounded-full" />
                </div>

                {/* Navigation Arrows Skeleton */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>

                {/* Dots Indicator Skeleton */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className={`h-2 rounded-full ${i === 0 ? 'w-8' : 'w-2'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Featured Offer Card Skeleton - 1/3 width */}
            <div className="relative h-[500px] rounded-lg overflow-hidden bg-teal-800/20 p-8 flex flex-col justify-between">
                {/* Offer Label Skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-4 w-24 bg-white/20" />
                    <Skeleton className="h-10 w-48 bg-white/20" />
                    <Skeleton className="h-6 w-36 bg-white/20" />
                </div>

                {/* Product Image Skeleton */}
                <div className="flex-1 flex items-center justify-center">
                    <Skeleton className="h-64 w-64 rounded-lg bg-white/20" />
                </div>
            </div>
        </div>
    );
};