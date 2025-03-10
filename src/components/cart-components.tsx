import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { getCart } from '@/features/products/actions/cart-actions';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getVirtualProductById } from '@/features/products/actions/virtual-products-actions';
import { CartItem } from '@/lib/types';

export const CartSheet = async () => {
    const cart = await getCart();

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
                {cart.items.map(item => (
                    <RenderProductCard key={item.id} item={item} />
                ))}
            </SheetContent>
        </Sheet>
    )
}

const RenderProductCard = async ({ item }: { item: CartItem }) => {
    const product = await getVirtualProductById(item.id);

    if (!product) return;
    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>{product.$id}</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                        In Stock
                    </Badge>
                </CardTitle>
                <CardDescription>{(product?.description)?.slice(0,200)}...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">${product?.sellingPrice}</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            -
                        </Button>
                        <Input
                            type="number"
                            defaultValue={item.quantity ?? 1}
                            className="w-16 text-center"
                            min="1"
                        />
                        <Button variant="outline" size="sm">
                            +
                        </Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                </Button>
            </CardFooter>
        </Card>
    )
}