"use client";

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, X } from 'lucide-react';
import { createEmailVerification } from '@/lib/actions/auth.action';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import Link from 'next/link';
import { useState } from 'react';

interface EmailVerificationBannerProps {
    userEmail?: string;
    onDismiss?: () => void;
}

export const EmailVerificationBanner = ({ userEmail, onDismiss }: EmailVerificationBannerProps) => {
    const [dismissed, setDismissed] = useState(false);

    const { execute: sendVerification, isPending } = useAction(createEmailVerification, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success('Verification email sent successfully');
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to send verification email');
        }
    });

    const handleSendVerification = () => {
        sendVerification();
    };

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    if (dismissed) return null;

    return (
        <Alert className="border-orange-200 bg-orange-50 text-orange-800">
            <Mail className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between w-full">
                <div className="flex-1">
                    <span className="font-medium">Email not verified.</span>
                    {userEmail && (
                        <span className="ml-1">
                            Please verify your email address ({userEmail}) to access all features.
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendVerification}
                        disabled={isPending}
                        className="text-orange-800 border-orange-300 hover:bg-orange-100"
                    >
                        {isPending ? 'Sending...' : 'Send Email'}
                    </Button>
                    <Link href="/verify-email">
                        <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            Verify Now
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                        className="text-orange-600 hover:bg-orange-100 p-1"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}