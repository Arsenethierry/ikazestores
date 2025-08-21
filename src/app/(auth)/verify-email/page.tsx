import { EmailVerificationCard } from '@/features/auth/components/email-verification-card';
import { getLoggedInUser } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

interface VerifyEmailPageProps {
    searchParams: {
        userId?: string;
        secret?: string;
    };
}

async function VerifyEmailContent({ searchParams }: VerifyEmailPageProps) {
    const user = await getLoggedInUser();

    // If user is not logged in, redirect to sign in
    if (!user) redirect("/sign-in");

    const { userId, secret } = searchParams;

    // Use the logged-in user's ID if userId is not provided in search params
    const verificationUserId = userId || user.$id;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <EmailVerificationCard
                userId={verificationUserId}
                secret={secret}
                skipUrl="/profile"
            />
        </div>
    );
}

export default function VerifyEmailPage(props: VerifyEmailPageProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        }>
            <VerifyEmailContent {...props} />
        </Suspense>
    );
}
