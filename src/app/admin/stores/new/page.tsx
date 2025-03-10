import CreateStoresTabs from '@/features/stores/components/create-stores-tabs';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function CreateNewStorePage() {
    const { isSystemAdmin, isVirtualStoreOwner, isPhysicalStoreOwner, user } = await getAuthState();

    if (!user) redirect("/sign-in?redirectUrl=/admin/stores/new")
    if (!isSystemAdmin && !isPhysicalStoreOwner && !isVirtualStoreOwner) redirect("/");

    return (
        <div className='py-10'>
            <CreateStoresTabs currentUser={user} />;
        </div>
    )
}

export default CreateNewStorePage;