"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { signupSchema } from '../schemas';
import { useSignup } from '../mutations/use-signup';
import { Separator } from '@/components/ui/separator';
import { GoogleLogo } from '@/components/icons';
import { PhoneInput } from '@/components/phone-input';
import Link from 'next/link';
import ErrorAlert from '@/components/error-alert';

export const SignUpCard = () => {
    const { mutate, isPending, error } = useSignup();
    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            password: "",
            username: "",
            phoneNumber: ""
        }
    });

    const onSubmit = (values: z.infer<typeof signupSchema>) => {
        mutate(values);
    }
    return (
        <div className='h-max m-auto'>
            <Card className='w-full md:w-[487px] shadow-none space-y-6'>
                <CardHeader className='flex items-center justify-center text-center'>
                    <CardTitle className='text-2xl'>
                        Creaye an account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && <ErrorAlert errorMessage={error?.message} />}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="full name" {...field} />
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
                                        <FormLabel>Business phone</FormLabel>
                                        <FormControl className="w-full">
                                            <PhoneInput
                                                placeholder="+2507......"
                                                {...field}
                                                defaultCountry="RW"
                                            />
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
                                            <Input placeholder="Enter password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button disabled={isPending} className='w-full' size={'lg'}>Sign Up</Button>
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
                    Already have an account?
                    <Link href="/sign-in" className="ml-1 underline text-muted-foreground">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}