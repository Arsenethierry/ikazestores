import { ResetPasswordCard } from '@/features/auth/components/reset-password-card';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

interface ResetPasswordPageProps {
    searchParams: {
        userId?: string;
        secret?: string;
    };
}

async function ResetPasswordContent({ searchParams }: ResetPasswordPageProps) {
    const user = await getLoggedInUser();

    if (user) redirect("/");

    const { userId, secret } = searchParams;

    if (!userId || !secret) {
        redirect('/forgot-password');
    }

    return <ResetPasswordCard userId={userId} secret={secret} />
}

export default function ResetPasswordPage(props: ResetPasswordPageProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        }>
            <ResetPasswordContent {...props} />
        </Suspense>
    );
}