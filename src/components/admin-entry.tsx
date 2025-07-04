'use client'

import SpinningLoader from "@/components/spinning-loader";
import { getAllPshyicalStoresByOwnerId } from "@/lib/actions/physical-store.action";
import { getAllVirtualStoresByOwnerId } from "@/lib/actions/vitual-store.action";
import { getAuthState } from "@/lib/user-permission";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation"
import { useEffect } from "react";

export default function AdminEntry() {
    const router = useRouter();

    const { data: authState, isLoading: authLoading } = useQuery({
        queryKey: ['authState'],
        queryFn: getAuthState,
        staleTime: 5 * 60 * 1000
    })

    const { data: stores, isLoading: storesLoading } = useQuery({
        queryKey: ['stores', authState?.user?.$id, authState?.isVirtualStoreOwner, authState?.isPhysicalStoreOwner],
        queryFn: async () => {
            if (!authState?.user) return null;

            if (authState.isVirtualStoreOwner) {
                return getAllVirtualStoresByOwnerId(authState.user.$id)
            } else if (authState.isPhysicalStoreOwner) {
                return getAllPshyicalStoresByOwnerId(authState.user.$id)
            }
            return null
        },
        enabled: !!authState?.user && !authState?.isSystemAdmin,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (authLoading || storesLoading) return

        if (!authState?.user) {
            router.replace('/sign-in')
            return
        }

        if (authState.isSystemAdmin) {
            return
        }

        if (!stores || stores.total === 0) {
            router.replace('/admin/stores/new')
        } else {
            router.replace(`/admin/stores/${stores.documents[0].$id}`)
        }
    }, [authState, stores, authLoading, storesLoading, router]);

    if (authLoading || storesLoading) return <SpinningLoader />

    if (authState?.isSystemAdmin) {
        return <div>System Admin dashboard</div>
    }

    return null
}
