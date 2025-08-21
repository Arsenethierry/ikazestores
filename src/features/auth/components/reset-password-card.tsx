"use client";

import ErrorAlert from "@/components/error-alert";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { completePasswordRecovery } from "@/lib/actions/auth.action";
import { CompletePasswordRecoverySchema } from "@/lib/schemas/user-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface ResetPasswordCardProps {
    userId: string;
    secret: string;
}

export const ResetPasswordCard = ({ userId, secret }: ResetPasswordCardProps) => {
    const router = useRouter();
    const [passwordReset, setPasswordReset] = useState(false);

    const form = useForm<z.infer<typeof CompletePasswordRecoverySchema>>({
        resolver: zodResolver(CompletePasswordRecoverySchema),
        defaultValues: {
            userId,
            secret,
            newPassword: "",
            confirmPassword: ""
        },
        mode: "onChange",
    });

    const { execute, isPending, result } = useAction(completePasswordRecovery, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success('Password reset successful');
                setPasswordReset(true);
                // Redirect to sign in after 3 seconds
                setTimeout(() => {
                    router.push('/sign-in');
                }, 3000);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to reset password');
        }
    });

    const onSubmit = (values: z.infer<typeof CompletePasswordRecoverySchema>) => {
        execute(values);
    };

    if (passwordReset) {
        return (
            <div className='w-full max-w-lg mx-auto'>
                <Card className='w-full shadow-none space-y-4 border-0 sm:border sm:shadow-sm'>
                    <CardHeader className='space-y-2 text-center'>
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <CardTitle className='text-xl sm:text-2xl font-semibold'>
                            Password Reset Successful
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="text-muted-foreground">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Redirecting to sign in page...
                        </p>
                        <Link href="/sign-in">
                            <Button className="w-full">
                                Go to Sign In
                            </Button>
                        </Link>
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
                        Set New Password
                    </CardTitle>
                    <p className="text-muted-foreground">
                        Enter your new password below.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {result?.data?.error && <ErrorAlert errorMessage={result?.data?.error} />}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <PasswordInput placeholder="Enter new password" {...field} />
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
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <PasswordInput placeholder="Confirm new password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                disabled={isPending}
                                className='w-full'
                                type="submit"
                            >
                                {isPending ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </form>
                    </Form>

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