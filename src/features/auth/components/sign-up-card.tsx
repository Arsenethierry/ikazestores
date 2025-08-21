"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Separator } from '@/components/ui/separator';
import { PhoneInput } from '@/components/phone-input';
import Link from 'next/link';
import ErrorAlert from '@/components/error-alert';
import { loginWithGoogle, signUpAction, createEmailVerification } from '@/lib/actions/auth.action';
import { GoogleLogInButton } from './google-login-button';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/password-input';
import { useRouter } from 'next/navigation';
import { signupSchema } from '@/lib/schemas/user-schema';
import { CheckCircle, Mail } from 'lucide-react';

type SignUpStep = 'form' | 'verification-prompt' | 'success';

export const SignUpCard = () => {
    const router = useRouter();
    const [googleLoginPending, setGoogleLoginPending] = useState(false);
    const [currentStep, setCurrentStep] = useState<SignUpStep>('form');
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState('');

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            password: "",
            fullName: "",
            phoneNumber: "",
            confirmPassword: ""
        },
        mode: "onChange",
    });

    const { execute: signUp, isPending: isSigningUp, result } = useAction(signUpAction, {
        onSuccess: async ({ data }) => {
            if (data?.success && data?.user) {
                toast.success(data?.success);
                setUserEmail(form.getValues('email'));
                setUserId(data.user.$id);
                setCurrentStep('verification-prompt');
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError);
        }
    });

    const { execute: sendVerification, isPending: isSendingVerification } = useAction(createEmailVerification, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success('Verification email sent successfully');
                router.push(`/verify-email?userId=${userId}`);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to send verification email');
        }
    });

    const onSubmit = (values: z.infer<typeof signupSchema>) => {
        signUp(values);
    };

    const handleLoginWithGoogle = async () => {
        setGoogleLoginPending(true);
        try {
            const result = await loginWithGoogle();
            if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.log("handleLoginWithGoogle error: ", error);
            toast.error('Failed to initiate Google login');
        } finally {
            setGoogleLoginPending(false);
        }
    };

    const handleVerifyEmail = () => {
        sendVerification();
    };

    const handleSkipVerification = () => {
        router.push('/profile');
    };

    const isLoading = isSigningUp || googleLoginPending || isSendingVerification;

    if (currentStep === 'verification-prompt') {
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
                            To get the most out of your account, we recommend verifying your email address.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-900">Benefits of email verification:</p>
                                    <ul className="mt-2 text-blue-800 space-y-1">
                                        <li>• Secure your account</li>
                                        <li>• Receive important notifications</li>
                                        <li>• Password recovery options</li>
                                        <li>• Access to all platform features</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                We'll send a verification email to: <strong>{userEmail}</strong>
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={handleVerifyEmail}
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isSendingVerification ? 'Sending...' : 'Send Verification Email'}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleSkipVerification}
                                disabled={isLoading}
                                className="w-full"
                            >
                                Skip for Now
                            </Button>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-xs text-muted-foreground">
                                You can always verify your email later from your profile settings.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className='w-full max-w-lg mx-auto'>
            <Card className='w-full shadow-none space-y-4 border-0 sm:border sm:shadow-sm'>
                <CardHeader className='space-y-2 text-center'>
                    <CardTitle className='text-xl sm:text-2xl font-semibold'>
                        Create account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {result?.data?.error && <ErrorAlert errorMessage={result?.data?.error} />}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className='border p-2 rounded-md space-y-4'>
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your full name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <PasswordInput placeholder="Enter password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <PasswordInput placeholder="Confirm password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col items-start">
                                            <FormLabel>Phone number</FormLabel>
                                            <FormControl className="w-full">
                                                <PhoneInput
                                                    placeholder="+250 7XX XXX XXX"
                                                    {...field}
                                                    defaultCountry="RW"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    disabled={isLoading}
                                    className='w-full'
                                    type="submit"
                                >
                                    {isSigningUp ? 'Creating account...' : 'Create Account'}
                                </Button>
                            </div>
                        </form>
                    </Form>

                    <div className="my-7 w-full flex items-center justify-center overflow-hidden">
                        <Separator />
                        <span className="text-sm px-2">OR</span>
                        <Separator />
                    </div>

                    <GoogleLogInButton
                        disabled={isLoading}
                        handler={handleLoginWithGoogle}
                    />

                </CardContent>
            </Card>
            <div className="mt-5 space-y-5">
                <Link
                    href="/forgot-password"
                    className="text-sm block underline text-muted-foreground text-center"
                >
                    Forgot your password?
                </Link>
                <p className="text-sm text-center">
                    Already have an account?
                    <Link href="/sign-in" className="ml-1 underline text-muted-foreground">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};