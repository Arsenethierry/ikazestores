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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    MoreHorizontal,
    Edit,
    Trash2,
    Plus,
    Shield,
    ShieldCheck,
    Crown,
    Lock,
} from "lucide-react";
import {
    createCustomRoleAction,
    updateRoleAction,
    deleteRoleAction,
    getPermissionsForStoreTypeAction,
} from "@/lib/actions/staff.safe-actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { StorePermissions, StoreRoles } from "@/lib/types/appwrite/appwrite";

interface RolesManagementProps {
    roles: StoreRoles[];
    storeId: string;
    storeType: "physical" | "virtual";
}

export function RolesManagement({ roles, storeId, storeType }: RolesManagementProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<StoreRoles | null>(null);
    const [availablePermissions, setAvailablePermissions] = useState<StorePermissions[]>([]);
    const [loadingPermissions, setLoadingPermissions] = useState(false);

    const [formData, setFormData] = useState({
        roleName: "",
        description: "",
        permissions: [] as string[],
    });

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Role",
        "Are you sure you want to delete this role? Staff members with this role will need to be reassigned.",
        "destructive"
    );

    const { execute: executeCreate, isExecuting: isCreating } = useAction(
        createCustomRoleAction,
        {
            onSuccess: ({ data }) => {
                if (data?.success) {
                    toast.success(data.message || "Role created successfully");
                    setIsCreateOpen(false);
                    resetForm();
                } else if (data?.error) {
                    toast.error(data.error);
                }
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to create role");
            },
        }
    );

    const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateRoleAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.message || "Role updated successfully");
                setIsEditOpen(false);
                setSelectedRole(null);
                resetForm();
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to update role");
        },
    });

    const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteRoleAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.message || "Role deleted successfully");
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to delete role");
        },
    });

    const loadPermissions = async () => {
        setLoadingPermissions(true);
        try {
            const result = await getPermissionsForStoreTypeAction(storeType);
            if (result.success && result.data) {
                setAvailablePermissions(result.data);
            }
        } catch (error) {
            toast.error("Failed to load permissions");
        } finally {
            setLoadingPermissions(false);
        }
    };

    const resetForm = () => {
        setFormData({
            roleName: "",
            description: "",
            permissions: [],
        });
    };

    const handleCreateClick = async () => {
        await loadPermissions();
        setIsCreateOpen(true);
    };

    const handleEditClick = async (role: StoreRoles) => {
        setSelectedRole(role);
        setFormData({
            roleName: role.roleName,
            description: role.description,
            permissions: role.permissions || [],
        });
        await loadPermissions();
        setIsEditOpen(true);
    };

    const handleDeleteClick = async (roleId: string) => {
        const confirmed = await confirmDelete();
        if (confirmed) {
            executeDelete({ roleId, storeId });
        }
    };

    // const handleCreate = () => {
    //     if (!formData.roleName || !formData.description || formData.permissions.length === 0) {
    //         toast.error("Please fill in all fields and select at least one permission");
    //         return;
    //     }

    //     executeCreate({
    //         storeId,
    //         storeType,
    //         roleName: formData.roleName,
    //         description: formData.description,
    //         permissions: formData.permissions,
    //     });
    // };

    const handleUpdate = () => {
        if (!selectedRole || !formData.roleName || !formData.description) {
            toast.error("Please fill in all required fields");
            return;
        }

        executeUpdate({
            roleId: selectedRole.$id,
            storeId,
            roleName: formData.roleName,
            description: formData.description,
            permissions: formData.permissions,
        });
    };

    const togglePermission = (permissionKey: string) => {
        setFormData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permissionKey)
                ? prev.permissions.filter((p) => p !== permissionKey)
                : [...prev.permissions, permissionKey],
        }));
    };

    const groupPermissionsByModule = () => {
        const grouped: { [key: string]: StorePermissions[] } = {};
        availablePermissions.forEach((perm) => {
            if (!grouped[perm.module]) {
                grouped[perm.module] = [];
            }
            grouped[perm.module].push(perm);
        });
        return grouped;
    };

    const getRoleIcon = (role: StoreRoles) => {
        if (role.priority === 1) return <Crown className="h-4 w-4 text-yellow-600" />;
        if (role.priority === 2) return <ShieldCheck className="h-4 w-4 text-blue-600" />;
        if (role.isCustom) return <Shield className="h-4 w-4 text-purple-600" />;
        return <Shield className="h-4 w-4 text-gray-600" />;
    };

    const isPending = isCreating || isUpdating || isDeleting;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Roles & Permissions</CardTitle>
                            <CardDescription>
                                Manage roles and their associated permissions for your team
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreateClick} disabled={isPending}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                            No roles found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map((role) => (
                                        <TableRow key={role.$id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getRoleIcon(role)}
                                                    <span className="font-medium">{role.roleName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {role.description}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {role.permissions && role.permissions.length} permission{role.permissions && role.permissions.length !== 1 ? "s" : ""}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {role.isCustom ? (
                                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-400">
                                                        Custom
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                                        <Lock className="mr-1 h-3 w-3" />
                                                        Default
                                                    </Badge>
                                                )}
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
                                                            onClick={() => handleEditClick(role)}
                                                            disabled={isPending}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Role
                                                        </DropdownMenuItem>

                                                        {role.isCustom && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => handleDeleteClick(role.$id)}
                                                                    disabled={isPending}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete Role
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
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Create Custom Role</DialogTitle>
                        <DialogDescription>
                            Define a new role with specific permissions for your team members
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 flex-1 overflow-hidden">
                        <div className="grid gap-2">
                            <Label htmlFor="roleName">Role Name *</Label>
                            <Input
                                id="roleName"
                                placeholder="e.g., Inventory Specialist"
                                value={formData.roleName}
                                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                                maxLength={15}
                                disabled={isCreating}
                            />
                            <p className="text-xs text-muted-foreground">
                                {formData.roleName.length}/15 characters
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the responsibilities of this role"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                maxLength={50}
                                disabled={isCreating}
                                rows={2}
                            />
                            <p className="text-xs text-muted-foreground">
                                {formData.description.length}/50 characters
                            </p>
                        </div>

                        <div className="grid gap-2 flex-1 overflow-hidden">
                            <Label>Permissions * ({formData.permissions.length} selected)</Label>
                            <ScrollArea className="h-[300px] rounded-md border p-4">
                                {loadingPermissions ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-sm text-muted-foreground">Loading permissions...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {Object.entries(groupPermissionsByModule()).map(([module, perms]) => (
                                            <div key={module} className="space-y-2">
                                                <h4 className="font-medium capitalize text-sm">{module}</h4>
                                                <div className="space-y-2 ml-4">
                                                    {perms.map((perm) => (
                                                        <div key={perm.permissionKey} className="flex items-start space-x-2">
                                                            <Checkbox
                                                                id={perm.permissionKey}
                                                                checked={formData.permissions.includes(perm.permissionKey)}
                                                                onCheckedChange={() => togglePermission(perm.permissionKey)}
                                                                disabled={isCreating}
                                                            />
                                                            <div className="grid gap-1">
                                                                <Label
                                                                    htmlFor={perm.permissionKey}
                                                                    className="text-sm font-normal cursor-pointer"
                                                                >
                                                                    {perm.permissionName}
                                                                </Label>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {perm.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditOpen(false);
                                setSelectedRole(null);
                                resetForm();
                            }}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isUpdating}>
                            {isUpdating ? "Updating..." : "Update Role"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteDialog />
        </>
    )
}