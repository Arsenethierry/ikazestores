'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllPshyicalStoresByOwnerId } from '@/lib/actions/physical-store.action'
import { getAllVirtualStoresByOwnerId } from '@/lib/actions/vitual-store.action'
import { getAuthState } from '@/lib/user-label-permission'
import SpinningLoader from '@/components/spinning-loader'

export default function AdminEntry() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const handleRedirect = async () => {
            const {
                isVirtualStoreOwner,
                isPhysicalStoreOwner,
                user,
                isSystemAdmin
            } = await getAuthState()

            if (!user) {
                router.replace('/sign-in')
                return
            }

            if (isSystemAdmin) {
                setLoading(false)
                return
            }

            const stores = isVirtualStoreOwner
                ? await getAllVirtualStoresByOwnerId(user.$id)
                : isPhysicalStoreOwner
                    ? await getAllPshyicalStoresByOwnerId(user.$id)
                    : null

            if (!stores || stores.total === 0) {
                router.replace('/admin/stores/new')
            } else {
                router.replace(`/admin/stores/${stores.documents[0].$id}`)
            }
        }

        handleRedirect()
    }, [router])

    if (loading) return <SpinningLoader />
    return <div>System Admin dashboard</div>
}
