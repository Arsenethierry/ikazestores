import { StoreSignInCard } from '@/features/auth/components/store-signin-card';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { redirect, notFound } from 'next/navigation';
import React from 'react';

interface SignInPageProps {
    params: Promise<{ currentStoreId: string }>;
}

async function SignInPage({ params }: SignInPageProps) {
    const { currentStoreId } = await params;
    
    const user = await getLoggedInUser();
    if (user) redirect("/");

    const store = await getVirtualStoreById(currentStoreId);
    if (!store) notFound();

    return <StoreSignInCard store={store} />;
}

export default SignInPage;