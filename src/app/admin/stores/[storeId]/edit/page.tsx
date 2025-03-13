import { PhysicalStoreForm } from '@/features/stores/components/physical-store-form';
import { VirtualStoreForm } from '@/features/stores/components/vitual-store-form ';
import { getPhysicalStoreById } from '@/lib/actions/physical-store.action';
import { getVirtualStoreById } from '@/lib/actions/vitual-store.action';
import { getAuthState } from '@/lib/user-label-permission';
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

    const currentStore = isVirtualStoreOwner
        ? await getVirtualStoreById(storeId)
        : isPhysicalStoreOwner ? await getPhysicalStoreById(storeId) : undefined

    if (!currentStore || currentStore.total === 0) {
        redirect("/admin/stores/new")
    }

    const isStoreOwner = user && user?.$id === currentStore.owner.$id

    if (!isStoreOwner) {
        redirect("/admin")
    }
    return (
        <div>
            {isVirtualStoreOwner ? (
                <VirtualStoreForm currentUser={user} initialValues={currentStore} />
            ) : isPhysicalStoreOwner ? (
                <PhysicalStoreForm currentUser={user} />
            ) : null}
        </div>
    );
}

export default EditStorePage;