import AdminEntry from "@/components/admin-entry";
import { physicalStoreKeys, virtualStoreKeys } from "@/hooks/queries-and-mutations/query-keys";
import { getAllPshyicalStoresByOwnerId } from "@/lib/actions/physical-store.action";
import { getAllVirtualStoresByOwnerId } from "@/lib/actions/virtual-store.action";
import { getAuthState } from "@/lib/user-permission";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export default async function AdminPage() {
    const queryClient = new QueryClient();
    const {
        isPhysicalStoreOwner,
        isSystemAdmin,
        isVirtualStoreOwner,
        user
    } = await getAuthState();

    if (user && !isSystemAdmin) {
        try {
            if (isVirtualStoreOwner) {
                await queryClient.prefetchQuery({
                    queryKey: virtualStoreKeys.list({ ownerId: user.$id }),
                    queryFn: async () => ({
                        type: 'virtual',
                        data: await getAllVirtualStoresByOwnerId(user.$id)
                    }),
                    staleTime: 5 * 60 * 1000,
                });
            } else if (isPhysicalStoreOwner) {
                await queryClient.prefetchQuery({
                    queryKey: physicalStoreKeys.byOwner(user.$id),
                    queryFn: async () => ({
                        type: 'physical',
                        data: await getAllPshyicalStoresByOwnerId(user.$id)
                    }),
                    staleTime: 5 * 60 * 1000,
                });
            }
        } catch (error) {
            console.error('Failed to prefetch store data:', error);
        }
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <AdminEntry
                currentUser={user}
                isPhysicalStoreOwner={isPhysicalStoreOwner}
                isSystemAdmin={isSystemAdmin}
                isVirtualStoreOwner={isVirtualStoreOwner}
            />
        </HydrationBoundary>
    )
}