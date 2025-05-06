import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VirtualProductTypes } from '@/lib/types';
import { getAuthState } from '@/lib/user-label-permission';
import { cn, slugify } from '@/lib/utils';
import { Heart, StarIcon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { VirtualProductMenuActions } from '../virtual-product-actions';
import { ProductPriceDisplay } from '../../currency/converted-price-component';
import Link from 'next/link';
import { getStoreSubdomainUrl } from '@/lib/domain-utils';

export const VirtualProductCard = async ({
    product,
    storeId,
}: {
    product: VirtualProductTypes,
    storeId?: string
}) => {
    const {
        isPhysicalStoreOwner,
        isVirtualStoreOwner,
        isSystemAdmin,
        user
    } = await getAuthState();

    const isMyProduct = user ? product?.createdBy === user.$id : false;

    let discount;
    const originalPrice = product?.price ?? product?.sellingPrice;
    const price = (product?.price ?? product?.sellingPrice) - 5;
    const productCurrency = product?.currency || 'USD';

    const rating = 3;
    const reviews = 135

    const discountPercentage = discount || (originalPrice && price ?
        Math.round(((originalPrice - price) / originalPrice) * 100) : null);

    return (
        <Card className="group w-full h-full max-w-[280px] min-w-[250px] overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="relative h-60 w-full overflow-hidden">
                <Carousel className="relative w-full max-w-xs">
                    <Link href={`${getStoreSubdomainUrl({ subdomain: product.virtualStore.subDomain })}/products/${slugify(product.title)}/${product.$id}`} target='_blank'>
                        <CarouselContent>
                            {product?.generalImageUrls?.map((imageUrl: string, index: number) => (
                                <CarouselItem key={index} className='relative h-60 w-full'>
                                    <Image
                                        src={imageUrl}
                                        alt={product?.title}
                                        fill
                                        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Link>
                    <CarouselPrevious className='absolute left-0 top-1/2 z-10 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-90' />
                    <CarouselNext className='absolute right-0 top-1/2 z-10 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-90' />
                </Carousel>

                {discountPercentage && (
                    <Badge variant="destructive" className="absolute top-2 left-2 bg-black text-white transition-transform duration-300 ease-in-out group-hover:scale-110">
                        {discountPercentage}% off
                    </Badge>
                )}

                <div className='absolute top-2 right-2'>
                    <div className={cn(
                        'flex gap-1 items-center',
                        (isSystemAdmin || isPhysicalStoreOwner || isVirtualStoreOwner) && 'hidden'
                    )}>
                        <AddToCartButton
                            item={product}
                        />
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full bg-white/80 transition-all duration-300 ease-in-out hover:bg-white hover:scale-110 active:scale-95"
                                    >
                                        <Heart className="h-4 w-4 text-gray-500 transition-colors duration-300 ease-in-out group-hover:text-gray-800" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="dark px-2 py-1 text-xs" showArrow={true}>
                                    Save item
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    {(isMyProduct && storeId) && <VirtualProductMenuActions storeId={storeId} product={product} />}
                </div>
            </div>
            <Link href={`/products/${slugify(product.title)}/${product.$id}`}>
                <CardContent className="pt-4 px-3 transition-all duration-300 group-hover:bg-gray-50">
                    <h3 className="font-medium text-sm mb-1 truncate transition-colors duration-300 group-hover:text-gray-900">{product.title}</h3>
                    <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon
                                key={i}
                                className={`h-3 w-3 transition-all duration-300 ${i < Math.floor(rating) ? "fill-current text-yellow-500 group-hover:text-yellow-400" : "text-gray-300"}`}
                            />
                        ))}
                        {reviews && (
                            <span className="text-xs text-gray-500 ml-1 transition-opacity duration-300 group-hover:opacity-80">({reviews})</span>
                        )}
                    </div>

                    <div className='flex justify-between items-center'>
                        <div className="flex items-center gap-2 font-sans transition-transform duration-300 ease-in-out group-hover:translate-x-1">
                            <span className="font-semibold  text-sm transition-colors duration-300 group-hover:text-gray-900">
                                <ProductPriceDisplay
                                    productPrice={price}
                                    productCurrency={productCurrency}
                                />
                            </span>
                            {originalPrice && (
                                <span className="text-sm text-gray-500 line-through transition-opacity duration-300 group-hover:opacity-70">
                                    <ProductPriceDisplay
                                        productPrice={originalPrice}
                                        productCurrency={productCurrency}
                                    />
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Link>
        </Card >
    );
}