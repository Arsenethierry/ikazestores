import { AccessDeniedCard } from '@/components/access-denied-card';
import { getCategoriesWithSubcategories } from '@/features/categories/actions/categories-actions';
import ProductForm from '@/features/products/components/product-form';
import { getPhysicalStoreById } from '@/lib/actions/physical-store.action';
import { getAuthState, isStoreOwner } from '@/lib/user-label-permission';
import React from 'react';

async function page({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    const { isPhysicalStoreOwner, user } = await getAuthState();

    const storeData = await getPhysicalStoreById(storeId);

    if (!isPhysicalStoreOwner || !isStoreOwner(user, storeData) || !storeData) {
        return <AccessDeniedCard />
    }

    const categoriesData = await getCategoriesWithSubcategories();

    return (
        <ProductForm storeData={storeData} categoriesData={categoriesData} />
    );
}

export default page;