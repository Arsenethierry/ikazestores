"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { GoogleLogInButton } from '@/features/auth/components/google-login-button';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/password-input';
import { useRouter } from 'next/navigation';
import { signupSchema } from '@/lib/schemas/user-schema';
import { CheckCircle, Mail, Bell } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { subscribeToStoreAction } from '@/lib/actions/store-subscribers.action';
import { VirtualStoreTypes } from '@/lib/types';
import { generateColorFromName } from '@/lib/utils';

type SignUpStep = 'form' | 'verification-prompt' | 'success';

interface StoreSignUpCardProps {
    store: VirtualStoreTypes;
}

export const StoreSignUpCard = ({ store }: StoreSignUpCardProps) => {
    const router = useRouter();
    const colors = generateColorFromName(store.storeName);
    const [googleLoginPending, setGoogleLoginPending] = useState(false);
    const [currentStep, setCurrentStep] = useState<SignUpStep>('form');
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [subscribeToMarketing, setSubscribeToMarketing] = useState(true);

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phoneNumber: '',
            password: '',
        },
    });

    const { execute: handleSignUpAction, isPending } = useAction(signUpAction, {
        onSuccess: async (result) => {
            if (result.data?.error) {
                toast.error(result.data.error);
                return;
            }

            if (result.data?.user) {
                const newUserId = result.data.user.$id;
                const newUserEmail = result.data.user.email;
                setUserId(newUserId);
                setUserEmail(newUserEmail);

                // Subscribe user to store
                if (subscribeToMarketing) {
                    try {
                        await subscribeToStoreAction({ storeId: store.$id });
                    } catch (error) {
                        console.error('Failed to subscribe to store:', error);
                        // Don't block signup flow if subscription fails
                    }
                }

                setCurrentStep('verification-prompt');
            }
        },
        onError: (error) => {
            toast.error(error.error.serverError || 'Failed to create account');
        },
    });

    const { execute: sendVerificationEmail, isPending: isVerificationPending } = useAction(createEmailVerification, {
        onSuccess: (result) => {
            if (result.data?.success) {
                setCurrentStep('success');
                toast.success('Verification email sent!');
            } else {
                toast.error(result.data?.error || 'Failed to send verification email');
            }
        },
    });

    async function onSubmit(values: z.infer<typeof signupSchema>) {
        handleSignUpAction(values);
    }

    async function handleGoogleLogin() {
        setGoogleLoginPending(true);
        try {
            await loginWithGoogle();
        } catch (error) {
            toast.error('Failed to login with Google');
            setGoogleLoginPending(false);
        }
    }


    if (currentStep === 'verification-prompt') {
        return (
            <Card className="shadow-lg">
                <CardHeader className="text-center">
                    <div
                        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                        }}
                    >
                        <Mail className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Check Your Email</CardTitle>
                    <CardDescription>
                        We sent a verification link to <strong>{userEmail}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            Click the link in your email to verify your account and start shopping at {store.storeName}.
                        </p>
                    </div>
                    <Button
                        onClick={() => sendVerificationEmail()}
                        disabled={isVerificationPending}
                        variant="outline"
                        className="w-full"
                    >
                        {isVerificationPending ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                    <Button
                        onClick={() => router.push('/')}
                        className="w-full"
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                        }}
                    >
                        Continue to Store
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (currentStep === 'success') {
        return (
            <Card className="shadow-lg">
                <CardHeader className="text-center">
                    <div
                        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                        }}
                    >
                        <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Welcome to {store.storeName}!</CardTitle>
                    <CardDescription>
                        Your account has been created successfully
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={() => router.push('/')}
                        className="w-full"
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                        }}
                    >
                        Start Shopping
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-bold text-center">
                    Create Your Account
                </CardTitle>
                <CardDescription className="text-center">
                    Join {store.storeName} and start shopping today
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
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
                                        <Input type="email" placeholder="john@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number (Optional)</FormLabel>
                                    <FormControl>
                                        <PhoneInput {...field} />
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
                                        <PasswordInput {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Store Marketing Subscription */}
                        <div className="flex items-start space-x-3 rounded-lg border p-4 bg-gray-50">
                            <Checkbox
                                id="marketing"
                                checked={subscribeToMarketing}
                                onCheckedChange={(checked) => setSubscribeToMarketing(checked as boolean)}
                            />
                            <div className="flex-1 space-y-1">
                                <label
                                    htmlFor="marketing"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                >
                                    <Bell className="h-4 w-4" />
                                    Subscribe to {store.storeName}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    Get exclusive deals, new product alerts, and special promotions from this store.
                                </p>
                            </div>
                        </div>

                        {form.formState.errors.root && (
                            <ErrorAlert
                                errorMessage={"Sign Up Failed: " + form.formState.errors.root.message || 'Something went wrong'}
                            />
                        )}

                        <Button
                            type="submit"
                            className="w-full text-white"
                            disabled={isPending}
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                            }}
                        >
                            {isPending ? 'Creating Account...' : 'Create Account'}
                        </Button>

                        <div className="relative my-6">
                            <Separator />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                                OR
                            </span>
                        </div>

                        <GoogleLogInButton
                            handler={handleGoogleLogin}
                            disabled={googleLoginPending}
                        />

                        <div className="text-center space-y-2">
                            <p className="text-xs text-muted-foreground">
                                By creating an account, you agree to our{' '}
                                <Link href="/terms" className="underline hover:text-foreground">
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link href="/privacy" className="underline hover:text-foreground">
                                    Privacy Policy
                                </Link>
                            </p>
                            <p className="text-sm text-center">
                                Already have an account?
                                <Link href="/sign-in" className="ml-1 underline text-muted-foreground hover:text-foreground">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}