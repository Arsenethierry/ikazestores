"use client";

import { PasswordInput } from "@/components/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useConfirm } from "@/hooks/use-confirm";
import { changePasswordAction, createEmailVerification, deleteOtherSessionsAction, deleteSessionAction, getAccountSessions, updateEmailAction, updatePhoneAction, verifyEmailAction } from "@/lib/actions/auth.action";
import { changePasswordSchema, updateEmailSchema, updatePhoneSchema, verifyEmilSchema } from "@/lib/schemas/user-schema";
import { CurrentUserType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Calendar, CheckCircle, Eye, EyeOff, Key, Loader2, Lock, LogOut, Mail, MapPin, Monitor, Phone, RefreshCw, Shield, Smartphone, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { Models } from "node-appwrite";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type ChangePasswordData = z.infer<typeof changePasswordSchema>;
type UpdateEmailData = z.infer<typeof updateEmailSchema>;
type UpdatePhoneData = z.infer<typeof updatePhoneSchema>;

interface SecuritySettingsProps {
    user: CurrentUserType
}

const SessionCard = ({ session, onDelete }: {
    session: Models.Session;
    onDelete: (sessionId: string) => void;
}) => {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDeviceIcon = (clientName: string) => {
        if (clientName.toLowerCase().includes('mobile')) return <Smartphone className="h-4 w-4" />;
        return <Monitor className="h-4 w-4" />;
    };

    return (
        <Card className={`${session.current ? 'border-green-200 bg-green-50' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            {getDeviceIcon(session.deviceName)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{session.clientName}</p>
                                {session.current && (
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                                        Current
                                    </Badge>
                                )}
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{session.countryName} • {session.ip}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Active {formatDate(session.$createdAt)}</span>
                                </div>
                                <p>{session.osName}</p>
                            </div>
                        </div>
                    </div>
                    {!session.current && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(session.$id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <LogOut className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export const SecuritySettings = ({ user }: SecuritySettingsProps) => {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [emailVerificationSent, setEmailVerificationSent] = useState(false);

    const router = useRouter();
    const queryClient = useQueryClient();

    const [TerminateAllDialog, confirmTerminateAll] = useConfirm(
        "Terminate all other sessions?",
        "This will log you out of all other devices. You'll need to sign in again on those devices.",
        "destructive"
    );

    if (!user) return;
    const passwordForm = useForm<ChangePasswordData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const emailForm = useForm<UpdateEmailData>({
        resolver: zodResolver(updateEmailSchema),
        defaultValues: {
            newEmail: '',
            password: '',
        },
    });

    const phoneForm = useForm<UpdatePhoneData>({
        resolver: zodResolver(updatePhoneSchema),
        defaultValues: {
            phoneNumber: user.phone || '',
            password: '',
        },
    });

    const verificationForm = useForm<z.infer<typeof verifyEmilSchema>>({
        resolver: zodResolver(verifyEmilSchema),
        defaultValues: {
            userId: user.$id,
            secret: ''
        },
        mode: "onChange"
    });

    // Actions
    const { execute: changePassword, isPending: isChangingPassword } = useAction(changePasswordAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                passwordForm.reset();
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to change password");
        }
    });

    const { execute: updateEmail, isPending: updatingEmail } = useAction(updateEmailAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                emailForm.reset();
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to update email");
        }
    });

    const { execute: sendVerification, isPending: isSendingVerification } = useAction(createEmailVerification, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success('Verification email sent successfully');
                setEmailVerificationSent(true);
                setShowVerificationInput(true);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to send verification email');
        }
    });

    const { execute: verifyEmail, isPending: isVerifyingEmail } = useAction(verifyEmailAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success('Email verified successfully');
                setShowVerificationInput(false);
                setEmailVerificationSent(false);
                verificationForm.reset();
                router.refresh();
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Email verification failed');
        }
    });

    const { execute: updatePhone, isPending: updatingPhone } = useAction(updatePhoneAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                phoneForm.reset();
                router.refresh()
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to update phone");
        }
    });

    const {
        data: sessions = null,
        isLoading: loadingSessions,
        error: sessionsError,
        refetch: refetchSessions
    } = useQuery<Models.SessionList | null>({
        queryKey: ['account-sessions'],
        queryFn: getAccountSessions,
        retry: 2,
        staleTime: 1000 * 60 * 5,
    });

    const { execute: deleteSession, isPending: isDeletingSession } = useAction(deleteSessionAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                queryClient.invalidateQueries({ queryKey: ['account-sessions'] });
            } else if (data?.error) {
                toast.error(data.error);
            }
        }
    });

    const { execute: deleteOtherSessions, isPending: terminatingOthers } = useAction(deleteOtherSessionsAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                queryClient.invalidateQueries({ queryKey: ['account-sessions'] });
            } else if (data?.error) {
                toast.error(data.error);
            }
        }
    });

    const handleTerminateAllOthers = async () => {
        const confirmed = await confirmTerminateAll();
        if (confirmed) {
            deleteOtherSessions();
        }
    };

    const onPasswordSubmit = (data: z.infer<typeof changePasswordSchema>) => {
        changePassword(data);
    };

    const onEmailSubmit = (data: z.infer<typeof updateEmailSchema>) => {
        updateEmail(data);
    };

    const onVerificationSubmit = (data: z.infer<typeof verifyEmilSchema>) => {
        verifyEmail(data);
    };

    const handleSendVerification = () => {
        sendVerification();
    };

    const otherSessions = sessions && sessions.sessions.filter((session: Models.Session) => !session.current);

    const isLoading = isChangingPassword || updatingEmail || isSendingVerification || isVerifyingEmail || isDeletingSession || terminatingOthers;

    return (
        <div className="space-y-6">
            <TerminateAllDialog />

            <Card className={user.emailVerification ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Verification
                    </CardTitle>
                    <CardDescription>
                        {user.emailVerification
                            ? "Your email address is verified and secure"
                            : "Verify your email address to secure your account"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {user.emailVerification ? (
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">Email Verified</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-orange-700">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-medium">Email Not Verified</span>
                                </div>
                            )}
                            <Badge variant={user.emailVerification ? "default" : "destructive"}>
                                {user.email}
                            </Badge>
                        </div>

                        {!user.emailVerification && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSendVerification}
                                    disabled={isLoading}
                                    size="sm"
                                    variant="outline"
                                >
                                    {isSendingVerification ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Send Verification
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {showVerificationInput && !user.emailVerification && (
                        <div className="mt-4 p-4 border rounded-lg bg-white">
                            <p className="text-sm text-muted-foreground mb-3">
                                We've sent a verification code to your email. Enter it below:
                            </p>

                            <Form {...verificationForm}>
                                <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="flex gap-2">
                                    <FormField
                                        control={verificationForm.control}
                                        name="secret"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter verification code"
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isLoading}>
                                        {isVerifyingEmail ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify'
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                    </CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <PasswordInput
                                                {...field}
                                                placeholder="Enter current password"
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <PasswordInput
                                                    {...field}
                                                    placeholder="Enter new password"
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm New Password</FormLabel>
                                            <FormControl>
                                                <PasswordInput
                                                    {...field}
                                                    placeholder="Confirm new password"
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" disabled={isLoading}>
                                {isChangingPassword ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Changing Password...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Change Password
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Email Update */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Address
                    </CardTitle>
                    <CardDescription>
                        Current email: {user.email}
                        {user.emailVerification ? (
                            <Badge variant="outline" className="ml-2 text-green-700 bg-green-50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="ml-2 text-orange-700 bg-orange-50">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Unverified
                            </Badge>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Mail className="h-4 w-4 mr-2" />
                                Change Email
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Email Address</DialogTitle>
                                <DialogDescription>
                                    Enter your new email address and current password
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...emailForm}>
                                <form onSubmit={emailForm.handleSubmit((data: UpdateEmailData) => updateEmail(data))} className="space-y-4">
                                    <FormField
                                        control={emailForm.control}
                                        name="newEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Email Address</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" disabled={updatingEmail} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={emailForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Password</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" disabled={updatingEmail} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Alert>
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            You'll need to verify your new email address before the change takes effect.
                                        </AlertDescription>
                                    </Alert>
                                    <Button type="submit" disabled={updatingEmail} className="w-full">
                                        {updatingEmail ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Updating Email...
                                            </>
                                        ) : (
                                            "Update Email"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {/* Phone Update */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Phone Number
                    </CardTitle>
                    <CardDescription>
                        {user.phone ? (
                            <>
                                Current phone: {user.phone}
                                {user.phoneVerification ? (
                                    <Badge variant="outline" className="ml-2 text-green-700 bg-green-50">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Verified
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="ml-2 text-orange-700 bg-orange-50">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Unverified
                                    </Badge>
                                )}
                            </>
                        ) : (
                            "No phone number added"
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Phone className="h-4 w-4 mr-2" />
                                {user.phone ? 'Change Phone' : 'Add Phone'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{user.phone ? 'Change' : 'Add'} Phone Number</DialogTitle>
                                <DialogDescription>
                                    Enter your phone number with country code (e.g., +250123456789)
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...phoneForm}>
                                <form onSubmit={phoneForm.handleSubmit((data: UpdatePhoneData) => updatePhone(data))} className="space-y-4">
                                    <FormField
                                        control={phoneForm.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="+250123456789" disabled={updatingPhone} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={phoneForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Password</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" disabled={updatingPhone} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={updatingPhone} className="w-full">
                                        {updatingPhone ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Updating Phone...
                                            </>
                                        ) : (
                                            `${user.phone ? 'Update' : 'Add'} Phone Number`
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Active Sessions
                    </CardTitle>
                    <CardDescription>
                        Manage devices and locations where you're signed in
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loadingSessions ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {sessions && sessions.sessions.map((session) => (
                                        <SessionCard
                                            key={session.$id}
                                            session={session}
                                            onDelete={(sessionId) => deleteSession({ sessionId })}
                                        />
                                    ))}
                                </div>

                                {otherSessions && otherSessions.length > 0 && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Other Sessions</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {otherSessions.length} other active session(s)
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleTerminateAllOthers}
                                                disabled={terminatingOthers}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                {terminatingOthers ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                        Terminating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Trash2 className="h-3 w-3 mr-2" />
                                                        Terminate All Others
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Security Tips */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Shield className="h-5 w-5" />
                        Security Tips
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm text-blue-800">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                            <span>Use a strong, unique password that you don't use elsewhere</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                            <span>Keep your email address verified to receive security alerts</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                            <span>Regularly review and terminate unused sessions</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                            <span>Don't share your account credentials with anyone</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};