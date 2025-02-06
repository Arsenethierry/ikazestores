import { CreatePhysicalStoreForm } from '@/features/system-admin/components/create-physical-store-form';
import { hasLabelAccess } from '@/hooks/use-has-label-permission';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react';

async function CreateNewStorePage() {
    const user = await getLoggedInUser();

    if (!user) redirect("/sign-in")
    const isSytemAdmin = hasLabelAccess(user, ['superAdmin'])
    if (!isSytemAdmin) redirect("/");

    return <CreatePhysicalStoreForm currentUser={user} />
}

export default CreateNewStorePage;