import { ForgotPasswordCard } from '@/features/auth/components/forgot-password-card';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import React from 'react';

async function ForgotPasswordPage() {
    const user = await getLoggedInUser();

    if (user) redirect("/");

    return <ForgotPasswordCard />
}

export default ForgotPasswordPage;