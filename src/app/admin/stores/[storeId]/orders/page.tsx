import { AccessDeniedCard } from '@/components/access-denied-card';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { getAuthState, isStoreOwner } from '@/lib/user-permission';
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
        user
    } = await getAuthState();


    if (!isVirtualStoreOwner) {
        return <AccessDeniedCard message={'Only affliate store'} />
    }

    const currentStore = await getVirtualStoreById(storeId)

    if (currentStore && !isStoreOwner(user, currentStore)) {
        redirect("/admin");
    }
    return (
        <div>
            Store orders
        </div>
    );
}