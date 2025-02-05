import { SignUpCard } from '@/features/auth/components/sign-up-card';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react';

async function SignUpPage() {
    const user = await getLoggedInUser();

    if (user) redirect("/");
    return (
        <SignUpCard />
    );
}

export default SignUpPage;