import CreateStoresTabs from '@/features/stores/components/create-stores-tabs';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function CreateNewStorePage() {
    const { isSystemAdmin, user } = await getAuthState();

    if (!user) redirect("/sign-in?redirectUrl=/admin/stores/new")
    if (!isSystemAdmin) redirect("/");

    return <CreateStoresTabs currentUser={user} />;
}

export default CreateNewStorePage;