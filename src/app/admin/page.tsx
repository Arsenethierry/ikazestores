import ProductsRefPage from '@/components/teams-reference-component';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react';

const SysAdminPage = async () => {
    const user = await getLoggedInUser();

    if (!user) redirect("/sign-in?redirectUrl=/admin")
    if (!user.labels.includes("superAdmin")) redirect("/");

    return (
        <>
            <ProductsRefPage />
        </>
    );
}

export default SysAdminPage;