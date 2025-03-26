"use client";

import React from 'react';
import { useCartStore } from '../use-cart-store';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const CartNavButton = () => {
    const { totalItems } = useCartStore();
    
    return (
        <Link href={'/cart'} className="relative cursor-pointer">
            <Avatar className='h-8 w-8'>
                <AvatarImage src="/icons/shopping-cart.svg" alt="Cart" />
                <AvatarFallback>
                    <ShoppingCart className='h-4 w-4' />
                </AvatarFallback>
            </Avatar>
            <Badge className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center">
                {totalItems}
            </Badge>
        </Link>
    );
}