import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DocumentType } from '@/lib/types';
import { getAuthState } from '@/lib/user-label-permission';
import { cn } from '@/lib/utils';
// import { getAuthState } from '@/lib/user-label-permission';
import { Heart, ShoppingCart, StarIcon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { ProductMenuActions } from './product-actions';
import { CloneProductSheet } from './clone-product-sheet';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const ProductCard = async ({ product }: { product: DocumentType }) => {
    const {
        isPhysicalStoreOwner,
        isVirtualStoreOwner,
        isSystemAdmin,
        user
    } = await getAuthState();

    const isMyProduct = product?.createdBy === user?.$id

    let discount;
    const originalPrice = product?.price;
    const price = product?.price - 5;

    const rating = 3;
    const reviews = 135

    const discountPercentage = discount || (originalPrice && price ?
        Math.round(((originalPrice - price) / originalPrice) * 100) : null);

    return (
        <Card className="w-full max-w-xs overflow-hidden rounded-lg">
            <div className="relative h-60 w-full">
                {/* <Carousel className='relative h-60 w-full'>
                    <CarouselContent>
                        {product?.imageUrls.map((imageUrl: string, index: number) => (
                            <CarouselItem key={index}>
                                <Image
                                    src={imageUrl}
                                    alt={product?.title}
                                    fill
                                    className="object-cover"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel> */}

                <Carousel className="relative w-full max-w-xs">
                    <CarouselContent>
                        {product?.imageUrls.map((imageUrl: string, index: string) => (
                            <CarouselItem key={index} className='relative h-60 w-full'>
                                <Image
                                    src={imageUrl}
                                    alt={product?.title}
                                    fill
                                    className="object-cover"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className='absolute left-0 top-1/2' />
                    <CarouselNext className='absolute right-0 top-1/2' />
                </Carousel>

                {discountPercentage && (
                    <Badge variant="destructive" className="absolute top-2 left-2 bg-black text-white">
                        {discountPercentage}% off
                    </Badge>
                )}

                <div className='absolute top-2 right-2'>
                    <div className={cn(
                        'flex gap-1 items-center',
                        (isSystemAdmin || isPhysicalStoreOwner || isVirtualStoreOwner) && 'hidden'
                    )}>
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full bg-white/80 hover:bg-white"
                                    >
                                        <ShoppingCart className="h-4 w-4 text-gray-500" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="dark px-2 py-1 text-xs" showArrow={true}>
                                    Add to cart
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full bg-white/80 hover:bg-white"
                                    >
                                        <Heart className="h-4 w-4 text-gray-500" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="dark px-2 py-1 text-xs" showArrow={true}>
                                    Save item
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    {isMyProduct && <ProductMenuActions />}
                </div>
            </div>
            <CardContent className="pt-4 px-2">
                <h3 className="font-medium text-sm mb-1 truncate">{product.title}</h3>
                <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon
                            key={i}
                            className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-current text-yellow-500" : "text-gray-300"}`}
                        />
                    ))}
                    {reviews && (
                        <span className="text-xs text-gray-500 ml-1">({reviews})</span>
                    )}
                </div>

                <div className='flex justify-between items-center'>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">${price.toFixed(2)}</span>
                        {originalPrice && (
                            <span className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
                        )}
                    </div>
                    <CloneProductSheet
                        currentUser={user}
                        product={product}
                    />
                </div>
            </CardContent>
            {/* <CardContent className="flex justify-between gap-1 px-1 py-0 items-center">
                <p className="text-sm font-mono mr-1.5">${product?.price}<span className='line-through italic text-muted-foreground'>$900</span></p>
                <ShoppingCart className='size-4' />
            </CardContent>
            <CardFooter className="flex justify-end p-1">
                {isVirtualStoreOwner ? (
                    <Button variant={'teritary'} size={'sm'}>
                        Sell product
                    </Button>
                ) : isBuyer ? (
                    <Button>
                        <ShoppingCartIcon className="size-4" />
                        Add to Cart
                    </Button>
                ) : null}
            </CardFooter> */}
        </Card >
    );
}

export default ProductCard;