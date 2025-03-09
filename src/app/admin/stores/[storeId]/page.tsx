import { StoreCard } from '@/features/stores/components/store-card';
import { getPhysicalStoreById } from '@/lib/actions/physical-store.action';
import { getVirtualStoreById } from '@/lib/actions/vitual-store.action';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function StoreAdminPage({
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

    const currentStore = isVirtualStoreOwner
        ? await getVirtualStoreById(storeId)
        : isPhysicalStoreOwner ? await getPhysicalStoreById(storeId) : undefined

    if (!currentStore || currentStore.total === 0) {
        redirect("/admin/stores/create")
    }
    
    return (
        <div>
            <StoreCard
                store={currentStore}
                currentUser={user}
            />
        </div>
    );
}