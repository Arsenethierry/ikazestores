"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroCarouselProps {
    banners: string[];
    storeName: string;
    autoplayDelay?: number;
}

export const ModernHeroCarousel = ({
    banners,
    storeName,
    autoplayDelay = 5000,
}: HeroCarouselProps) => {
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
        return (
            <div className="relative w-full h-[500px] bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                    <h2 className="text-4xl font-bold mb-4">Welcome to {storeName}</h2>
                    <p className="text-xl opacity-80">Discover amazing products</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[500px] rounded-lg overflow-hidden group">
            <div className="relative w-full h-full">
                {banners.map((banner, index) => (
                    <div
                        key={index}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-700 ease-in-out",
                            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                        )}
                    >
                        <Image
                            src={banner}
                            alt={`${storeName} Banner ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                            loading={index === 0 ? "eager" : "lazy"}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                        />
                    </div>
                ))}
            </div>

            {banners.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={goToPrevious}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={goToNext}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </>
            )}

            {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                index === currentIndex
                                    ? "w-8 bg-white"
                                    : "w-2 bg-white/50 hover:bg-white/75"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};