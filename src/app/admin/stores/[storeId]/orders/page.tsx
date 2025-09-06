import { AccessDeniedCard } from "@/components/access-denied-card";
import { OrdersDashboard } from "@/features/order/components/orders-dashboard";
import { getPhysicalStoreById } from "@/lib/actions/physical-store.action";
import { getVirtualStoreById } from "@/lib/actions/virtual-store.action";
import { getAuthState, isStoreOwner } from "@/lib/user-permission";
import { redirect } from "next/navigation";

interface PageProps {
    params: Promise<{ storeId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StoreOrdersPage({
    params,
    searchParams,
}: PageProps) {
    const { storeId } = await params;
    const urlParams = await searchParams;

    const {
        isVirtualStoreOwner,
        user,
        isPhysicalStoreOwner,
        isSystemAdmin,
        canAccessStore,
        getStoreRole
    } = await getAuthState();

    const hasStoreAccess = isVirtualStoreOwner || isPhysicalStoreOwner || isSystemAdmin;

    if (!hasStoreAccess) {
        return <AccessDeniedCard message={'Access denied: Store admin permissions required'} />;
    }

    if (!canAccessStore(storeId)) {
        return <AccessDeniedCard message={'Access denied: You do not have permission to access this store'} />;
    }

    let storeType: 'virtual' | 'physical' | undefined;
    let currentStore = null;
    let userRole: 'admin' | 'physical_store' | 'virtual_store' = 'admin';

    try {
        const virtualStore = await getVirtualStoreById(storeId);
        if (virtualStore) {
            currentStore = virtualStore;
            storeType = 'virtual';

            if (!isSystemAdmin && !isStoreOwner(user, virtualStore)) {
                redirect("/admin");
            }

            userRole = isSystemAdmin ? 'admin' : 'virtual_store';

        } else {
            const physicalStore = await getPhysicalStoreById(storeId);
            if (physicalStore) {
                currentStore = physicalStore;
                storeType = 'physical';

                if (!isSystemAdmin && !isStoreOwner(user, physicalStore)) {
                    redirect("/admin");
                }

                userRole = isSystemAdmin ? 'admin' : 'physical_store';
            } else {
                return <AccessDeniedCard message={'Store not found'} />;
            }
        }
    } catch (error) {
        console.error('Error fetching store:', error);
        return <AccessDeniedCard message={'Error accessing store'} />;
    }

    const storeRole = getStoreRole(storeId);
    const permissions = {
        canUpdateStatus: storeRole === 'owner' || storeRole === 'admin' || isSystemAdmin,
        canUpdateFulfillment: storeType === 'physical' && (storeRole === 'owner' || storeRole === 'admin' || isSystemAdmin),
        canCancel: storeRole === 'owner' || isSystemAdmin,
        canBulkUpdate: storeRole === 'owner' || isSystemAdmin,
        canViewAll: true
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">
                        Manage orders for {currentStore?.storeName || 'your store'}
                    </p>
                </div>
            </div>

            <OrdersDashboard
                storeId={storeId}
                storeType={storeType}
                userRole={userRole}
                currentStore={currentStore}
                permissions={permissions}
                searchParams={urlParams}
            />
        </div>
    )
}