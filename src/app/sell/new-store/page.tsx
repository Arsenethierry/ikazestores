import CreateStoresTabs from '@/features/stores/components/create-stores-tabs';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react';

async function page() {
    const user = await getLoggedInUser();

    if (!user) redirect("/sign-in?redirectUrl=/sell/new-store")
    return (
        <div className='mt-28'>
            <CreateStoresTabs currentUser={user} />
        </div>
    );
}

export default page;