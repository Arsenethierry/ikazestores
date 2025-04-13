import { AccessDeniedCard } from '@/components/access-denied-card';
import { getCategoryById } from '@/features/categories/actions/categories-actions';
import { CategoryForm } from '@/features/categories/components/new-category-form';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function page({
    params,
}: {
    params: Promise<{ categoryId: string, storeId: string }>
}) {
    const { categoryId, storeId } = await params;
    const {
        user,
        isSystemAdmin,
    } = await getAuthState();

    if (!user) redirect('/');

    if (!isSystemAdmin) return <AccessDeniedCard />

    const category = await getCategoryById(categoryId);

    return <CategoryForm
        currentUser={user}
        initialValues={category}
        storeId={storeId}
    />
}

export default page;