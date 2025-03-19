import { PlaceOrderPage } from '@/features/order/components/place-order-page';
import { getCart } from '@/lib/cart';
import React from 'react';

async function page() {
  const cartItems = await getCart();
  return <PlaceOrderPage cartItems={cartItems} />
}

export default page;