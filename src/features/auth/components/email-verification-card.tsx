"use client";

import { createEmailVerification, verifyEmailAction } from "@/lib/actions/auth.action";
import { verifyEmilSchema } from "@/lib/schemas/user-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ErrorAlert from "@/components/error-alert";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface EmailVerificationCardProps {
    userId: string;
    secret?: string;
    skipUrl?: string; // URL to redirect if user skips verification
}

export const EmailVerificationCard = ({ userId, secret, skipUrl = "/profile" }: EmailVerificationCardProps) => {
    const router = useRouter();
    const [emailVerified, setEmailVerified] = React.useState(false);
    const [verificationSent, setVerificationSent] = React.useState(false);

    const form = useForm<z.infer<typeof verifyEmilSchema>>({
        resolver: zodResolver(verifyEmilSchema),
        defaultValues: {
            userId,
            secret: secret || "",
        },
        mode: "onChange",
    });

    const { execute: verifyEmail, isPending: isVerifying, result: verifyResult } = useAction(verifyEmailAction, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success('Email verified successfully');
                setEmailVerified(true);
                // Redirect after successful verification
                setTimeout(() => {
                    router.push('/profile');
                }, 2000);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Email verification failed');
        }
    });

    const { execute: resendVerification, isPending: isResending } = useAction(createEmailVerification, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success('Verification email sent successfully');
                setVerificationSent(true);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to send verification email');
        }
    });

    const onSubmit = (values: z.infer<typeof verifyEmilSchema>) => {
        verifyEmail(values);
    };

    const handleResendVerification = () => {
        resendVerification();
    };

    const handleSkipVerification = () => {
        router.push(skipUrl);
    };

    React.useEffect(() => {
        if (secret && !emailVerified && !isVerifying) {
            verifyEmail({ userId, secret });
        }
    }, [secret, userId, emailVerified, isVerifying, verifyEmail]);

    if (emailVerified) {
        return (
            <div className='w-full max-w-lg mx-auto'>
                <Card className='w-full shadow-none space-y-4 border-0 sm:border sm:shadow-sm'>
                    <CardHeader className='space-y-2 text-center'>
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <CardTitle className='text-xl sm:text-2xl font-semibold'>
                            Email Verified!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="text-muted-foreground">
                            Your email has been successfully verified. You can now access all features of your account.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Redirecting to your profile...
                        </p>
                        <Button
                            onClick={() => router.push('/profile')}
                            className="w-full"
                        >
                            Continue to Profile
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className='w-full max-w-lg mx-auto'>
            <Card className='w-full shadow-none space-y-4 border-0 sm:border sm:shadow-sm'>
                <CardHeader className='space-y-2 text-center'>
                    <div className="flex justify-center mb-4">
                        <Mail className="h-16 w-16 text-blue-500" />
                    </div>
                    <CardTitle className='text-xl sm:text-2xl font-semibold'>
                        Verify Your Email
                    </CardTitle>
                    <p className="text-muted-foreground">
                        {verificationSent
                            ? "We've sent a new verification email. Please check your inbox and enter the verification code below."
                            : "Please verify your email address to continue using all features."
                        }
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {verifyResult?.data?.error && <ErrorAlert errorMessage={verifyResult?.data?.error} />}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="secret"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Verification Code</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter verification code"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                disabled={isVerifying}
                                className='w-full'
                                type="submit"
                            >
                                {isVerifying ? 'Verifying...' : 'Verify Email'}
                            </Button>
                        </form>
                    </Form>

                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            onClick={handleResendVerification}
                            disabled={isResending}
                            className="w-full"
                        >
                            {isResending ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Resend Verification Email'
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleSkipVerification}
                            className="w-full"
                        >
                            Skip for Now
                        </Button>
                    </div>

                    <div className="text-center pt-4">
                        <Link
                            href="/sign-in"
                            className="text-sm underline text-muted-foreground"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}