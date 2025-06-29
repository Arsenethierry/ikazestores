import { AccessDeniedCard } from '@/components/access-denied-card';
import { CollectionForm } from '@/features/collections/components/collection-form';
import { getAuthState } from '@/lib/user-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function NewCollection({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const {
        user,
        isVirtualStoreOwner
    } = await getAuthState();

    const { storeId } = await params;

    if (!user) redirect('/');
    if (!isVirtualStoreOwner) return <AccessDeniedCard message='Only real store manegers can create collection' />

    return (
        <div>
            <CollectionForm currentUser={user} storeId={storeId} />
        </div>
    );
}

export default NewCollection;