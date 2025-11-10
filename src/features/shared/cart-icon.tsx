"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SharedCartIconProps {
    totalItems: number;
    href?: string;
    className?: string;
    iconClassName?: string;
    badgeClassName?: string;
}

export const SharedCartIcon = ({
    totalItems,
    href = '/cart',
    className,
    iconClassName,
    badgeClassName,
}: SharedCartIconProps) => {
    return (
        <Link href={href} className={cn("relative inline-flex items-center justify-center", className)}>
            <ShoppingCart className={cn("h-6 w-6", iconClassName)} />
            {totalItems > 0 && (
                <Badge
                    className={cn(
                        "absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs",
                        badgeClassName
                    )}
                >
                    {totalItems > 99 ? '99+' : totalItems}
                </Badge>
            )}
        </Link>
    );
};