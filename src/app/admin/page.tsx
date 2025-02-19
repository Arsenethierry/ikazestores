import ProductsRefPage from '@/components/teams-reference-component';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React from 'react';

const SysAdminPage = async () => {
    const { isAuthenticated, isSystemAdmin, isPhysicalStoreOwner, isVirtualStoreOwner} = await getAuthState();

    if (!isAuthenticated) redirect("/sign-in?redirectUrl=/admin")
    if (!isSystemAdmin && !isPhysicalStoreOwner && !isVirtualStoreOwner) redirect("/");

    return (
        <>
            <ProductsRefPage />
        </>
    );
}

export default SysAdminPage;