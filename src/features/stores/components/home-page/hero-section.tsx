"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useGetCollectionsByStoreId } from "@/hooks/queries/use-products-collections";
import { CollectionTypes } from "@/lib/types";
import Link from "next/link";

interface CarouselItem {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    buttonText: string;
    imageSrc: string;
    imageAlt: string;
    priority?: boolean;
}

interface AdItem {
    id: string;
    title: string;
    subtitle: string;
    imageSrc: string;
    imageAlt: string;
    buttonText: string;
    badgeText?: string;
    badgeColor?: string;
}
interface HeroSectionProps {
    autoPlay?: boolean;
    autoPlayInterval?: number;
    className?: string;
    onSlideChange?: (index: number) => void;
    onItemClick?: (item: CarouselItem) => void;
    onAdClick?: (item: AdItem) => void;
    storeId: string;
}

const adItems: AdItem[] = [
    {
        id: 'ad1',
        title: 'Premium Headphones',
        subtitle: 'Wireless Audio',
        imageSrc: 'https://images.pexels.com/photos/3945685/pexels-photo-3945685.jpeg?auto=compress&cs=tinysrgb&w=400',
        imageAlt: 'Wireless headphones',
        buttonText: 'Shop Now',
        badgeText: '20% OFF',
        badgeColor: 'bg-red-500'
    },
    {
        id: 'ad2',
        title: 'Smart Watch',
        subtitle: 'Health & Fitness',
        imageSrc: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400',
        imageAlt: 'Smart watch',
        buttonText: 'Explore',
        badgeText: 'NEW',
        badgeColor: 'bg-green-500'
    },
    {
        id: 'ad3',
        title: 'Designer Bags',
        subtitle: 'Luxury Collection',
        imageSrc: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
        imageAlt: 'Designer handbags',
        buttonText: 'View All',
        badgeText: 'TRENDING',
        badgeColor: 'bg-purple-500'
    },
    {
        id: 'ad4',
        title: 'Gaming Setup',
        subtitle: 'Pro Equipment',
        imageSrc: 'https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=400',
        imageAlt: 'Gaming setup',
        buttonText: 'Shop Gaming',
        badgeText: 'HOT',
        badgeColor: 'bg-orange-500'
    }
];

const CarouselSkeleton = memo(() => (
    <div className="relative w-full h-full">
        <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
        <div className="absolute z-30 flex flex-col -translate-y-1/2 top-1/2 right-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="w-3 h-3 rounded-full" />
            ))}
        </div>
    </div>
));

CarouselSkeleton.displayName = 'CarouselSkeleton';

const CarouselError = memo<{ error: Error; onRetry: () => void }>(({ error, onRetry }) => (
    <div className="relative w-full h-full">
        <Alert variant="destructive" className="h-full flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 mb-4" />
            <AlertDescription className="text-center">
                <p className="font-medium mb-2">Failed to load carousel</p>
                <p className="text-sm mb-4">{error.message}</p>
                <Button onClick={onRetry} variant="outline" size="sm">
                    Try Again
                </Button>
            </AlertDescription>
        </Alert>
    </div>
));

CarouselError.displayName = 'CarouselError';

const CarouselSlide = memo<{
    item: CarouselItem;
    isActive: boolean;
    onItemClick?: (item: CarouselItem) => void;
}>(({ item, isActive }) => (
    <div
        className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            isActive ? "opacity-100" : "opacity-0"
        )}
        aria-hidden={!isActive}
    >
        <div className="relative h-full w-full overflow-hidden rounded-lg">
            <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                fill
                className="object-cover"
                priority={item.priority}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 70vw, 60vw"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center text-white max-w-2xl">
                    <h2 className="text-3xl lg:text-5xl font-bold mb-4">
                        {item.title}
                    </h2>
                    <p className="text-xl lg:text-2xl mb-2 text-yellow-300">
                        {item.subtitle}
                    </p>
                    <p className="text-base lg:text-lg mb-8 opacity-90">
                        {item.description}
                    </p>
                    <Link
                        href={`/collections/${item.id}`}

                        className={buttonVariants()}
                    >
                        {item.buttonText}
                    </Link>
                </div>
            </div>
        </div>
    </div>
));

CarouselSlide.displayName = 'CarouselSlide';

const NavigationButton = memo<{
    direction: 'up' | 'down';
    onClick: () => void;
    className?: string;
}>(({ direction, onClick, className }) => (
    <Button
        variant="ghost"
        size="icon"
        className={cn(
            "absolute left-1/2 transform -translate-x-1/2 z-30 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 focus:ring-4 focus:ring-yellow-500 transition-all duration-300",
            className
        )}
        onClick={onClick}
        aria-label={`${direction === 'up' ? 'Previous' : 'Next'} slide`}
    >
        {direction === 'up' ? (
            <ChevronUp className="w-6 h-6 text-white" />
        ) : (
            <ChevronDown className="w-6 h-6 text-white" />
        )}
    </Button>
));

NavigationButton.displayName = 'NavigationButton';

const AdCard = memo<{
    item: AdItem;
    onAdClick?: (item: AdItem) => void;
}>(({ item, onAdClick }) => (
    <div className="relative h-full w-full overflow-hidden rounded-lg group cursor-pointer transition-transform duration-300 hover:scale-105">
        <Image
            src={item.imageSrc}
            alt={item.imageAlt}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {item.badgeText && (
            <div className={cn("absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white", item.badgeColor)}>
                {item.badgeText}
            </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-bold text-lg mb-1">{item.title}</h3>
            <p className="text-sm opacity-90 mb-3">{item.subtitle}</p>
            <Button
                onClick={() => onAdClick?.(item)}
                size="sm"
                className="bg-white text-black hover:bg-gray-100 font-semibold text-xs px-4 py-2"
            >
                {item.buttonText}
            </Button>
        </div>
    </div>
));

AdCard.displayName = 'AdCard';

const MainCarousel = memo<{
    items: CarouselItem[];
    currentIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onGoToSlide: (index: number) => void;
    autoPlay: boolean;
    autoPlayInterval: number;
    isHovered: boolean;
}>(({ items, currentIndex, onNext, onPrev, onGoToSlide, autoPlay, autoPlayInterval, isHovered }) => {
    useEffect(() => {
        if (!autoPlay || isHovered || items.length <= 1) return;
        const interval = setInterval(onNext, autoPlayInterval);
        return () => clearInterval(interval);
    }, [autoPlay, autoPlayInterval, isHovered, onNext, items.length]);

    return (
        <div className="relative h-full w-full">
            {items.map((item, index) => (
                <CarouselSlide
                    key={item.id}
                    item={item}
                    isActive={index === currentIndex}
                />
            ))}

            <div className="absolute z-30 flex flex-col -translate-y-1/2 top-1/2 right-5 space-y-3">
                {items.map((_, index) => (
                    <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "w-3 h-3 rounded-full p-0 transition-all duration-300",
                            index === currentIndex
                                ? "bg-yellow-500 scale-110"
                                : "bg-white/50 hover:bg-white/70"
                        )}
                        aria-current={index === currentIndex}
                        aria-label={`Go to slide ${index + 1}`}
                        onClick={() => onGoToSlide(index)}
                    />
                ))}
            </div>

            <NavigationButton
                direction="up"
                onClick={onPrev}
                className="top-4"
            />

            <NavigationButton
                direction="down"
                onClick={onNext}
                className="bottom-4"
            />

            {autoPlay && !isHovered && (
                <div className="absolute bottom-2 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-100 ease-linear"
                        style={{
                            width: `${((currentIndex + 1) / items.length) * 100}%`
                        }}
                    />
                </div>
            )}
        </div>
    );
});

MainCarousel.displayName = 'MainCarousel';

const HeroSection: React.FC<HeroSectionProps> = ({
    autoPlay = true,
    autoPlayInterval = 5000,
    className = '',
    onAdClick,
    onSlideChange,
    storeId
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const {
        data: collections,
        isLoading,
        error,
        refetch
    } = useGetCollectionsByStoreId({
        storeId,
        featured: true,
        limit: 5
    });

    const items = useMemo(() => {
        if (!collections?.documents) return [];

        return collections.documents.map((collection: CollectionTypes, index: number) => ({
            id: collection.$id,
            title: collection.heroTitle || collection.collectionName,
            subtitle: collection.heroSubtitle || collection.description,
            description: collection?.heroDescription || collection?.description || '',
            buttonText: collection.heroButtonText || 'Shop Now',
            imageSrc: collection.heroImageUrl || collection.bannerImageUrl,
            imageAlt: collection.collectionName,
            priority: index === 0
        })) as CarouselItem[];
    }, [collections]);

    const goToNext = useCallback(() => {
        const newIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
        onSlideChange?.(newIndex);
    }, [currentIndex, items.length, onSlideChange]);

    const goToPrev = useCallback(() => {
        const newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
        onSlideChange?.(newIndex);
    }, [currentIndex, items.length, onSlideChange]);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
        onSlideChange?.(index);
    }, [onSlideChange]);

    const handleAdClick = useCallback((item: AdItem) => {
        onAdClick?.(item);
    }, [onAdClick]);

    useEffect(() => {
        if (items.length > 0 && currentIndex >= items.length) {
            setCurrentIndex(0);
        }
    }, [items.length, currentIndex]);

    if (isLoading) {
        return (
            <section className={cn("w-full py-8", className)}>
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
                        <div className="lg:col-span-2">
                            <CarouselSkeleton />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-full w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={cn("w-full py-8", className)}>
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
                        <div className="lg:col-span-2">
                            <CarouselError error={error} onRetry={() => refetch()} />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                            {adItems.map((item) => (
                                <AdCard key={item.id} item={item} onAdClick={handleAdClick} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (!items || items.length === 0) {
        return (
            <section className={cn("w-full py-8", className)}>
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
                        <div className="lg:col-span-2">
                            <Alert className="h-full flex flex-col items-center justify-center">
                                <AlertDescription>
                                    <p className="text-muted-foreground">No featured collections available</p>
                                </AlertDescription>
                            </Alert>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                            {adItems.map((item) => (
                                <AdCard key={item.id} item={item} onAdClick={handleAdClick} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className={cn("w-full py-8", className)}>
            <div className="px-3 lg:px-9 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
                    <div
                        className="lg:col-span-2 h-full"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        role="region"
                        aria-label="Hero carousel"
                        aria-live="polite"
                    >
                        <MainCarousel
                            items={items}
                            currentIndex={currentIndex}
                            onNext={goToNext}
                            onPrev={goToPrev}
                            onGoToSlide={goToSlide}
                            autoPlay={autoPlay}
                            autoPlayInterval={autoPlayInterval}
                            isHovered={isHovered}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-full">
                        {adItems.map((item) => (
                            <AdCard key={item.id} item={item} onAdClick={handleAdClick} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default memo(HeroSection);