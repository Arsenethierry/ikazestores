import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCartIcon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

const ProductCard = () => {
    return (
        <Card className='p-0 flex flex-col justify-between max-w-[400px]'>
            <CardHeader className='p-0 relative'>
                <Image
                    src={"https://i.imgur.com/ZKGofuB.jpeg"}
                    alt="product image"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover rounded-t-lg"
                />
                <Badge className="absolute top-0 left-2">category</Badge>
                <div className="p-6">
                    <CardTitle>Handmade Fresh Table</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <p className="text-xl font-bold">$50</p>
                <CardDescription>{"Andy shoes are designed to keeping in...".slice(0, 80)}...</CardDescription>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button>
                    <ShoppingCartIcon className="size-4" />
                    Add to Cart
                </Button>
            </CardFooter>
        </Card>
    );
}

export default ProductCard;