"use client";

import { AccessDeniedCard } from '@/components/access-denied-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { applyPhysicalSeller } from '@/features/users/users-actions';
import { usePhysicalStoresByOwner } from '@/hooks/queries-and-mutations/use-physical-store';
import { useGetVirtualStoresByOwnerId } from '@/hooks/queries-and-mutations/use-virtual-store';
import { useConfirm } from '@/hooks/use-confirm';
import {
    deleteUserAccount,
    updateUserAccountType,
    updateProfileAction
} from '@/lib/actions/auth.action';
import { UserRole } from '@/lib/constants';
import { physicalSellerApplicationData, updateProfileSchema } from '@/lib/schemas/user-schema';
import { CurrentUserType, PhysicalStoreTypes, UserDataTypes, VirtualStoreTypes } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Camera,
    Clock,
    Crown,
    Edit,
    Facebook,
    Instagram,
    Linkedin,
    Loader2,
    Save,
    ShieldCheck,
    Store,
    Twitter,
    User,
    ArrowUp,
    FileText,
    Globe,
    ExternalLink,
    Package,
    LayoutDashboard,
    MapPin,
    Settings,
    Shield,
    CheckCircle,
    AlertTriangle,
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { SecuritySettings } from './security-settings';
import { ProfileEmailVerificationBanner } from './profile-email-verification-banner';

type UpdateProfileData = z.infer<typeof updateProfileSchema>
type PhysicalSellerApplicationDataTypes = z.infer<typeof physicalSellerApplicationData>

// Role helper functions
const getRoleDisplayName = (labels: string, teams?: string[]) => {
    if (teams?.includes(UserRole.SYS_ADMIN)) return 'System Admin'
    if (labels?.includes(UserRole.VIRTUAL_STORE_OWNER)) return 'Virtual Seller'
    if (labels?.includes(UserRole.PHYSICAL_STORE_OWNER)) return 'Physical Seller'
    if (labels?.includes(UserRole.PHYSICAL_SELLER_PENDING)) return 'Physical Seller (Pending)'
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
    user: CurrentUserType;
    hasPhysicalSellerPending: boolean;
}

const VirtualStoreCard = ({ store }: { store: VirtualStoreTypes | PhysicalStoreTypes }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Globe className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">{store.name}</h4>
                        <p className="text-xs text-muted-foreground">Virtual Store</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-xs">
                    {store.status || 'Active'}
                </Badge>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Products</span>
                    <span className="font-medium">{store.productCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Orders</span>
                    <span className="font-medium">{store.orderCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-medium">${store.revenue || 0}</span>
                </div>
            </div>
            <div className="flex gap-2 mt-3">
                <Button asChild size="sm" variant="outline" className="flex-1 h-8">
                    <Link href={`/admin/stores/${store.$id}`}>
                        <LayoutDashboard className="h-3 w-3 mr-1" />
                        Dashboard
                    </Link>
                </Button>
            </div>
        </CardContent>
    </Card>
);

const PhysicalStoreCard = ({ store }: { store: any }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">{store.name}</h4>
                        <p className="text-xs text-muted-foreground">Physical Store</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-xs">
                    {store.status || 'Active'}
                </Badge>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium truncate ml-2">{store.address || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Products</span>
                    <span className="font-medium">{store.productCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-medium">{store.rating || 'N/A'}</span>
                </div>
            </div>
            <div className="flex gap-2 mt-3">
                <Button asChild size="sm" variant="outline" className="flex-1 h-8">
                    <Link href={`/admin/stores/${store.$id}`}>
                        <LayoutDashboard className="h-3 w-3 mr-1" />
                        Dashboard
                    </Link>
                </Button>
            </div>
        </CardContent>
    </Card>
);

const StoresSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
            <Card key={i}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div>
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <Skeleton className="h-8 flex-1" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

export const ProfilePage = ({
    userData,
    user,
    isPhysicalStoreOwner,
    isSystemAdmin,
    isSystemAgent,
    isVirtualStoreOwner,
    hasPhysicalSellerPending
}: ProfilePageProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    const {
        data: virtualStoresData,
        isLoading: virtualStoresLoading
    } = useGetVirtualStoresByOwnerId(userData.$id, {
        enabled: isVirtualStoreOwner
    });

    const {
        data: physicalStoresData,
        isLoading: physicalStoresLoading
    } = usePhysicalStoresByOwner(userData.$id, {
        enabled: isPhysicalStoreOwner
    });

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

    const profileForm = useForm<UpdateProfileData>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            fullName: userData?.fullName || '',
            bio: userData?.bio || '',
            website: userData?.website || '',
            phoneNumber: userData?.phoneNumber || '',
            instagram: userData?.instagram || '',
            twitter: userData?.twitter || '',
            facebook: userData?.facebook || '',
            linkedin: userData?.linkedin || '',
        },
        mode: "onChange"
    });

    const physicalSellerForm = useForm<PhysicalSellerApplicationDataTypes>({
        resolver: zodResolver(physicalSellerApplicationData),
        defaultValues: {
            businessName: '',
            businessAddress: '',
            businessPhone: '',
            reason: ''
        },
        mode: "onChange"
    })

    // Actions
    const { execute: upgradeAccount, isPending: isUpgrading } = useAction(updateUserAccountType, {
        onSuccess: async ({ data }) => {
            if (data?.success) {
                toast.success("Your account has been changed to seller account.");
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
                toast.success("Your account has been deleted");
                router.push("/sign-up")
            } else if (data?.error) {
                toast.error(data?.error);
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

    const { execute: updateProfile, isPending: updatingProfile } = useAction(updateProfileAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                setIsEditing(false);
                router.refresh();
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to update profile");
        }
    })

    const onProfileSubmit = async (data: UpdateProfileData) => {
        updateProfile(data);
    };

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
            userId: userData.$id,
        });
    };

    const onPhysicalSellerApplicationSubmit = async (data: PhysicalSellerApplicationDataTypes) => {
        const ok = await confirmPhysicalSellerApplication();
        if (!ok) return;

        applyPhysicalSellerMt({
            userId: userData.$id,
            ...data
        });
    }

    const isLoading = isDeletingAccount || isUpgrading || applyPhysicalSellerPending || updatingProfile

    if (!userData) return <AccessDeniedCard />

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <ChangeAccountTypeDialog />
            <DeleteAccountDialog />
            <PhysicalSellerApplicationDialog />

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                <div className="relative">
                    <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-lg">
                            {userData.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        disabled={isLoading}
                    >
                        <Camera className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold">{userData.fullName}</h1>
                        <Badge variant={getRoleBadgeVariant(userData.labels || [], user?.labels)} className="w-fit">
                            {getRoleIcon(userData.labels || [], user?.labels)}
                            <span className="ml-1">{getRoleDisplayName(userData.accountType, user?.labels)}</span>
                        </Badge>
                        <Badge variant={user?.emailVerification ? 'default' : 'destructive'} className='w-fit'>
                            {user?.emailVerification ? (
                                <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Unverified
                                </>
                            )}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{userData.email}</p>
                    {userData.bio && <p className="text-sm text-muted-foreground">{userData.bio}</p>}
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="destructive"
                        type='button'
                        size="sm"
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                    >
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Delete Account
                    </Button>
                </div>
            </div>

            <ProfileEmailVerificationBanner user={user} />

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Stores Section */}
                    {(isVirtualStoreOwner || isPhysicalStoreOwner) && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Globe className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Your Stores</CardTitle>
                                            <CardDescription>
                                                {isVirtualStoreOwner ? "Your online dropshipping stores" : "Your physical stores"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {(virtualStoresData?.documents?.length || physicalStoresData?.documents?.length) || 0} stores
                                        </Badge>
                                        <Button asChild size="sm" variant="outline">
                                            <Link href="/admin/stores">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Manage All
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {virtualStoresLoading || physicalStoresLoading ? (
                                    <StoresSkeleton />
                                ) : virtualStoresData?.documents?.length ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {virtualStoresData.documents.slice(0, 3).map((store: any) => (
                                            <VirtualStoreCard key={store.$id} store={store} />
                                        ))}
                                    </div>
                                ) : physicalStoresData?.documents?.length ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {physicalStoresData.documents.slice(0, 3).map((store: any) => (
                                            <PhysicalStoreCard key={store.$id} store={store} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground mb-4">No stores yet</p>
                                        <Button asChild>
                                            <Link href="/sell/new-store">
                                                <Package className="h-4 w-4 mr-2" />
                                                Create Your First Store
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Account Upgrade Options */}
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

                    {/* Account Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Account Statistics
                            </CardTitle>
                            <CardDescription>
                                Overview of your account activity and data
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Member Since</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {user?.emailVerification ? 'Yes' : 'No'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Email Verified</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {user?.phoneVerification ? 'Yes' : 'No'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Phone Verified</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {user?.labels?.length || 0}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Account Roles</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Profile Edit Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Edit Profile</h2>
                            <p className="text-muted-foreground">Update your personal information and social links</p>
                        </div>
                        <Button
                            onClick={() => setIsEditing(!isEditing)}
                            variant={isEditing ? "outline" : "teritary"}
                            disabled={updatingProfile}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            {isEditing ? 'Cancel Editing' : 'Start Editing'}
                        </Button>
                    </div>

                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className='space-y-6'>
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
                                                name="fullName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} disabled={!isEditing || updatingProfile} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={profileForm.control}
                                                name="phoneNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} disabled={!isEditing || updatingProfile} placeholder="+250 xxx xxx xxx" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={profileForm.control}
                                            name="website"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Website</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="https://example.com" disabled={!isEditing || updatingProfile} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
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
                                                            disabled={!isEditing || updatingProfile}
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
                                                        <Input {...field} placeholder="username" disabled={!isEditing || updatingProfile} />
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
                                                        <Input {...field} placeholder="@username" disabled={!isEditing || updatingProfile} />
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
                                                        <Input {...field} placeholder="username" disabled={!isEditing || updatingProfile} />
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
                                                        <Input {...field} placeholder="username" disabled={!isEditing || updatingProfile} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {isEditing && (
                                <Button type="submit" className="w-full" disabled={updatingProfile}>
                                    {updatingProfile ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            )}
                        </form>
                    </Form>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <SecuritySettings user={user} />
                </TabsContent>
            </Tabs>
        </div>
    );
};