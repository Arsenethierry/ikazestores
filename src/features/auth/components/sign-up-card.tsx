"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { signupSchema } from '../../../lib/schemas';
import { Separator } from '@/components/ui/separator';
import { PhoneInput } from '@/components/phone-input';
import Link from 'next/link';
import ErrorAlert from '@/components/error-alert';
import { loginWithGoogle, signUpAction } from '@/lib/actions/auth.action';
import { GoogleLogInButton } from './google-login-button';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/password-input';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Stepper, StepperDescription, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '@/components/ui/stepper';
import { UserRole } from '@/lib/constants';

export const SignUpCard = () => {
    const router = useRouter()
    const [googleLoginPending, setGoogleLoginPending] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);


    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            password: "",
            fullName: "",
            phoneNumber: "",
            confirmPassword: "",
            role: UserRole.BUYER
        },
        mode: "onChange",
    });

    const onSubmit = (values: z.infer<typeof signupSchema>) => {
        execute(values);
    }

    const { execute, isPending, result } = useAction(signUpAction, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                router.push(form.getValues("role") === UserRole.BUYER ? '/' : '/admin')
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })
    const handleLoginWithGoogle = async () => {
        setGoogleLoginPending(true);
        await loginWithGoogle()
        setGoogleLoginPending(false);
    }

    const isLoading = isPending || googleLoginPending

    const handleNextStep = () => {
        if (currentStep === 2) return;
        setCurrentStep((step) => step + 1)
    }

    const handlePrevious = () => {
        if (currentStep === 1) return;
        setCurrentStep((step) => step - 1)
    }

    const accountTypes = [
        {
            label: "Buyer",
            description: "Browser top original products from trusted network",
            value: UserRole.BUYER
        },
        {
            label: "Seller",
            description: "Start selling top branded products ={'>'} no physical store",
            value: UserRole.VIRTUAL_STORE_OWNER
        },
        {
            label: "Physical store owner / vender",
            description: "List your inventory to our network of virtual sellers",
            value: UserRole.PHYSICAL_STORE_OWNER
        },
    ];

    return (
        <>
            <div className='w-full max-w-lg mx-auto'>
                <Card className='w-full shadow-none space-y-4 border-0 sm:border sm:shadow-sm'>
                    <CardHeader className='space-y-2 text-center'>
                        <CardTitle className='text-xl sm:text-2xl font-semibold'>
                            Create a new account
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {result?.data?.error && <ErrorAlert errorMessage={result?.data?.error} />}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <Stepper defaultValue={1} value={currentStep} onValueChange={handleNextStep} className="w-full mx-auto p-2 border-b-2">
                                    <StepperItem step={1} className="relative flex-1 flex-col!">
                                        <StepperTrigger className="flex-col gap-3 rounded">
                                            <StepperIndicator />
                                            <div className="space-y-0.5 px-2">
                                                <StepperTitle>Step 1</StepperTitle>
                                                <StepperDescription className="max-sm:hidden">Choose account type</StepperDescription>
                                            </div>
                                        </StepperTrigger>
                                        <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                                    </StepperItem>
                                    <StepperItem step={2} className="relative flex-1 flex-col!">
                                        <StepperTrigger className="flex-col gap-3 rounded">
                                            <StepperIndicator />
                                            <div className="space-y-0.5 px-2">
                                                <StepperTitle>Step 2</StepperTitle>
                                                <StepperDescription className="max-sm:hidden">Creae an account</StepperDescription>
                                            </div>
                                        </StepperTrigger>
                                    </StepperItem>
                                </Stepper>

                                {currentStep == 1 && (
                                    <div className='border p-2 rounded-md space-y-4'>
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Choose your account type</FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            className='gap-2'
                                                        >
                                                            {accountTypes.map((accountType) => (
                                                                <div
                                                                    key={accountType.value}
                                                                    className="border-input has-data-[state=checked]:border-ring relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none"
                                                                >
                                                                    <RadioGroupItem
                                                                        value={accountType.value}
                                                                        id={accountType.value}
                                                                        aria-describedby={`${accountType.value}-description`}
                                                                        className="order-1 after:absolute after:inset-0"
                                                                    />
                                                                    <div className="grid grow gap-2">
                                                                        <Label htmlFor={accountType.value}>
                                                                            {accountType.label}
                                                                        </Label>
                                                                        <p id={`${accountType.value}`} className="text-muted-foreground text-xs">
                                                                            {accountType.description}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />


                                        <Button
                                            type="button"
                                            variant="outline"
                                            className='w-full'
                                            onClick={handleNextStep}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                                {currentStep === 2 && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="fullName"
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

                                        <div className='flex gap-2 md:flex-1'>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className='w-full'
                                                onClick={handlePrevious}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                disabled={isLoading}
                                                className='w-full'
                                            >
                                                Sign Up
                                            </Button>
                                        </div>
                                    </>
                                )}

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
        </>
    );
}