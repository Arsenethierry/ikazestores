"use client";

import ErrorAlert from "@/components/error-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { initiatePasswordRecovery } from "@/lib/actions/auth.action";
import { InitiatePasswordRecoverySchema } from "@/lib/schemas/user-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export const ForgotPasswordCard = () => {
    const [emailSent, setEmailSent] = React.useState(false);

    const form = useForm<z.infer<typeof InitiatePasswordRecoverySchema>>({
        resolver: zodResolver(InitiatePasswordRecoverySchema),
        defaultValues: {
            email: "",
        },
        mode: "onChange",
    });

    const { execute, isPending, result } = useAction(initiatePasswordRecovery, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success('Password reset email sent successfully');
                setEmailSent(true);
            } else if (data?.error) {
                toast.error(data?.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to send password reset email');
        }
    });

    const onSubmit = (values: z.infer<typeof InitiatePasswordRecoverySchema>) => {
        execute(values);
    };

    if (emailSent) {
        return (
            <div className='w-full max-w-lg mx-auto'>
                <Card className='w-full shadow-none space-y-4 border-0 sm:border sm:shadow-sm'>
                    <CardHeader className='space-y-2 text-center'>
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                        <CardTitle className='text-xl sm:text-2xl font-semibold'>
                            Check Your Email
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="text-muted-foreground">
                            We've sent a password reset link to <strong>{form.getValues('email')}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Please check your email and click the link to reset your password.
                            The link will expire in 1 hour.
                        </p>
                        <div className="space-y-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setEmailSent(false)}
                                className="w-full"
                            >
                                Send Another Email
                            </Button>
                            <Link href="/sign-in">
                                <Button variant="ghost" className="w-full">
                                    Back to Sign In
                                </Button>
                            </Link>
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
                        Reset Your Password
                    </CardTitle>
                    <p className="text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {result?.data?.error && <ErrorAlert errorMessage={result?.data?.error} />}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your email address"
                                                type="email"
                                                {...field}
                                            />
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
                                {isPending ? 'Sending...' : 'Send Reset Link'}
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
    )
}