"use client";

import { AccessDeniedCard } from '@/components/access-denied-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { applyPhysicalSeller } from '@/features/users/users-actions';
import { useConfirm } from '@/hooks/use-confirm';
import { deleteUserAccount, updateUserAccountType } from '@/lib/actions/auth.action';
import { UserRole } from '@/lib/constants';
import { physicalSellerApplicationData, profileSchema } from '@/lib/schemas/user-schema';
import { UserDataTypes } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Clock, Crown, Edit, Facebook, Instagram, Linkedin, Loader2, Save, ShieldCheck, Store, Twitter, User, ArrowUp, FileText } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type ProfileFormData = z.infer<typeof profileSchema>
type PhysicalSellerApplicationDataTypes = z.infer<typeof physicalSellerApplicationData>

// Role helper functions
const getRoleDisplayName = (labels: string, teams?: string[]) => {
    // Check for system admin team membership
    if (teams?.includes(UserRole.SYS_ADMIN)) return 'System Admin'

    // Check labels for roles
    if (labels?.includes(UserRole.VIRTUAL_STORE_OWNER)) return 'Virtual Seller'
    if (labels?.includes(UserRole.PHYSICAL_STORE_OWNER)) return 'Physical Seller'
    if (labels?.includes(UserRole.PHYSICAL_SELLER_PENDING)) return 'Physical Seller (Pending)'

    // Default role
    return 'User'
}

const getRoleBadgeVariant = (labels: string[], teams?: string[]) => {
    if (teams?.includes(UserRole.SYS_ADMIN)) return 'default'
    if (labels?.includes(UserRole.VIRTUAL_STORE_OWNER)) return 'destructive'
    if (labels?.includes(UserRole.PHYSICAL_STORE_OWNER)) return 'secondary'
    if (labels?.includes(UserRole.PHYSICAL_SELLER_PENDING)) return 'outline'
    return 'outline'
}

const getRoleIcon = (labels: string[], teams?: string[]) => {
    if (teams?.includes(UserRole.SYS_ADMIN)) return <ShieldCheck className="h-4 w-4" />
    if (labels?.includes(UserRole.VIRTUAL_STORE_OWNER)) return <Crown className="h-4 w-4" />
    if (labels?.includes(UserRole.PHYSICAL_STORE_OWNER)) return <Store className="h-4 w-4" />
    if (labels?.includes(UserRole.PHYSICAL_SELLER_PENDING)) return <Clock className="h-4 w-4" />
    return <User className="h-4 w-4" />
}

interface ProfilePageProps {
    isPhysicalStoreOwner: boolean;
    isVirtualStoreOwner: boolean;
    isSystemAgent: boolean;
    isSystemAdmin: boolean;
    userData: UserDataTypes;
    hasPhysicalSellerPending: boolean;
}

export const ProfilePage = ({
    userData,
    isPhysicalStoreOwner,
    isSystemAdmin,
    isSystemAgent,
    isVirtualStoreOwner,
    hasPhysicalSellerPending
}: ProfilePageProps) => {
    const [isUpdating, setIsUpdating] = useState(false)
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    const [ChangeAccountTypeDialog, confirmChangeAccountType] = useConfirm(
        "Confirm to make this account a seller account.",
        "You can always revert this action from profile page",
        "teritary"
    );

    const [DeleteAccountDialog, confirmDeleteAccount] = useConfirm(
        "Are you sure you want to delete your account?",
        "This action can not be undone",
        "destructive"
    );

    const [PhysicalSellerApplicationDialog, confirmPhysicalSellerApplication] = useConfirm(
        "Apply for Physical Seller Account?",
        "Your application will be reviewed by system administrators. You'll be notified once approved.",
        "teritary"
    );

    const isNormalUser = !isVirtualStoreOwner && !isPhysicalStoreOwner && !isSystemAdmin && !isSystemAgent;

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: userData?.fullName || '',
            email: userData?.email || '',
            phone: userData?.phoneNumber || '',
            bio: userData?.bio || '',
            website: userData?.website || '',
            instagram: '',
            twitter: '',
            facebook: '',
            linkedin: '',
        },
        mode: "onChange"
    });

    const physicalSellerForm = useForm<PhysicalSellerApplicationDataTypes>({
        resolver: zodResolver(physicalSellerApplicationData),
        defaultValues: {
            businessName: '',
            businessAddress: '',
            businessPhone: '',
            businessLicense: '',
            taxId: '',
            reason: ''
        },
        mode: "onChange"
    })

    const { execute: upgradeAccount, isPending: isUpgrading } = useAction(updateUserAccountType, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success("You account has been changed to seller account.");
                router.push("/sell/new-store")
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const { execute: deleteAccount, isPending: isDeletingAccount } = useAction(deleteUserAccount, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success("You account has been deleted");
                router.push("/sign-up")
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    });

    const { execute: applyPhysicalSellerMt, isPending: applyPhysicalSellerPending } = useAction(applyPhysicalSeller, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success(data.success ?? "Request sent!");
                router.refresh()
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const onProfileSubmit = async (data: ProfileFormData) => {
        try {
            console.log(data)
            console.log(setIsUpdating)
        } catch (error) {
            console.log(error)
        }
    }

    const handleUpgradeToVirtualSeller = async () => {
        const ok = await confirmChangeAccountType();
        if (!ok) return;
        upgradeAccount({
            userId: userData.$id,
            labels: [UserRole.VIRTUAL_STORE_OWNER]
        })
    };

    const handleDeleteAccount = async () => {
        const ok = await confirmDeleteAccount();
        if (!ok) return;
        deleteAccount({
            userId: userData.$id
        })
    };

    const onPhysicalSellerApplicationSubmit = async (data: PhysicalSellerApplicationDataTypes) => {
        const ok = await confirmPhysicalSellerApplication();
        if (!ok) return;

        applyPhysicalSellerMt({
            userId: userData.$id,
            ...data
        });
    }

    const isLoading = isDeletingAccount || isUpgrading || applyPhysicalSellerPending

    if (!userData) return <AccessDeniedCard />

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <ChangeAccountTypeDialog />
            <DeleteAccountDialog />
            <PhysicalSellerApplicationDialog />
            <div className='space-y-8'>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-24 w-24">
                            {/* {userData?.avatar && (
                                <AvatarImage src={userData.avatar} alt={userData.name} />
                            )} */}
                            <AvatarFallback className="text-lg">
                                {/* {userData.name.split(' ').map((n: string[]) => n[0]).join('').toUpperCase()} */}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            size="sm"
                            variant="outline"
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                            disabled={isUpdating}
                        >
                            <Camera className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h1 className="text-3xl font-bold">{userData.name}</h1>
                            <Badge variant={getRoleBadgeVariant(userData.labels, userData.teams)} className="w-fit">
                                {getRoleIcon(userData.labels, userData.teams)}
                                <span className="ml-1">{getRoleDisplayName(userData.accountType, userData.teams)}</span>
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{userData.email}</p>
                        {userData.bio && <p className="text-sm text-muted-foreground">{userData.bio}</p>}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => setIsEditing(!isEditing)}
                            variant={isEditing ? "outline" : "teritary"}
                            disabled={isUpdating}
                            size={'sm'}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </Button>

                        <Button
                            variant="destructive"
                            type='button'
                            size="sm"
                            disabled={isLoading}
                            onClick={handleDeleteAccount}
                        >
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Delete Account
                        </Button>
                    </div>
                </div>

                {isNormalUser && (
                    <div className='space-y-4'>
                        <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="pt-6 flex justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Crown className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-900">Upgrade Your Account</h3>
                                        <p className="text-sm text-blue-700">
                                            Become a Virtual Seller to start selling products and managing your online store.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    type='button'
                                    size="sm"
                                    disabled={isLoading}
                                    onClick={handleUpgradeToVirtualSeller}
                                >
                                    <ArrowUp className="h-4 w-4 mr-2" />
                                    Upgrade to Virtual Seller
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <Store className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-green-900">Apply for Physical Store</h3>
                                            <p className="text-sm text-green-700">
                                                {hasPhysicalSellerPending
                                                    ? "Your physical seller application is under review."
                                                    : "Apply to become a Physical Seller and manage physical store locations."
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {!hasPhysicalSellerPending && (
                                        <Drawer>
                                            <DrawerTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isLoading}
                                                    className="bg-white hover:bg-green-50 border-green-300"
                                                >
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Apply Now
                                                </Button>
                                            </DrawerTrigger>
                                            <DrawerContent className='py-5'>
                                                <Card className="border-2 border-green-200 mx-auto">
                                                    <DrawerHeader>
                                                        <DrawerTitle className="flex items-center gap-2">
                                                            <Store className="h-5 w-5" />
                                                            Physical Seller Application
                                                        </DrawerTitle>
                                                        <DrawerDescription className="flex items-center gap-2">
                                                            Complete this form to apply for physical seller status. All information will be reviewed by our team.
                                                        </DrawerDescription>
                                                    </DrawerHeader>
                                                    <CardContent>
                                                        <Form {...physicalSellerForm}>
                                                            <form onSubmit={physicalSellerForm.handleSubmit(onPhysicalSellerApplicationSubmit)} className="space-y-6">
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <FormField
                                                                            control={physicalSellerForm.control}
                                                                            name="businessName"
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Business Name *</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input {...field} placeholder="Enter your business name" />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <FormField
                                                                            control={physicalSellerForm.control}
                                                                            name="businessPhone"
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Business Phone *</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input {...field} placeholder="+250 xxx xxx xxx" />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>
                                                                    <FormField
                                                                        control={physicalSellerForm.control}
                                                                        name="businessAddress"
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel>Business Address *</FormLabel>
                                                                                <FormControl>
                                                                                    <Textarea {...field} placeholder="Enter your complete business address" rows={2} />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <FormField
                                                                            control={physicalSellerForm.control}
                                                                            name="businessLicense"
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Business License Number</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input {...field} placeholder="License number (if applicable)" />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <FormField
                                                                            control={physicalSellerForm.control}
                                                                            name="taxId"
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Tax ID</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input {...field} placeholder="Tax identification number" />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>
                                                                    <FormField
                                                                        control={physicalSellerForm.control}
                                                                        name="reason"
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel>Why do you want to become a Physical Seller? *</FormLabel>
                                                                                <FormControl>
                                                                                    <Textarea {...field} placeholder="Explain your motivation and plans for physical selling" rows={3} />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                    <div className="flex gap-3 pt-4">
                                                                        <Button
                                                                            type="submit"
                                                                            disabled={isLoading}
                                                                            className="flex-1 max-w-xs mx-auto"
                                                                        >
                                                                            {isLoading ? (
                                                                                <>
                                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                                    Submitting Application...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <FileText className="h-4 w-4 mr-2" />
                                                                                    Submit Application
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </form>
                                                        </Form>
                                                    </CardContent>
                                                </Card>
                                            </DrawerContent>
                                        </Drawer>
                                    )}

                                    {hasPhysicalSellerPending && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Pending Review
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className='space-y-4'>
                    <Form {...profileForm}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>
                                    Update your personal details and contact information
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={!isEditing || isUpdating} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" disabled />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={!isEditing || isUpdating} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={profileForm.control}
                                            name="website"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Website</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="https://example.com" disabled={!isEditing || isUpdating} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={profileForm.control}
                                        name="bio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bio</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Tell us about yourself..."
                                                        disabled={!isEditing || isUpdating}
                                                        rows={3}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Social Links</CardTitle>
                                <CardDescription>
                                    Connect your social media accounts
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="instagram"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Instagram className="h-4 w-4" />
                                                    Instagram
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="username" disabled={!isEditing} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="twitter"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Twitter className="h-4 w-4" />
                                                    Twitter
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="@username" disabled={!isEditing} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="facebook"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Facebook className="h-4 w-4" />
                                                    Facebook
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="username" disabled={!isEditing} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="linkedin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Linkedin className="h-4 w-4" />
                                                    LinkedIn
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="username" disabled={!isEditing} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {isEditing && (
                            <Button type="submit" className="w-full mt-3" disabled={isUpdating}>
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        )}
                    </Form>
                </form>
            </div>
        </div >
    );
}