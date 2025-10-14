"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { removeStaffMemberAction, updateStaffMemberAction } from "@/lib/actions/staff.safe-actions";
import { StoreStaff } from "@/lib/types/appwrite/appwrite";
import { formatDistanceToNow } from "date-fns";
import { Ban, CheckCircle, Edit, Mail, MoreHorizontal, Shield, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface StaffTableProps {
    staff: StoreStaff[];
    storeId: string;
    canEdit: boolean;
    canDelete: boolean;
}

export function StaffTable({ staff, storeId, canEdit, canDelete }: StaffTableProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedStaff, setSelectedStaff] = useState<StoreStaff | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const getStatusBadge = (status: string) => {
        const variants = {
            active: { label: "Active", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
            inactive: { label: "Inactive", className: "bg-gray-500/10 text-gray-700 dark:text-gray-400" },
            suspended: { label: "Suspended", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
        };

        const variant = variants[status as keyof typeof variants] || variants.inactive;

        return (
            <Badge variant="outline" className={variant.className}>
                {variant.label}
            </Badge>
        );
    };

    const handleStatusChange = (staffId: string, newStatus: "active" | "inactive" | "suspended") => {
        startTransition(async () => {
            const result = await updateStaffMemberAction({
                staffId,
                storeId,
                StoreStaffStatus: newStatus,
            });

            if (result?.data?.success) {
                toast.success(`Staff status updated to ${newStatus}`);
            } else {
                toast.error(result?.data?.error || "Failed to update status");
            }
        });
    };

    const handleDelete = () => {
        if (!selectedStaff) return;

        startTransition(async () => {
            const result = await removeStaffMemberAction({ staffId: selectedStaff.$id, storeId });

            if (result?.data?.success) {
                toast.success("Staff member removed successfully");
                setShowDeleteDialog(false);
                setSelectedStaff(null);
            } else {
                toast.error(result?.data?.error || "Failed to remove staff member");
            }
        });
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Staff Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    No staff members yet. Invite your first team member to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            staff.map((member) => (
                                <TableRow key={member.$id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={member.userAvatar} alt={member.userName} />
                                                <AvatarFallback>
                                                    {member.userName
                                                        .split(" ")
                                                        .map((n: any) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{member.userName}</p>
                                                <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{member.roleName}</p>
                                            <p className="text-xs text-muted-foreground">{member.roleDescription}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(member.StoreStaffStatus)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {member.acceptedAt && formatDistanceToNow(new Date(member.acceptedAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {member.lastActive
                                            ? formatDistanceToNow(new Date(member.lastActive), { addSuffix: true })
                                            : "Never"}
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

                                                {canEdit && (
                                                    <>
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Role
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Manage Permissions
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                    </>
                                                )}

                                                {canEdit && member.StoreStaffStatus !== "active" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(member.$id, "active")}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                        Activate
                                                    </DropdownMenuItem>
                                                )}

                                                {canEdit && member.StoreStaffStatus !== "suspended" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(member.$id, "suspended")}
                                                    >
                                                        <Ban className="mr-2 h-4 w-4 text-orange-600" />
                                                        Suspend
                                                    </DropdownMenuItem>
                                                )}

                                                {canEdit && member.StoreStaffStatus !== "inactive" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(member.$id, "inactive")}
                                                    >
                                                        <Ban className="mr-2 h-4 w-4 text-gray-600" />
                                                        Deactivate
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem>
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Send Message
                                                </DropdownMenuItem>

                                                {canDelete && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => {
                                                                setSelectedStaff(member);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove from Team
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{selectedStaff?.userName}</strong> from your
                            team? This action cannot be undone. They will lose access to the store dashboard
                            immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isPending ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}