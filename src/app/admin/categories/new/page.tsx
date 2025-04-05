import { NewCategoryForm } from '@/features/products/components/categories/new-category-form';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function NewCategory() {
    const {
        user
    } = await getAuthState();

    if(!user) redirect('/');
    
    return <NewCategoryForm currentUser={user}/>
}

export default NewCategory;