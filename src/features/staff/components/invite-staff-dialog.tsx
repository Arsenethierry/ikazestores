"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inviteStaffAction } from "@/lib/actions/staff.safe-actions";
import { StoreRoles } from "@/lib/types/appwrite/appwrite";
import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface InviteStaffDialogProps {
    storeId: string;
    storeType: "physical" | "virtual";
    roles: StoreRoles[];
}

export function InviteStaffDialog({ storeId, storeType, roles }: InviteStaffDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        email: "",
        roleId: "",
        customMessage: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.roleId) {
            toast.error("Please fill in all required fields");
            return;
        }

        startTransition(async () => {
            const result = await inviteStaffAction({
                storeId,
                storeType,
                email: formData.email,
                roleId: formData.roleId,
                customMessage: formData.customMessage || undefined,
            });

            if (result?.data?.success) {
                toast.success("Invitation sent successfully!");
                setOpen(false);
                setFormData({ email: "", roleId: "", customMessage: "" });
            } else {
                toast.error(result?.data?.error || "Failed to send invitation");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Staff
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                            Send an invitation to add a new member to your team. They'll receive an email with
                            instructions to accept.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">
                                Email Address <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={isPending}
                            />
                            <p className="text-xs text-muted-foreground">
                                We'll send them an invitation to join your store
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role">
                                Role <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.roleId}
                                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                                disabled={isPending}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.$id} value={role.$id}>
                                            <div className="flex items-center gap-2">
                                                <span>{role.roleName}</span>
                                                {role.isCustom && (
                                                    <span className="text-xs text-muted-foreground">(Custom)</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {formData.roleId &&
                                    roles.find((r) => r.$id === formData.roleId)?.description}
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="message">Personal Message (Optional)</Label>
                            <Textarea
                                id="message"
                                placeholder="Add a personal message to the invitation..."
                                value={formData.customMessage}
                                onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                                disabled={isPending}
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                This message will be included in the invitation email
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}