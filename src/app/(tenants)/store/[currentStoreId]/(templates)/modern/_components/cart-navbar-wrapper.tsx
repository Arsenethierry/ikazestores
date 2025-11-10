"use client";

import { useCartStore } from '@/features/cart/use-cart-store';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { SharedCartIcon } from '@/features/shared/cart-icon';

export const CartNavbarWrapper = () => {
  const { totalItems } = useCartStore();
  const params = useParams();
  const currentStoreId = params.currentStoreId as string;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative hover:bg-slate-800"
      asChild
    >
      <div>
        <SharedCartIcon
          totalItems={totalItems}
          href={`/store/${currentStoreId}/cart`}
          iconClassName="h-5 w-5 text-white"
          badgeClassName="bg-yellow-500 text-slate-900 hover:bg-yellow-500"
        />
      </div>
    </Button>
  );
};