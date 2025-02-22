"use client";

import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

export function StoreCarousel() {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    const plugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true })
    );

    const images = [
        "https://images.pexels.com/photos/5872364/pexels-photo-5872364.jpeg",
        "https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg",
        "https://images.pexels.com/photos/5872176/pexels-photo-5872176.jpeg",
        "https://images.pexels.com/photos/7987589/pexels-photo-7987589.jpeg",
        "https://images.pexels.com/photos/5625011/pexels-photo-5625011.jpeg",
    ];

    useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const scrollTo = (index: number) => {
        plugin.current.stop();
        api?.scrollTo(index);
    };

    const handleNavigation = (direction: 'prev' | 'next') => {
        plugin.current.stop();
        if (direction === 'prev') {
            api?.scrollPrev();
        } else {
            api?.scrollNext();
        }
    };

    return (
        <div className="relative w-full">
            <Carousel
                setApi={setApi}
                plugins={[plugin.current]}
                className="w-full h-max"
                // onMouseEnter={plugin.current.stop}
                // onMouseLeave={plugin.current.reset}
                opts={{
                    align: "center",
                    loop: true,
                    duration: 50,
                    dragFree: false,
                    skipSnaps: false,
                    inViewThreshold: 0.7,
                    startIndex: 0,
                }}
            >
                <CarouselContent className="h-[50vh]">
                    {images.map((image, index) => (
                        <CarouselItem key={index}>
                            <div className="relative aspect-[16/9] w-full h-full">
                                <Image
                                    src={image}
                                    alt={`Hero image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    priority={index === 0}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious
                    onClick={() => handleNavigation('prev')}
                    className="left-4"
                />
                <CarouselNext
                    onClick={() => handleNavigation('next')}
                    className="right-4"
                />
            </Carousel>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {Array.from({ length: count }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={`h-2 w-2 rounded-full transition-all ${index === current
                            ? 'bg-white w-4'
                            : 'bg-white/50 hover:bg-white/75'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}