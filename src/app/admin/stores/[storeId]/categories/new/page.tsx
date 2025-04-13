import { AccessDeniedCard } from '@/components/access-denied-card';
import { CategoryForm } from '@/features/categories/components/new-category-form';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function NewCategory({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const {
        user,
        isPhysicalStoreOwner
    } = await getAuthState();

    const { storeId } = await params;
    
    if(!user) redirect('/');

    if(!isPhysicalStoreOwner) return <AccessDeniedCard message='Only real store owners can create category' />
    
    return <CategoryForm currentUser={user} storeId={storeId} />
}

export default NewCategory;