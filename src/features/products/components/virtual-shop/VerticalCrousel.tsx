// components/VerticalCarousel.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ChevronUp, ChevronDown } from 'lucide-react';

// Types
interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  imageSrc: string;
  imageAlt: string;
}

interface VerticalCarouselProps {
  items?: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  height?: string;
  fetchItems?: () => Promise<CarouselItem[]>;
  queryKey?: string[];
}

// Sample data fetcher function
const fetchCarouselItems = async (): Promise<CarouselItem[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    {
      id: '1',
      title: 'Redefining Motion:',
      subtitle: 'The Future of Footwear is Here',
      description: 'Experience unparalleled comfort and innovative design with our state-of-the-art, futuristic sports shoes. Built for champions, designed for you.',
      buttonText: 'Shop Now',
      imageSrc: 'https://iili.io/338c9je.png',
      imageAlt: 'Futuristic sports shoes'
    },
    {
      id: '2',
      title: 'Innovation Meets Comfort:',
      subtitle: 'Next-Gen Athletic Performance',
      description: 'Revolutionary technology meets premium design in our latest collection. Engineered for athletes who demand excellence in every step.',
      buttonText: 'Explore Collection',
      imageSrc: 'https://iili.io/338c9je.png',
      imageAlt: 'Premium athletic shoes'
    },
    {
      id: '3',
      title: 'Step Beyond Limits:',
      subtitle: 'Where Style Meets Performance',
      description: 'Push your boundaries with footwear that adapts to your ambitions. Crafted with precision, designed for those who never settle.',
      buttonText: 'Discover More',
      imageSrc: 'https://iili.io/338c9je.png',
      imageAlt: 'Performance footwear'
    },
    {
      id: '4',
      title: 'Elevate Your Game:',
      subtitle: 'Advanced Footwear Technology',
      description: 'Transform your performance with cutting-edge materials and innovative design. Every detail engineered for maximum impact.',
      buttonText: 'Shop Collection',
      imageSrc: 'https://iili.io/338c9je.png',
      imageAlt: 'Advanced athletic shoes'
    },
    {
      id: '5',
      title: 'Future Forward:',
      subtitle: 'The Evolution of Athletic Wear',
      description: 'Experience the next generation of sports footwear. Where breakthrough technology meets uncompromising style and comfort.',
      buttonText: 'Get Started',
      imageSrc: 'https://iili.io/338c9je.png',
      imageAlt: 'Next-gen sports shoes'
    }
  ];
};

// Loading skeleton component
const CarouselSkeleton: React.FC = () => (
  <div className="relative w-full max-w-md mx-auto">
    <div className="relative h-96 overflow-hidden rounded-lg bg-gray-200 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
    </div>
    <div className="absolute z-30 flex flex-col -translate-y-1/2 top-1/2 right-5 space-y-3">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
      ))}
    </div>
  </div>
);

// Error component
const CarouselError: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="relative w-full max-w-md mx-auto">
    <div className="relative h-96 overflow-hidden rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
      <div className="text-center p-6">
        <div className="text-red-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-700 font-medium mb-2">Failed to load carousel</p>
        <p className="text-red-600 text-sm mb-4">{error.message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// Main carousel component
const VerticalCarousel: React.FC<VerticalCarouselProps> = ({
  items: propItems,
  autoPlay = true,
  autoPlayInterval = 4000,
  className = '',
  height = 'h-96',
  fetchItems = fetchCarouselItems,
  queryKey = ['carousel-items']
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // React Query for fetching carousel items
  const {
    data: fetchedItems,
    isLoading,
    error,
    refetch
  } = useQuery<CarouselItem[], Error>({
    queryKey,
    queryFn: fetchItems,
    enabled: !propItems, // Only fetch if items are not provided via props
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Use prop items or fetched items
  const items = propItems || fetchedItems || [];

  // Navigation functions
  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === items.length - 1 ? 0 : prevIndex + 1
    );
  }, [items.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? items.length - 1 : prevIndex - 1
    );
  }, [items.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isHovered || items.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isHovered, goToNext, items.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          goToPrev();
          break;
        case 'ArrowDown':
          event.preventDefault();
          goToNext();
          break;
        case 'Home':
          event.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          event.preventDefault();
          goToSlide(items.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, goToSlide, items.length]);

  // Loading state
  if (isLoading) {
    return <CarouselSkeleton />;
  }

  // Error state
  if (error) {
    return <CarouselError error={error} onRetry={() => refetch()} />;
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
        <div className={`relative ${height} overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center`}>
          <p className="text-gray-500">No carousel items available</p>
        </div>
    );
  }

  return (
    <div 
      className={`relative w-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Product carousel"
      aria-live="polite"
    >
      {/* Carousel wrapper */}
      <div className={`relative ${height} overflow-hidden`}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={index !== currentIndex}
          >
            <div className="w-full md:shadow-lg shadow-md rounded-lg w-full h-full">
              <section className="w-full py-9 bg-md px-8 h-full">
                <div className="mx-auto flex flex-col items-center lg:flex-row justify-center gap-10 py-40 max-w-[1440px] bg-no-repeat h-full">
                  <div className="flex-col justify-center items-start gap-20 inline-flex">
                    <div className="self-stretch flex-col justify-start items-start gap-5 flex">
                      <h1 className="self-stretch">
                        <span className="text-gray-400 md:text-4xl sm:text-2xl font-bold font-['Roboto']">
                          {item.title}
                        </span>
                        <br />
                        <span className="text-[#3e9d26] text-4xl sm:text-2xl font-bold font-['Roboto']">
                          {item.subtitle}
                        </span>
                      </h1>
                      <p className="self-stretch text-gray-400 text-xl font-normal font-['Roboto']">
                        {item.description}
                      </p>
                    </div>
                    <div className="justify-start items-center gap-5 inline-flex">
                      <div className="justify-start items-center gap-2.5 flex">
                        <p className="text-gray-400 text-sm font-normal font-['Roboto']">
                          Step into the Future
                        </p>
                        <div data-svg-wrapper="true" className="relative">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M20.7806 12.5306L14.0306 19.2806C13.8899 19.4213 13.699 19.5004 13.5 19.5004C13.301 19.5004 13.1101 19.4213 12.9694 19.2806C12.8286 19.1399 12.7496 18.949 12.7496 18.75C12.7496 18.551 12.8286 18.3601 12.9694 18.2194L18.4397 12.75H3.75C3.55109 12.75 3.36032 12.671 3.21967 12.5303C3.07902 12.3897 3 12.1989 3 12C3 11.8011 3.07902 11.6103 3.21967 11.4697C3.36032 11.329 3.55109 11.25 3.75 11.25H18.4397L12.9694 5.78061C12.8286 5.63988 12.7496 5.44901 12.7496 5.24999C12.7496 5.05097 12.8286 4.8601 12.9694 4.71936C13.1101 4.57863 13.301 4.49957 13.5 4.49957C13.699 4.49957 13.8899 4.57863 14.0306 4.71936L20.7806 11.4694C20.8504 11.539 20.9057 11.6217 20.9434 11.7128C20.9812 11.8038 21.0006 11.9014 21.0006 12C21.0006 12.0986 20.9812 12.1961 20.9434 12.2872C20.9057 12.3782 20.8504 12.461 20.7806 12.5306Z"
                              fill="gray"
                            />
                          </svg>
                        </div>
                      </div>
                      <button className="px-8 py-2.5 bg-[#3e9d26] rounded-[10px] justify-center items-center gap-2.5 flex text-white text-sm font-semibold font-['Roboto'] hover:bg-[#357a21] transition-colors duration-300">
                        {item.buttonText}
                      </button>
                    </div>
                  </div>
                  <img 
                    className="w-full max-w-[400px]" 
                    src={item.imageSrc} 
                    alt={item.imageAlt}
                  />
                </div>
              </section>
            </div>
          </div>
        ))}
      </div>

      {/* Vertical indicators */}
      <div className="absolute z-30 flex flex-col -translate-y-1/2 top-1/2 right-5 space-y-3">
        {items.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-[#3e9d26] scale-110' 
                : 'bg-gray-400/40 hover:bg-gray-400/60'
            }`}
            aria-current={index === currentIndex}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        type="button"
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center justify-center w-12 h-12 cursor-pointer group focus:outline-none"
        onClick={goToPrev}
        aria-label="Previous slide"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-[#3e9d26] group-focus:outline-none transition-all duration-300">
          <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-800" />
          <span className="sr-only">Previous</span>
        </span>
      </button>

      <button
        type="button"
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center justify-center w-12 h-12 cursor-pointer group focus:outline-none"
        onClick={goToNext}
        aria-label="Next slide"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-[#3e9d26] group-focus:outline-none transition-all duration-300">
          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-800" />
          <span className="sr-only">Next</span>
        </span>
      </button>

      {/* Progress indicator */}
      {autoPlay && !isHovered && (
        <div className="absolute bottom-2 left-4 right-4 h-1 bg-gray-400/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#3e9d26] rounded-full transition-all duration-100 ease-linear"
            style={{
              width: `${((currentIndex + 1) / items.length) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VerticalCarousel;
