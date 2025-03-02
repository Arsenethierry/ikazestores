import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentType } from '@/lib/types';
import { getAuthState } from '@/lib/user-label-permission';
import { ShoppingCart, ShoppingCartIcon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

const ProductCard = async ({ product }: { product: DocumentType }) => {
    const { isVirtualStoreOwner, isBuyer } = await getAuthState();

    return (
        <Card className='p-0 flex flex-col justify-between max-w-[400px] h-full'>
            <CardHeader className='p-0 relative'>
                <Image
                    src={product?.imageUrls[0] ?? "https://i.imgur.com/ZKGofuB.jpeg"}
                    alt="product image"
                    width={100}
                    height={100}
                    className="w-full h-full object-cover rounded-t-lg"
                />
                <Badge className="absolute top-0 left-2">{product?.category ?? 'category'}</Badge>
                {product?.seeded && <Badge variant={'destructive'} className="absolute top-0 right-2">Fake product</Badge>}
                <CardTitle className='text-xs truncate px-1 text-muted-foreground'>
                    {product?.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between gap-1 px-1 py-0 items-center">
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
            </CardFooter>
        </Card>
    );
}

export default ProductCard;