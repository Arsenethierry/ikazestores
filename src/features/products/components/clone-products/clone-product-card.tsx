"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrentUserType, OriginalProductTypes } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Package, StarIcon, Store, CheckCircle2, Copy, TrendingUp, MapPin } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { CloneProductModal } from './clone-product-modal';
import { getCurrencySymbol } from '../../currency/currency-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CloneProductCardProps {
    product: OriginalProductTypes;
    virtualStoreId: string;
    user: CurrentUserType;
}

export const CloneProductCard = ({
    product,
    virtualStoreId,
    user,
}: CloneProductCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const price = product?.basePrice ?? 0;
    const productCurrency = product?.currency || 'RWF';
    const rating = 4.2;
    const isAlreadyCloned = product?.vitualProducts && product.vitualProducts.length > 0;
    const clonesCount = product?.vitualProducts?.length || 0;
    const hasImages = product?.images && product.images.length > 0;

    // Stock status
    const stockStatus = product?.stockStatus || 'in_stock';
    const isInStock = stockStatus === 'in_stock';
    const isLowStock = stockStatus === 'low_stock';

    return (
        <Card
            className={cn(
                "group w-full overflow-hidden rounded-lg border transition-all duration-300",
                "hover:shadow-xl hover:-translate-y-1",
                isAlreadyCloned ? "border-green-200 bg-green-50/30" : "border-gray-200"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Product Image Carousel */}
            <div className="relative h-60 w-full overflow-hidden bg-gray-100">
                {hasImages ? (
                    <Carousel className="relative w-full h-full">
                        <CarouselContent>
                            {product.images && product.images.map((imageUrl: string, index: number) => (
                                <CarouselItem key={index} className='relative h-60 w-full'>
                                    <Image
                                        src={imageUrl}
                                        alt={`${product.name} - Image ${index + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        priority={index === 0}
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {hasImages && product.images && product.images.length > 1 && (
                            <>
                                <CarouselPrevious
                                    className={cn(
                                        'absolute left-2 top-1/2 z-10 h-8 w-8 transition-opacity duration-300',
                                        isHovered ? 'opacity-90' : 'opacity-0'
                                    )}
                                />
                                <CarouselNext
                                    className={cn(
                                        'absolute right-2 top-1/2 z-10 h-8 w-8 transition-opacity duration-300',
                                        isHovered ? 'opacity-90' : 'opacity-0'
                                    )}
                                />
                            </>
                        )}
                    </Carousel>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Package className="w-12 h-12 text-gray-300" />
                    </div>
                )}

                {/* Top Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                    {isAlreadyCloned && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge className="bg-green-500 text-white hover:bg-green-600 shadow-lg">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Cloned
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>You've already added this to your store</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {product.featured && (
                        <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Featured
                        </Badge>
                    )}

                    {!isInStock && (
                        <Badge variant="destructive" className="shadow-lg">
                            Out of Stock
                        </Badge>
                    )}

                    {isLowStock && isInStock && (
                        <Badge className="bg-orange-500 text-white hover:bg-orange-600 shadow-lg">
                            Low Stock
                        </Badge>
                    )}
                </div>

                {/* Clone Count Badge */}
                {clonesCount > 0 && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="secondary"
                                    className="absolute top-2 right-2 bg-blue-500 text-white hover:bg-blue-600 shadow-lg z-20"
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    {clonesCount}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{clonesCount} {clonesCount === 1 ? 'clone' : 'clones'} across all stores</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {/* Product Info */}
            <CardContent className={cn(
                "p-4 transition-all duration-300",
                isHovered && "bg-gray-50"
            )}>
                {/* Product Name */}
                <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[40px] transition-colors duration-300 group-hover:text-blue-600">
                    {product.name}
                </h3>

                {/* Store Info */}
                {product.physicalStore?.storeName && (
                    <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                        <Store className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{product.physicalStore.storeName}</span>
                    </div>
                )}

                {/* Location Info */}
                {product.storeCountry && (
                    <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{product.storeCountry}</span>
                    </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon
                            key={i}
                            className={cn(
                                "h-3 w-3 transition-all duration-300",
                                i < Math.floor(rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-200'
                            )}
                        />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">
                        ({rating.toFixed(1)})
                    </span>
                </div>

                {/* Price and Clone Button */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Base Price</span>
                            <span className="font-bold text-lg text-blue-600">
                                {getCurrencySymbol(productCurrency)} {price.toLocaleString()}
                            </span>
                        </div>

                        {/* Stock Indicator */}
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground">Stock</span>
                            <span className={cn(
                                "text-xs font-semibold",
                                isInStock ? "text-green-600" : "text-red-600"
                            )}>
                                {product.totalStock || 0}
                            </span>
                        </div>
                    </div>

                    {/* Clone Button */}
                    <CloneProductModal
                        product={product}
                        virtualStoreId={virtualStoreId}
                        currentUser={user}
                    />
                </div>

                {/* Product Meta Info */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            {product.status === 'published' as string && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    Active
                                </Badge>
                            )}
                            {product.hasVariants && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className="text-xs">
                                                Variants
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>This product has multiple variants</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>

                        {product.sku && (
                            <span className="text-muted-foreground font-mono">
                                {product.sku}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};