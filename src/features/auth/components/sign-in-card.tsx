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

interface SignInCardProps {
    isModal?: boolean;
}

export const SignInCard = ({ isModal = false }: SignInCardProps) => {
    const { mutate, isPending, error } = useLogin();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    });

    const onSubmit = async (values: z.infer<typeof loginSchema>) => {
        mutate(values);
    }

    return (
        <div className={cn(
            "h-max m-auto",
            isModal && "py-5"
        )}>
            <Card className={cn(
                "w-full md:w-[487px] shadow-none space-y-6",
                isModal && "border-none shadow-none"
            )}>
                <CardHeader className='flex items-center justify-center text-center'>
                    <CardTitle className='text-2xl'>
                        Log In
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && <ErrorAlert errorMessage={error?.message} />}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Email" {...field} />
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
                                            <Input type="password" placeholder="Enter password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button disabled={isPending} className='w-full' size={'lg'}>
                                <Loader className={isPending ? "animate-spin" : "hidden"} /> {" "}
                                Login
                            </Button>
                        </form>
                    </Form>
                    <div className="my-7 w-full flex items-center justify-center overflow-hidden">
                        <Separator />
                        <span className="text-sm px-2">OR</span>
                        <Separator />
                    </div>
                    <Button disabled={isPending} variant={'outline'} className="w-full">
                        <GoogleLogo />
                        Continue with Google
                    </Button>
                </CardContent>
            </Card>
            <div className="mt-5 space-y-5">
                <Link
                    href="#"
                    className="text-sm block underline text-muted-foreground text-center"
                >
                    Forgot your password?
                </Link>
                <p className="text-sm text-center">
                    Don&apos;t have an account?
                    <Link href="/sign-up" className="ml-1 underline text-muted-foreground">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}