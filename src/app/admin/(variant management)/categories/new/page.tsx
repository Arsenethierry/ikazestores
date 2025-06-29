import { AccessDeniedCard } from '@/components/access-denied-card';
import { CategoryForm } from '@/features/categories/components/new-category-form';
import EcommerceCatalogUtils from '@/features/variants management/ecommerce-catalog';
import { getAuthState } from '@/lib/user-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function NewCategory() {
    const {
        user,
        isSystemAdmin
    } = await getAuthState();

    if(!user) redirect('/');

    if(!isSystemAdmin) return <AccessDeniedCard />

    const categories = EcommerceCatalogUtils.getCategories();
    
    return <CategoryForm currentUser={user} storeId={null} />
}

export default NewCategory;