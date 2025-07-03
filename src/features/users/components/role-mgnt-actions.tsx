import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/lib/constants";
import { Textarea } from "@/components/ui/textarea";
import { changeUserRole } from "../users-actions";

export const RoleManagementActions = ({ userId, currentRole, userName }: {
    userId: string;
    currentRole: string;
    userName: string;
}) => {
    const router = useRouter();

    const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [changeReason, setChangeReason] = useState('');

    const { execute: changeRole, isExecuting: isChangingRole } = useAction(
        changeUserRole,
        {
            onSuccess: (result) => {
                if (result.data?.success) {
                    toast.success(result.data.success);
                    setIsChangeRoleDialogOpen(false);
                    setSelectedRole('');
                    setChangeReason('');
                    router.refresh();
                } else {
                    toast.error(result.data?.error || "Failed to change role");
                }
            },
            onError: (error) => {
                toast.error("Failed to change role");
                console.error("Change role error:", error);
            }
        }
    );

    const handleChangeRole = async () => {
        if (!selectedRole) {
            toast.error("Please select a new role");
            return;
        }

        const confirmed = await confirm(`Are you sure you want to change ${userName}'s role from ${getRoleDisplayName(currentRole)} to ${getRoleDisplayName(selectedRole)}?`);
        if (!confirmed) return;

        changeRole({
            userId,
            newRole: selectedRole,
            reason: changeReason
        });
    };


    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case UserRole.SYS_ADMIN: return "System Admin";
            case UserRole.SYS_AGENT: return "System Agent";
            case UserRole.PHYSICAL_STORE_OWNER: return "Physical Vendor";
            case UserRole.VIRTUAL_STORE_OWNER: return "Virtual Seller";
            case UserRole.STORE_ADMIN: return "Store Admin";
            case UserRole.STORE_STAFF: return "Store Staff";
            case UserRole.PHYSICAL_SELLER_PENDING: return "Pending Vendor";
            case UserRole.BUYER: return "Buyer";
            default: return role;
        }
    };

    const availableRoles = Object.values(UserRole).filter(role => role !== currentRole);

    return (
        <>
            <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsChangeRoleDialogOpen(true)}
            >
                Change Role
            </Button>

            <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            Change {userName}&apos;s role from {getRoleDisplayName(currentRole)} to a different role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Current Role</Label>
                            <p className="text-sm text-muted-foreground font-medium">
                                {getRoleDisplayName(currentRole)}
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="role-select">Select New Role</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a new role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRoles.map(role => (
                                        <SelectItem key={role} value={role}>
                                            {getRoleDisplayName(role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="change-reason">Reason for Change (Optional)</Label>
                            <Textarea
                                id="change-reason"
                                placeholder="Provide a reason for changing this role..."
                                value={changeReason}
                                onChange={(e) => setChangeReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsChangeRoleDialogOpen(false)}
                            disabled={isChangingRole}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleChangeRole}
                            disabled={isChangingRole || !selectedRole}
                        >
                            {isChangingRole ? 'Changing...' : 'Change Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}