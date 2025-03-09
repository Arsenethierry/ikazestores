import { AccessDeniedCard } from '@/components/access-denied-card';
import ProductForm from '@/features/products/components/product-form';
import { getAuthState } from '@/lib/user-label-permission';
import React from 'react';

async function page() {
    const { isPhysicalStoreOwner } = await getAuthState();

    if (!isPhysicalStoreOwner) {
        return <AccessDeniedCard />
    }

    return (
        <ProductForm />
    );
}

export default page;