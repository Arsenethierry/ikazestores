import { SignUpCard } from '@/features/auth/components/sign-up-card';
import { StoreSignUpCard } from '@/features/auth/components/store-signup-card';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { notFound, redirect } from 'next/navigation';
import React from 'react';

interface SignUpPageProps {
    params: Promise<{ currentStoreId: string }>;
}

async function SignUpPage({ params }: SignUpPageProps) {
    const { currentStoreId } = await params;
    
    // Check if user is already logged in
    const user = await getLoggedInUser();
    if (user) redirect("/");

    // Fetch store data with SSR
    const store = await getVirtualStoreById(currentStoreId);
    if (!store) notFound();

    return <StoreSignUpCard store={store} />;
}

export default SignUpPage;