import { AccessDeniedCard } from '@/components/access-denied-card';
import { CollectionForm } from '@/features/collections/components/collection-form';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function NewCollection({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const {
        user,
        isVirtualStoreOwner,
        isSystemAdmin
    } = await getAuthState();

    const { storeId } = await params;

    if (!user) redirect('/');
    if (!isVirtualStoreOwner && !isSystemAdmin) return <AccessDeniedCard message='Only virtual store manegers can create collection' />

    return (
        <div>
            <CollectionForm currentUser={user} storeId={storeId} />
        </div>
    );
}

export default NewCollection;