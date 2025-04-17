import { PhyscalStoreCard } from '@/features/stores/components/physical-store-card';
import { StoreCard } from '@/features/stores/components/store-card';
import { getPhysicalStoreById } from '@/lib/actions/physical-store.action';
import { getVirtualStoreById } from '@/lib/actions/vitual-store.action';
import { PhysicalStoreTypes, VirtualStoreTypes } from '@/lib/types';
import { getAuthState, isStoreOwner } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function StoreAdminPage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    const {
        isVirtualStoreOwner,
        isPhysicalStoreOwner,
        user
    } = await getAuthState();


    const currentStore = isVirtualStoreOwner
        ? await getVirtualStoreById(storeId)
        : isPhysicalStoreOwner 
            ? await getPhysicalStoreById(storeId) 
            : undefined;

    if (!currentStore || currentStore.total === 0) {
        redirect("/admin/stores/new");
    }

    if (!isStoreOwner(user, currentStore)) {
        redirect("/admin");
    }

    return (
        <div>
            {isPhysicalStoreOwner ? (
                <PhyscalStoreCard
                    store={currentStore as PhysicalStoreTypes}
                    currentUser={user}
                />
            ) : (
                <StoreCard
                    store={currentStore as VirtualStoreTypes}
                    currentUser={user}
                />
            )}
        </div>
    );
}