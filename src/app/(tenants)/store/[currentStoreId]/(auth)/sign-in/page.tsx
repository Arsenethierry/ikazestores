import { SignInCard } from '@/features/auth/components/sign-in-card';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react';

async function SignInPage() {
    const user = await getLoggedInUser();

    if (user) redirect("/");
    return <SignInCard />
}

export default SignInPage;