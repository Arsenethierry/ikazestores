import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
    id: string;
    name: string;
    imageUrl: string;
    rating: number;
    reviewCount: number;
    price: number;
    originalPrice?: number;
    currency: string;
}

interface BestPicksSectionProps {
    products: Product[];
    storeId: string;
}

export const BestPicksSection = ({ products, storeId }: BestPicksSectionProps) => {
    if (!products || products.length === 0) return null;

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                        key={index}
                        className={`h-4 w-4 ${index < rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <section className="py-12">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Best pick of the week</h2>
                <Link
                    href={`/store/${storeId}/products`}
                    className="text-sm font-medium hover:underline"
                >
                    Shop More
                </Link>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <Link
                        key={product.id}
                        href={`/store/${storeId}/products/${product.id}`}
                        className="group space-y-4"
                    >
                        {/* Product Image */}
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-50">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                loading="lazy"
                            />
                        </div>

                        {/* Product Details */}
                        <div className="space-y-2">
                            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                {product.name}
                            </h3>

                            {/* Rating */}
                            <div className="flex items-center gap-2">
                                {renderStars(product.rating)}
                                {product.reviewCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        ({product.reviewCount})
                                    </span>
                                )}
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-2">
                                {product.originalPrice && (
                                    <span className="text-sm text-muted-foreground line-through">
                                        {formatPrice(product.originalPrice, product.currency)}
                                    </span>
                                )}
                                <span className="text-lg font-bold text-primary">
                                    {formatPrice(product.price, product.currency)}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export const BestPicksSkeleton = () => {
    return (
        <section className="py-12">
            {/* Section Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-5 w-24" />
            </div>

            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                        {/* Product Image Skeleton */}
                        <Skeleton className="aspect-square rounded-lg" />

                        {/* Product Details Skeleton */}
                        <div className="space-y-3">
                            {/* Title */}
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-3/4" />

                            {/* Rating */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <Skeleton key={j} className="h-4 w-4 rounded-full" />
                                ))}
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};