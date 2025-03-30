import { CreateStoresTabs } from '@/features/stores/components/create-stores-tabs';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function page() {
    const { isPhysicalStoreOwner, user } = await getAuthState();

    if (!user) redirect("/sign-in?redirectUrl=/sell/new-store")

    return (
        <div className='mt-28'>
            <CreateStoresTabs
                currentUser={user}
                isPhysicalStoreOwner={isPhysicalStoreOwner}
            />
        </div>
    );
}

export default page;