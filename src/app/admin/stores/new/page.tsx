import CreateStoresTabs from '@/features/stores/components/create-stores-tabs';
import { hasLabelAccess } from '@/hooks/use-has-label-permission';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react';

async function CreateNewStorePage() {
    const user = await getLoggedInUser();

    if (!user) redirect("/sign-in?redirectUrl=/admin/stores/new")
    const isSytemAdmin = hasLabelAccess(user, ['superAdmin'])
    if (!isSytemAdmin) redirect("/");

    return <CreateStoresTabs currentUser={user} />;
}

export default CreateNewStorePage;