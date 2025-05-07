import { AccessDeniedCard } from '@/components/access-denied-card';
import { getCategoriesWithSubcategories } from '@/features/categories/actions/categories-actions';
import ProductForm from '@/features/products/components/product-form';
import { getPhysicalStoreById } from '@/lib/actions/physical-store.action';
import { getAuthState } from '@/lib/user-label-permission';
import React from 'react';

async function page({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    const { isPhysicalStoreOwner } = await getAuthState();

    if (!isPhysicalStoreOwner) {
        return <AccessDeniedCard />
    }

    const storeData = await getPhysicalStoreById(storeId)
    const categories = await getCategoriesWithSubcategories({ storeId });
    if (storeData) {
        return (
            <ProductForm
                categoriesData={categories}
                storeData={storeData}
                storeId={storeId}
            />
        );
    }
}

export default page;