import { PlaceOrderPage } from '@/features/order/components/place-order-page';
import React from 'react';

async function page({ params }: {
  params: Promise<{ currentStoreId: string }>;
}) {
  const { currentStoreId } = await params;
  
  return <PlaceOrderPage virtualStoreId={currentStoreId} />
}

export default page;