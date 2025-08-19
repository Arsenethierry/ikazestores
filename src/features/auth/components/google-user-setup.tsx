"use client"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createUserData } from '@/lib/actions/auth.action';
import { completeGoogleUserSetupSchema } from '@/lib/schemas/user-schema';
import { CurrentUserType } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, UserPlus } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

type GoogleUserSetupData = z.infer<typeof completeGoogleUserSetupSchema>;

interface GoogleUserSetupProps {
    user: CurrentUserType
}

export const GoogleUserSetup = ({ user }: GoogleUserSetupProps) => {
    const router = useRouter();

    if (!user) return;
    const form = useForm<GoogleUserSetupData>({
        resolver: zodResolver(completeGoogleUserSetupSchema),
        defaultValues: {
            fullName: user.name || '',
            email: user.email || '',
            phoneNumber: user.phone || '',
            bio: '',
            website: '',
        },
        mode: "onChange"
    });

    const { execute: createUser, isPending } = useAction(createUserData, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success("Profile setup completed successfully!");
                router.refresh();
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to complete profile setup");
        }
    });

    const onSubmit = async (data: GoogleUserSetupData) => {
        createUser({
            userId: user.$id,
            ...data
        });
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <UserPlus className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
                <p className="text-muted-foreground">
                    Welcome! Please complete your profile to get started.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>
                        Add your details to complete your account setup
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter your full name"
                                                    disabled={isPending}
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
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    disabled
                                                    className="bg-muted"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="+250 xxx xxx xxx"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website (Optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="https://example.com"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bio (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Tell us a bit about yourself..."
                                                rows={3}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isPending}
                                size="lg"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Completing Setup...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Complete Profile Setup
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
