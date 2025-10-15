"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    MoreHorizontal,
    Mail,
    X,
    RefreshCw,
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
    cancelInvitationAction,
    resendInvitationAction,
} from "@/lib/actions/staff.safe-actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { StaffInvitations } from "@/lib/types/appwrite/appwrite";

interface PendingInvitationsProps {
    invitations: StaffInvitations[];
    storeId: string;
}

export function PendingInvitations({ invitations, storeId }: PendingInvitationsProps) {
    const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);

    const [CancelDialog, confirmCancel] = useConfirm(
        "Cancel Invitation",
        "Are you sure you want to cancel this invitation? The recipient will no longer be able to accept it.",
        "destructive"
    );

    const { execute: executeCancel, isExecuting: isCancelling } = useAction(
        cancelInvitationAction,
        {
            onSuccess: ({ data }) => {
                if (data?.success) {
                    toast.success("Invitation cancelled successfully");
                    setSelectedInvitation(null);
                } else if (data?.error) {
                    toast.error(data.error);
                }
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to cancel invitation");
            },
        }
    );

    const { execute: executeResend, isExecuting: isResending } = useAction(
        resendInvitationAction,
        {
            onSuccess: ({ data }) => {
                if (data?.success) {
                    toast.success("Invitation resent successfully");
                } else if (data?.error) {
                    toast.error(data.error);
                }
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to resend invitation");
            },
        }
    );

    const handleCancel = async (invitationId: string) => {
        const confirmed = await confirmCancel();
        if (confirmed) {
            executeCancel({ invitationId, storeId });
        }
    };

    const handleResend = (invitationId: string) => {
        executeResend({ invitationId, storeId });
    };

    const getStatusBadge = (status: string, expiresAt: string) => {
        const isExpired = new Date(expiresAt) < new Date();

        if (isExpired && status === "pending") {
            return (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Expired
                </Badge>
            );
        }

        const variants = {
            pending: (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                </Badge>
            ),
            accepted: (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Accepted
                </Badge>
            ),
            expired: (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Expired
                </Badge>
            ),
            cancelled: (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-700 dark:text-gray-400">
                    <X className="mr-1 h-3 w-3" />
                    Cancelled
                </Badge>
            ),
        };

        return variants[status as keyof typeof variants] || variants.pending;
    };

    const pendingInvitations = invitations.filter((inv) => inv.invitationStatus === "pending");

    if (pendingInvitations.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Pending Invitations</CardTitle>
                    <CardDescription>
                        View and manage pending staff invitations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No pending invitations</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            All invitations have been accepted or expired
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isPending = isCancelling || isResending;

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Pending Invitations ({pendingInvitations.length})</CardTitle>
                    <CardDescription>
                        Invitations waiting to be accepted by recipients
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Invited</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingInvitations.map((invitation) => {
                                    const isExpired = new Date(invitation.expiresAt) < new Date();
                                    const daysUntilExpiry = Math.ceil(
                                        (new Date(invitation.expiresAt).getTime() - new Date().getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    );

                                    return (
                                        <TableRow key={invitation.$id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{invitation.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(invitation.invitationStatus, invitation.expiresAt)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(invitation.invitedAt), {
                                                    addSuffix: true,
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-muted-foreground">
                                                        {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                                                    </span>
                                                    {!isExpired && (
                                                        <span
                                                            className={`text-xs ${daysUntilExpiry <= 2
                                                                    ? "text-orange-600 dark:text-orange-400"
                                                                    : "text-muted-foreground"
                                                                }`}
                                                        >
                                                            {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""} left
                                                        </span>
                                                    )}
                                                    {isExpired && (
                                                        <span className="text-xs text-red-600 dark:text-red-400">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={isPending}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            onClick={() => handleResend(invitation.$id)}
                                                            disabled={isPending}
                                                        >
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                            Resend Invitation
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(invitation.email);
                                                                toast.success("Email copied to clipboard");
                                                        }}
                                                        >
                                                            <Mail className="mr-2 h-4 w-4" />
                                                            Copy Email
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => handleCancel(invitation.$id)}
                                                            disabled={isPending}
                                                        >
                                                            <X className="mr-2 h-4 w-4" />
                                                            Cancel Invitation
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <CancelDialog />
        </>
    )
}