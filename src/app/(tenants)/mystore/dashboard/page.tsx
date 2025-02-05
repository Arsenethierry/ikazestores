import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react';

async function page() {
    const user = await getLoggedInUser();

    if (!user) redirect("/");
    return (
        <div>
            Dashboard
        </div>
    );
}

export default page;