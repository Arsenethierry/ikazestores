"use client";

import { useForm } from 'react-hook-form';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GoogleLogo } from '@/components/icons';
import { loginSchema } from '../../../lib/schemas';
import { useLogin } from '../mutations/use-login';
import ErrorAlert from '@/components/error-alert';
import { useRouter, useSearchParams } from 'next/navigation';
interface SignInCardProps {
    isModal?: boolean;
}

export const SignInCard = ({ isModal = false }: SignInCardProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const redirectUrl = searchParams.get('redirectUrl')

    const { mutate, isPending, error } = useLogin();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: ""
        },
        mode: "onChange",
    });

    const onSubmit = async (values: z.infer<typeof loginSchema>) => {
        mutate(values, {
            onSuccess: () => {
                if (redirectUrl) {
                    router.push(redirectUrl)
                } else {
                    router.push("/")
                }
            }
        });

    }

    return (
        <div className={cn(
            "w-full max-w-lg mx-auto sm:p-6 md:p-8",
            isModal && "py-5"
        )}>
            <Card className={cn(
                "w-full shadow-none space-y-4 border-0 sm:border sm:shadow-sm",
                isModal && "border-none shadow-none"
            )}>
                <CardHeader className='space-y-2 text-center'>
                    <CardTitle className='text-xl sm:text-2xl font-semibold'>
                        Log In
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && <ErrorAlert errorMessage={error?.message} />}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm sm:text-base">Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Email"
                                                {...field}
                                                className="h-11 sm:h-12"
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
                                        <FormLabel className="text-sm sm:text-base">Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Enter password"
                                                {...field}
                                                className="h-11 sm:h-12"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                disabled={isPending}
                                className='w-full h-11 sm:h-12 text-sm sm:text-base'
                                size={'lg'}
                            >
                                {isPending && <Loader className="animate-spin mr-2" />}
                                Login
                            </Button>
                        </form>
                    </Form>
                    <div className="my-6 items-center gap-3 hidden">
                        <Separator className="flex-1" />
                        <span className="text-xs sm:text-sm text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                    </div>
                    <Button
                        variant={'outline'}
                        className="w-full hidden h-11 sm:h-12 gap-2 text-sm sm:text-base"
                        disabled={isPending}
                    >
                        <GoogleLogo />
                        Continue with Google
                    </Button>
                </CardContent>
            </Card>
            <div className="mt-6 space-y-3 text-center">
                <Link
                    href="#"
                    className="text-xs sm:text-sm underline text-muted-foreground hover:text-foreground transition-colors"
                >
                    Forgot your password?
                </Link>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/sign-up"
                        className="underline hover:text-foreground transition-colors"
                    >
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}
