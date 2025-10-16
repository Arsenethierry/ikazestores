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
import Link from 'next/link';
import ErrorAlert from '@/components/error-alert';
import { loginWithGoogle, logInAction } from '@/lib/actions/auth.action';
import { GoogleLogInButton } from '@/features/auth/components/google-login-button';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/password-input';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSchema } from '@/lib/schemas/user-schema';
import { VirtualStoreTypes } from '@/lib/types';
import { generateColorFromName } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';

interface StoreSignInCardProps {
    store: VirtualStoreTypes;
}

export const StoreSignInCard = ({ store }: StoreSignInCardProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirectUrl');
    const colors = generateColorFromName(store.storeName);
    const [googleLoginPending, setGoogleLoginPending] = useState(false);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const { execute: handleLogin, isPending } = useAction(logInAction, {
        onSuccess: (result) => {
            if (result.data?.error) {
                toast.error(result.data.error);
                form.setError('root', {
                    message: result.data.error,
                });
                return;
            }

            if (result.data?.success) {
                toast.success('Welcome back!');

                // Redirect to original page or home
                if (redirectUrl) {
                    router.push(redirectUrl);
                } else {
                    router.push('/');
                }
            }
        },
        onError: (error) => {
            toast.error(error.error.serverError || 'Failed to sign in');
        },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        handleLogin(values);
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

    return (
        <Card className="shadow-lg">
            <CardHeader className="space-y-2">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                        }}
                    >
                        <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                    Welcome Back
                </CardTitle>
                <CardDescription className="text-center">
                    Sign in to continue shopping at {store.storeName}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="john@example.com"
                                            {...field}
                                            autoComplete="email"
                                        />
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
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs underline hover:text-primary transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <PasswordInput {...field} autoComplete="current-password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.formState.errors.root && (
                            <ErrorAlert
                                errorMessage={"Sign In Failed: " + form.formState.errors.root.message || 'Invalid credentials'}
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
                            {isPending ? 'Signing In...' : 'Sign In'}
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

                        <div className="text-center space-y-2 pt-4">
                            {/* Store-specific benefits reminder */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="text-xs text-muted-foreground">
                                    💡 Members get exclusive deals and early access to new products at {store.storeName}
                                </p>
                            </div>

                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Don&apos;t have an account?{' '}
                                <Link
                                    href="/sign-up"
                                    className="underline hover:text-foreground transition-colors font-medium"
                                    style={{ color: colors.primary }}
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};