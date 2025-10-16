// src/app/accept-invitation/accept-invitation-content.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Mail,
    Store,
    UserPlus,
    ArrowRight,
    AlertTriangle
} from "lucide-react";
import { validateInvitationTokenAction, acceptInvitationAction } from "@/lib/actions/staff.safe-actions";
import { getLoggedInUser } from "@/lib/actions/auth.action";
import { useAction } from "next-safe-action/hooks";
import { StaffInvitations } from "@/lib/types/appwrite/appwrite";

type InvitationState =
    | "validating"
    | "invalid"
    | "expired"
    | "already_accepted"
    | "valid"
    | "accepting"
    | "accepted"
    | "error"
    | "email_mismatch";

export function AcceptInvitationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [state, setState] = useState<InvitationState>("validating");
    const [invitation, setInvitation] = useState<StaffInvitations | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");

    const { execute: acceptInvitation, isExecuting } = useAction(acceptInvitationAction, {
        onSuccess: () => {
            setState("accepted");
        },
        onError: ({ error }) => {
            setState("error");
            setErrorMessage(error.serverError || "Failed to accept invitation");
        },
    });

    useEffect(() => {
        if (!token) {
            setState("invalid");
            setErrorMessage("No invitation token provided");
            return;
        }

        validateInvitation();
    }, [token]);

    async function validateInvitation() {
        try {
            // Check if user is logged in
            const user = await getLoggedInUser();

            if (!user) {
                // Redirect to sign-in with the token
                router.push(`/sign-in?redirect=/accept-invitation?token=${token}`);
                return;
            }

            setUserEmail(user.email);

            // Validate the invitation token
            const result = await validateInvitationTokenAction(token!);

            if (!result.valid) {
                if (result.message?.includes("expired")) {
                    setState("expired");
                } else if (result.message?.includes("accepted")) {
                    setState("already_accepted");
                } else {
                    setState("invalid");
                }
                setErrorMessage(result.message || "Invalid invitation");
                return;
            }

            // Check if user email matches invitation email
            if (result.invitation && user.email.toLowerCase() !== result.invitation.email.toLowerCase()) {
                setState("email_mismatch");
                setErrorMessage(
                    `This invitation was sent to ${result.invitation.email}, but you're logged in as ${user.email}. Please log in with the correct account.`
                );
                return;
            }

            setInvitation(result.invitation!);
            setState("valid");
        } catch (error) {
            console.error("Validation error:", error);
            setState("error");
            setErrorMessage("An unexpected error occurred. Please try again.");
        }
    }

    function handleAcceptInvitation() {
        if (!token) return;
        setState("accepting");
        acceptInvitation({ token });
    }

    // Loading state
    if (state === "validating") {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="pt-6 flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <p className="text-lg font-medium">Validating invitation...</p>
                    <p className="text-sm text-gray-600 text-center">
                        Please wait while we verify your invitation
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Invalid token
    if (state === "invalid") {
        return (
            <Card className="w-full max-w-md border-red-200">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl text-red-900">Invalid Invitation</CardTitle>
                    <CardDescription className="text-red-700">
                        {errorMessage}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            This invitation link is not valid. It may have been cancelled or the link is incorrect.
                        </AlertDescription>
                    </Alert>
                    <Button
                        onClick={() => router.push("/")}
                        className="w-full"
                        variant="outline"
                    >
                        Go to Homepage
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Expired token
    if (state === "expired") {
        return (
            <Card className="w-full max-w-md border-yellow-200">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <CardTitle className="text-2xl text-yellow-900">Invitation Expired</CardTitle>
                    <CardDescription className="text-yellow-700">
                        This invitation has expired
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert className="border-yellow-300 bg-yellow-50">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            This invitation link has expired. Please contact the store administrator to request a new invitation.
                        </AlertDescription>
                    </Alert>
                    <Button
                        onClick={() => router.push("/")}
                        className="w-full"
                        variant="outline"
                    >
                        Go to Homepage
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Already accepted
    if (state === "already_accepted") {
        return (
            <Card className="w-full max-w-md border-blue-200">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl text-blue-900">Already Accepted</CardTitle>
                    <CardDescription className="text-blue-700">
                        You've already accepted this invitation
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert className="border-blue-300 bg-blue-50">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            This invitation has already been accepted. You can access the store from your dashboard.
                        </AlertDescription>
                    </Alert>
                    <Button
                        onClick={() => router.push("/admin")}
                        className="w-full"
                    >
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Email mismatch
    if (state === "email_mismatch") {
        return (
            <Card className="w-full max-w-md border-orange-200">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                        <Mail className="h-8 w-8 text-orange-600" />
                    </div>
                    <CardTitle className="text-2xl text-orange-900">Email Mismatch</CardTitle>
                    <CardDescription className="text-orange-700">
                        Please log in with the correct account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert className="border-orange-300 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                            {errorMessage}
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Button
                            onClick={() => router.push(`/sign-in?redirect=/accept-invitation?token=${token}`)}
                            className="w-full"
                        >
                            Switch Account
                        </Button>
                        <Button
                            onClick={() => router.push("/")}
                            className="w-full"
                            variant="outline"
                        >
                            Go to Homepage
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Success state
    if (state === "accepted") {
        return (
            <Card className="w-full max-w-md border-green-200">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl text-green-900">Welcome to the Team! 🎉</CardTitle>
                    <CardDescription className="text-green-700">
                        You've successfully joined the store
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert className="border-green-300 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            Your invitation has been accepted. Redirecting to your store dashboard...
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (state === "error") {
        return (
            <Card className="w-full max-w-md border-red-200">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl text-red-900">Something Went Wrong</CardTitle>
                    <CardDescription className="text-red-700">
                        Failed to accept invitation
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Button
                            onClick={() => validateInvitation()}
                            className="w-full"
                            variant="outline"
                        >
                            Try Again
                        </Button>
                        <Button
                            onClick={() => router.push("/")}
                            className="w-full"
                            variant="ghost"
                        >
                            Go to Homepage
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Valid invitation - ready to accept
    if (state === "valid" && invitation) {
        const expiryDate = new Date(invitation.expiresAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">You're Invited! 🎉</CardTitle>
                    <CardDescription>
                        Join the team and start collaborating
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Invitation Details */}
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                                Invitation Details
                            </h3>

                            <div className="space-y-2">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Your Email</p>
                                        <p className="text-sm text-gray-600">{invitation.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Store className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Store</p>
                                        <p className="text-sm text-gray-600">{invitation.storeId}</p>
                                        <p className="text-xs text-gray-500 capitalize">{invitation.storeType} Store</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Expires</p>
                                        <p className="text-sm text-gray-600">{expiryDate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                By accepting this invitation, you'll become a staff member and gain access to the store dashboard.
                            </AlertDescription>
                        </Alert>
                    </div>

                    {/* Accept Button */}
                    <Button
                        onClick={handleAcceptInvitation}
                        disabled={isExecuting}
                        className="w-full h-12 text-base font-semibold"
                        size="lg"
                    >
                        {isExecuting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Accepting...
                            </>
                        ) : (
                            <>
                                Accept Invitation
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={() => router.push("/")}
                        variant="ghost"
                        className="w-full"
                        disabled={isExecuting}
                    >
                        Decline Invitation
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Accepting state
    if (state === "accepting") {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="pt-6 flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <p className="text-lg font-medium">Accepting invitation...</p>
                    <p className="text-sm text-gray-600 text-center">
                        Setting up your access...
                    </p>
                </CardContent>
            </Card>
        );
    }

    return null;
}