import { AccessDeniedCard } from '@/components/access-denied-card';
import { CategoryForm } from '@/features/categories/components/new-category-form';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function NewCategory() {
    const {
        user,
        isSystemAdmin
    } = await getAuthState();

    if(!user) redirect('/');

    if(!isSystemAdmin) return <AccessDeniedCard />
    
    return <CategoryForm currentUser={user} storeId={null} />
}

export default NewCategory;