'use client'

import SpinningLoader from "@/components/spinning-loader";
import { physicalStoreKeys, virtualStoreKeys } from "@/hooks/queries-and-mutations/query-keys";
import { getAllPshyicalStoresByOwnerId } from "@/lib/actions/physical-store.action";
import { getAllVirtualStoresByOwnerId } from "@/lib/actions/virtual-store.action";
import { CurrentUserType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation"
import { useEffect } from "react";

export default function AdminEntry({
    isVirtualStoreOwner,
    currentUser,
    isPhysicalStoreOwner,
    isSystemAdmin
}: {
    isVirtualStoreOwner: boolean;
    isPhysicalStoreOwner: boolean;
    isSystemAdmin: boolean;
    currentUser: CurrentUserType;
}) {
    const router = useRouter();

    const { data: stores, isLoading: storesLoading, error } = useQuery({
        queryKey: isVirtualStoreOwner 
            ? virtualStoreKeys.list({ ownerId: currentUser?.$id })
            : isPhysicalStoreOwner 
                ? physicalStoreKeys.byOwner(currentUser?.$id || '')
                : ['user-stores', currentUser?.$id],
        queryFn: async () => {
            if (!currentUser) return null;

            if (isVirtualStoreOwner) {
                return {
                    type: 'virtual',
                    data: await getAllVirtualStoresByOwnerId(currentUser.$id)
                };
            } else if (isPhysicalStoreOwner) {
                return {
                    type: 'physical',
                    data: await getAllPshyicalStoresByOwnerId(currentUser.$id)
                }
            }

            return null;
        },
        enabled: !!currentUser && !isSystemAdmin,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    useEffect(() => {
        if (storesLoading || error || isSystemAdmin) return;

        const currentPath = window.location.pathname;

        if (isSystemAdmin && currentPath === '/admin') {
            return;
        }

        if (isSystemAdmin) {
            router.replace('/admin');
            return;
        }

        if (!stores || !stores.data || stores.data.total === 0) {
            router.replace('/admin/stores/new');
            return;
        }

        const firstStore = stores.data.documents[0];
        router.replace(`/admin/stores/${firstStore.$id}`)

    }, [isPhysicalStoreOwner, isSystemAdmin, isVirtualStoreOwner, stores, storesLoading, router, error]);

    if (storesLoading) return <SpinningLoader />;

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-red-600">Error Loading Stores</h1>
                <p className="text-muted-foreground mt-2">
                    Failed to load your stores. Please refresh the page to try again.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Refresh Page
                </button>
            </div>
        );
    }

    return null;
}