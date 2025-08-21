"use client";

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Mail, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { createEmailVerification, verifyEmailAction } from '@/lib/actions/auth.action';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useState } from 'react';
import { CurrentUserType } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifyEmilSchema } from '@/lib/schemas/user-schema';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

interface ProfileEmailVerificationBannerProps {
    user: CurrentUserType;
    onDismiss?: () => void;
}

export const ProfileEmailVerificationBanner = ({ user, onDismiss }: ProfileEmailVerificationBannerProps) => {
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);

    const verificationForm = useForm<z.infer<typeof verifyEmilSchema>>({
        resolver: zodResolver(verifyEmilSchema),
        defaultValues: {
            userId: user!.$id,
            secret: ''
        },
        mode: "onChange"
    });

    const { execute: sendVerification, isPending: isSendingVerification } = useAction(createEmailVerification, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success('Verification email sent successfully');
                setVerificationSent(true);
                setShowVerificationInput(true);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to send verification email');
        }
    });

    const { execute: verifyEmail, isPending: isVerifyingEmail } = useAction(verifyEmailAction, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success('Email verified successfully');
                setShowVerificationInput(false);
                setVerificationSent(false);
                verificationForm.reset();
                router.refresh();
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Email verification failed');
        }
    });

    const handleSendVerification = () => {
        sendVerification();
    };

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    const onVerificationSubmit = (data: z.infer<typeof verifyEmilSchema>) => {
        verifyEmail(data);
    };

    if (!user || user.emailVerification || dismissed) return null;

    const isLoading = isSendingVerification || isVerifyingEmail;

    return (
        <div className="mb-6">
            <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="flex items-center justify-between w-full">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-orange-800">Email verification required</span>
                            <Badge variant="outline" className="bg-white text-orange-700 border-orange-300">
                                {user.email}
                            </Badge>
                        </div>
                        <p className="text-sm text-orange-700">
                            {verificationSent
                                ? "We've sent a verification code to your email. Enter it below to verify your account."
                                : "Please verify your email address to secure your account and access all features."
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {!showVerificationInput && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSendVerification}
                                disabled={isLoading}
                                className="text-orange-800 border-orange-300 hover:bg-orange-100"
                            >
                                {isSendingVerification ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Verification
                                    </>
                                )}
                            </Button>
                        )}

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

            {showVerificationInput && (
                <div className="mt-3 p-4 border border-orange-200 rounded-lg bg-white">
                    <Form {...verificationForm}>
                        <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="flex gap-2">
                            <FormField
                                control={verificationForm.control}
                                name="secret"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter verification code from email"
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} size="sm">
                                {isVerifyingEmail ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Verify
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                    <p className="text-xs text-muted-foreground mt-2">
                        Check your email inbox and spam folder for the verification code.
                    </p>
                </div>
            )}
        </div>
    );
};