"use client";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../../../components/ui/sheet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { CartItem } from '@/lib/types';
import { useGetCartItems } from '@/features/cart/cart.queries';
import SpinningLoader from '../../../components/spinning-loader';
import { useGetProductById } from '@/features/products/products-queries';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRemoveFromCart, useUpdateCartItemQuantity } from '../cart.mutations';

export const CartSheet = () => {
    const { data: cart, isLoading } = useGetCartItems();

    if (isLoading) return <SpinningLoader />

    if (!cart) return;

    return (
        <Sheet>
            <SheetTitle className="hidden">
            </SheetTitle>
            <SheetTrigger asChild>
                <div className="relative cursor-pointer">
                    <Avatar className='h-max max-w-8'>
                        <AvatarImage src="/icons/shopping-cart.svg" alt="Kelly King" />
                        <AvatarFallback>
                            <ShoppingCart />
                        </AvatarFallback>
                    </Avatar>
                    <Badge className="flex flex-col items-center border-background absolute -top-1.5 left-full min-w-5 -translate-x-3.5 px-1">
                        {cart.totalItems}
                    </Badge>
                </div>
            </SheetTrigger>
            <SheetContent>
                <ScrollArea className='h-[90vh] mt-5'>
                    <div className='flex flex-col gap-5'>
                        {cart.items.map(item => (
                            <RenderProductCard key={item.id} item={item} />
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

const RenderProductCard = ({ item }: { item: CartItem }) => {
    const { data: product, isLoading } = useGetProductById(item.id)
    const { mutateAsync: removeItem, isPending } = useRemoveFromCart();
    const { mutate: updateCartItemQuantity } = useUpdateCartItemQuantity()

    if (!product) return;

    if (isLoading) return <SpinningLoader />

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>{product.$id}</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                        In Stock
                    </Badge>
                </CardTitle>
                <CardDescription>{(product?.description)?.slice(0, 200)}...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">${product?.sellingPrice}</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItemQuantity({ productId: product.$id, quantity: item.quantity - 1 })}
                        >
                            -
                        </Button>
                        <Input
                            type="number"
                            defaultValue={item.quantity ?? 1}
                            className="w-16 text-center"
                            min="1"
                        />
                        <Button
                            onClick={() => updateCartItemQuantity({ productId: product.$id, quantity: item.quantity + 1 })}
                            variant="outline"
                            size="sm"
                        >
                            +
                        </Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button
                    onClick={() => removeItem(product.$id)}
                    variant="destructive"
                    disabled={isPending}
                    size="sm"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                </Button>
            </CardFooter>
        </Card>
    )
}