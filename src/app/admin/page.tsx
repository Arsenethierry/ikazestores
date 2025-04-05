import { getAllPshyicalStoresByOwnerId } from '@/lib/actions/physical-store.action';
import { getAllVirtualStoresByOwnerId } from '@/lib/actions/vitual-store.action';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';

export default async function AdminEntry() {
    const {
        isVirtualStoreOwner,
        isPhysicalStoreOwner,
        user,
        isAuthenticated,
        isSystemAdmin
    } = await getAuthState();

    if (!isAuthenticated || !user) redirect("/sign-in");

    if (isSystemAdmin) {
        return (
            <p>System Admin dashboard</p>
        )
    }

    const stores = isVirtualStoreOwner
        ? await getAllVirtualStoresByOwnerId(user.$id)
        : isPhysicalStoreOwner
            ? await getAllPshyicalStoresByOwnerId(user.$id)
            : null

    if (!stores || stores.total === 0) {
        redirect("/admin/stores/new")
    } else {
        redirect(`/admin/stores/${stores.documents[0].$id}`)
    }
}