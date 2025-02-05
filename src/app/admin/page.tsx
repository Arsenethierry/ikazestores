import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react';

const SysAdminPage = async () => {
    const user = await getLoggedInUser();

    if (!user) redirect("/sign-in")
    if (!user.labels.includes("superAdmin")) redirect("/");

    return (
        <>
            {JSON.stringify(user)}
        </>
    );
}

export default SysAdminPage;