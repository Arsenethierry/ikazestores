"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CurrentUserType, VirtualProductTypes } from '@/lib/types';
import { cn, slugify } from '@/lib/utils';
import { StarIcon, Eye, Truck } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useCallback, memo } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { VirtualProductMenuActions } from '../virtual-product-actions';
import { ProductPriceDisplay } from '../../currency/converted-price-component';
import Link from 'next/link';
import { getStoreSubdomainUrl } from '@/lib/domain-utils';
import { SaveItemButton } from '../save-item-button';
import { Button } from '@/components/ui/button';
import { useInView } from 'react-intersection-observer';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';

interface VirtualProductCardProps {
    product: VirtualProductTypes;
    storeId?: string;
    viewMode?: 'grid' | 'list';
    showQuickView?: boolean;
    onQuickView?: (product: VirtualProductTypes) => void;
    className?: string;
    isMyProduct?: boolean;
    user?: CurrentUserType;
}

const VirtualProductCard = memo(({
    product,
    storeId,
    viewMode = 'grid',
    showQuickView = true,
    onQuickView,
    className,
    isMyProduct = false,
    user
}: VirtualProductCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Lazy loading with intersection observer
    const { ref: cardRef, inView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
        rootMargin: '50px'
    });

    // Product calculations
    const originalPrice = product?.price ?? product?.sellingPrice;
    const sellingPrice = (product?.price ?? product?.sellingPrice) - 5; // Your discount logic
    const productCurrency = product?.currency || 'USD';

    const discountPercentage = originalPrice && sellingPrice ?
        Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

    // Mock data - replace with real data from your system
    const rating = 4.2;
    const reviewCount = 135;
    const isInStock = true;
    const isFreeShipping = sellingPrice > 50;
    const isNewArrival = new Date(product.$createdAt).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000);
    const viewCount = 1240; // This would come from analytics

    const handleQuickView = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onQuickView?.(product);
    }, [onQuickView, product]);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

    const productUrl = `${getStoreSubdomainUrl({ subdomain: product.virtualStore.subDomain })}/products/${slugify(product.title)}/${product.$id}`;

    if (viewMode === 'list') {
        return (
            <Card
                ref={cardRef}
                className={cn(
                    "group transition-all duration-300 hover:shadow-lg border-border/50",
                    className
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="p-4">
                    <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
                            {inView && (
                                <Link href={productUrl} target="_blank">
                                    <Image
                                        src={product?.generalImageUrls?.[0] || '/placeholder-product.jpg'}
                                        alt={product?.title}
                                        fill
                                        className={cn(
                                            "object-cover transition-all duration-500",
                                            "group-hover:scale-105",
                                            imageLoaded ? 'opacity-100' : 'opacity-0'
                                        )}
                                        onLoad={handleImageLoad}
                                        sizes="(max-width: 128px) 100vw, 128px"
                                    />
                                </Link>
                            )}

                            {/* Badges */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {discountPercentage > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                        -{discountPercentage}%
                                    </Badge>
                                )}
                                {isNewArrival && (
                                    <Badge className="bg-green-500 text-white text-xs">
                                        New
                                    </Badge>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="flex flex-col gap-1">
                                    <SaveItemButton productId={product.$id} size="sm" />
                                    {showQuickView && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-8 h-8 p-0"
                                            onClick={handleQuickView}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <Link href={productUrl} target="_blank">
                                        <h3 className="font-semibold text-base line-clamp-2 hover:text-primary transition-colors">
                                            {product.title}
                                        </h3>
                                    </Link>

                                    {/* Categories */}
                                    {product.categoryNames && product.categoryNames.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {product.categoryNames.slice(0, 2).map((category: string, index: number) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {category}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Store Menu Actions */}
                                {isMyProduct && storeId && (
                                    <VirtualProductMenuActions product={product} />
                                )}
                            </div>

                            {/* Rating and Reviews */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            className={cn(
                                                "h-3 w-3 transition-colors",
                                                i < Math.floor(rating)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                            )}
                                        />
                                    ))}
                                    <span className="text-sm text-muted-foreground ml-1">
                                        {rating}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    ({reviewCount} reviews)
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    • {viewCount} views
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {product.description}
                            </p>

                            {/* Features */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {isFreeShipping && (
                                    <div className="flex items-center gap-1">
                                        <Truck className="h-3 w-3" />
                                        <span>Free Shipping</span>
                                    </div>
                                )}
                                {isInStock ? (
                                    <div className="flex items-center gap-1 text-green-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span>In Stock</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-red-600">
                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                                        <span>Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            {/* Price and Actions */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">
                                        <ProductPriceDisplay
                                            productPrice={sellingPrice}
                                            productCurrency={productCurrency}
                                        />
                                    </span>
                                    {discountPercentage > 0 && (
                                        <span className="text-sm text-muted-foreground line-through">
                                            <ProductPriceDisplay
                                                productPrice={originalPrice}
                                                productCurrency={productCurrency}
                                            />
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <AddToCartButton
                                        item={product}
                                    // size="sm"
                                    // disabled={!isInStock}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    // Grid view (default)
    return (
        <Card
            ref={cardRef}
            className={cn(
                "group w-full h-full max-w-[280px] min-w-[250px] overflow-hidden",
                "transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                "border-border/50",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Product Image Carousel */}
            <div className="relative h-60 w-full overflow-hidden">
                {inView ? (
                    <Carousel className="relative w-full h-full">
                        <Link href={productUrl} target="_blank">
                            <CarouselContent>
                                {product?.generalImageUrls?.map((imageUrl: string, index: number) => (
                                    <CarouselItem key={index} className="relative h-60 w-full">
                                        <Image
                                            src={imageUrl}
                                            alt={`${product?.title} - Image ${index + 1}`}
                                            fill
                                            className={cn(
                                                "object-cover transition-all duration-500",
                                                "group-hover:scale-105",
                                                imageLoaded ? 'opacity-100' : 'opacity-0'
                                            )}
                                            onLoad={handleImageLoad}
                                            sizes="(max-width: 280px) 100vw, 280px"
                                            priority={index === 0}
                                        />
                                    </CarouselItem>
                                )) || (
                                        <CarouselItem className="relative h-60 w-full">
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                                <span className="text-muted-foreground">No Image</span>
                                            </div>
                                        </CarouselItem>
                                    )}
                            </CarouselContent>
                        </Link>

                        {(product?.generalImageUrls?.length || 0) > 1 && (
                            <>
                                <CarouselPrevious className={cn(
                                    "absolute left-2 top-1/2 z-10 transition-opacity duration-300",
                                    isHovered ? "opacity-90" : "opacity-0"
                                )} />
                                <CarouselNext className={cn(
                                    "absolute right-2 top-1/2 z-10 transition-opacity duration-300",
                                    isHovered ? "opacity-90" : "opacity-0"
                                )} />
                            </>
                        )}
                    </Carousel>
                ) : (
                    <div className="w-full h-full bg-muted animate-pulse" />
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                    {discountPercentage > 0 && (
                        <Badge variant="destructive" className="text-xs font-semibold">
                            -{discountPercentage}%
                        </Badge>
                    )}
                    {isNewArrival && (
                        <Badge className="bg-green-500 text-white text-xs">
                            New
                        </Badge>
                    )}
                    {!isInStock && (
                        <Badge variant="secondary" className="text-xs">
                            Out of Stock
                        </Badge>
                    )}
                </div>

                <div className="absolute top-2 right-2 z-20">
                    <div className={cn(
                        "flex flex-col gap-1 transition-opacity duration-300",
                        !user ? "block" : "hidden",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}>
                        <SaveItemButton productId={product.$id} />
                        {/* <AddToCartButton
                            item={product}
                            // variant="secondary"
                            // size="sm"
                            // className="w-8 h-8 p-0"
                            // disabled={!isInStock}
                        >
                            <ShoppingCart className="h-4 w-4" />
                        </AddToCartButton> */}
                        {showQuickView && (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-8 h-8 p-0"
                                onClick={handleQuickView}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Store Owner Actions */}
                    {isMyProduct && storeId && (
                        <VirtualProductMenuActions product={product} />
                    )}
                </div>

                {/* Image Indicators */}
                {(product?.generalImageUrls?.length || 0) > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-20">
                        {product.generalImageUrls?.map((_, index) => (
                            <div
                                key={index}
                                className="w-1.5 h-1.5 rounded-full bg-white/50 transition-all duration-300"
                            />
                        ))}
                    </div>
                )}
            </div>

            <CardContent className="pt-4 px-3 space-y-3">
                <Link href={productUrl} target="_blank">
                    <div className="space-y-2">
                        <h3 className="font-medium text-sm line-clamp-2 transition-colors duration-300 group-hover:text-primary">
                            {product.title}
                        </h3>

                        {product.categoryNames && product.categoryNames.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {product.categoryNames.slice(0, 2).map((category: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {category}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </Link>

                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon
                            key={i}
                            className={cn(
                                "h-3 w-3 transition-colors duration-300",
                                i < Math.floor(rating)
                                    ? "fill-yellow-400 text-yellow-400 group-hover:text-yellow-500"
                                    : "text-gray-300"
                            )}
                        />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">
                        ({reviewCount})
                    </span>
                </div>

                {/* Features */}
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        {isFreeShipping && (
                            <div className="flex items-center gap-1 text-green-600">
                                <Truck className="h-3 w-3" />
                                <span>Free Ship</span>
                            </div>
                        )}
                        {isInStock ? (
                            <div className="flex items-center gap-1 text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span>In Stock</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-red-600">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span>Out of Stock</span>
                            </div>
                        )}
                    </div>

                    <div className="text-muted-foreground">
                        {viewCount.toLocaleString()} views
                    </div>
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1">
                        <span className="font-bold text-base transition-colors duration-300 group-hover:text-primary">
                            <ProductPriceDisplay
                                productPrice={sellingPrice}
                                productCurrency={productCurrency}
                            />
                        </span>
                        {discountPercentage > 0 && (
                            <span className="text-sm text-muted-foreground line-through transition-opacity duration-300 group-hover:opacity-70">
                                <ProductPriceDisplay
                                    productPrice={originalPrice}
                                    productCurrency={productCurrency}
                                />
                            </span>
                        )}
                    </div>

                    {/* Action Button for Mobile/Touch Devices */}
                    <div className="md:hidden">
                        <AddToCartButton
                            item={product}
                        // size="sm"
                        // disabled={!isInStock}
                        />
                    </div>
                </div>

                {/* Store Info */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-[8px] font-semibold text-primary">
                                {product.virtualStore.storeName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="truncate max-w-[120px]">
                            {product.virtualStore.storeName}
                        </span>
                    </div>

                    <div className={cn(
                        "hidden md:block transition-opacity duration-300",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}>
                        {/* <AddToCartButton
                            item={product}
                            size="sm"
                            disabled={!isInStock}
                        >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add
                        </AddToCartButton> */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

VirtualProductCard.displayName = 'VirtualProductCard';

export { VirtualProductCard };