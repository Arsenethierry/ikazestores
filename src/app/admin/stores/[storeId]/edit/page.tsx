import { AccessDeniedCard } from '@/components/access-denied-card';
import { PhysicalStoreForm } from '@/features/stores/components/physical-store-form';
import { VirtualStoreForm } from '@/features/stores/components/virtual-store-form ';
import { getPhysicalStoreById } from '@/lib/actions/physical-store.action';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { getAuthState, isStoreOwner } from '@/lib/user-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function EditStorePage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const {
        isVirtualStoreOwner,
        isPhysicalStoreOwner,
        user
    } = await getAuthState();

    const { storeId } = await params;

    if (isVirtualStoreOwner) {
        const currentStore = await getVirtualStoreById(storeId);
        if (!currentStore) {
            redirect("/admin")
        }
        const isOwner = isStoreOwner(user, currentStore);

        return (
            isOwner
                ? <VirtualStoreForm currentUser={user} initialValues={currentStore} />
                : <AccessDeniedCard message='Only owner / admin of this store can view this page' />
        )
    } else if (isPhysicalStoreOwner) {
        const currentStore = await getPhysicalStoreById(storeId);
        if (!currentStore) {
            redirect("/admin")
        }
        const isOwner = isStoreOwner(user, currentStore);

        return (
            isOwner
                ? <PhysicalStoreForm currentUser={user} initialValues={currentStore} />
                : <AccessDeniedCard message='Only owner / admin of this store can view this page' />
        )
    } else {
        return <AccessDeniedCard />
    }
}

export default EditStorePage;