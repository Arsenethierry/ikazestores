import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/hooks/use-confirm';
import { UserDataTypes } from '@/lib/types';
import { Check, Eye, X } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { reviewPhysicalSellerApplication } from '../users-actions';

interface PhysicalSellerActionsProps {
    userId: string;
    userData: UserDataTypes;
}

export const PhysicalSellerActions = ({ userId, userData }: PhysicalSellerActionsProps) => {
    const router = useRouter();

    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');

    const [ApproveConfirmDialog, confirmApprove] = useConfirm(
        "Approve Physical Seller Application",
        "Are you sure you want to approve this physical seller application? This action cannot be undone.",
        "primary"
    );

    const [RejectConfirmDialog, confirmReject] = useConfirm(
        "Reject Physical Seller Application",
        "Are you sure you want to reject this physical seller application? This action cannot be undone.",
        "destructive"
    );

    const { execute: reviewApplication, isExecuting: isReviewingApplication } = useAction(
        reviewPhysicalSellerApplication,
        {
            onSuccess: (result) => {
                if (result.data?.success) {
                    toast.success(result.data.success);
                    setIsApproveDialogOpen(false);
                    setIsRejectDialogOpen(false);
                    setReviewNotes('');
                    router.refresh()
                } else {
                    toast.error(result.data?.error || "Failed to review application");
                }
            },
            onError: (error) => {
                toast.error("Failed to review application");
                console.error("Review application error:", error);
            }
        }
    );

    const handleReject = async () => {
        if (!reviewNotes.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }
        const confirmed = await confirmReject();
        if (!confirmed) return;
        reviewApplication({
            userId,
            reviewNotes,
            action: 'reject'
        });
    }

    const handleApprove = async () => {
        const confirmed = await confirmApprove();
        if (!confirmed) return;

        reviewApplication({
            userId,
            reviewNotes,
            action: 'approve'
        });
    }

    const handleViewApplication = () => {
        setIsViewDialogOpen(true);
    };

    const handleCloseViewDialog = () => {
        setIsViewDialogOpen(false);
    };

    const handleCloseApproveDialog = () => {
        setIsApproveDialogOpen(false);
        setReviewNotes('');
    };

    const handleCloseRejectDialog = () => {
        setIsRejectDialogOpen(false);
        setReviewNotes('');
    };

    return (
        <>
            <Button
                variant="outline"
                size="xs"
                onClick={handleViewApplication}
            >
                <Eye className="w-3 h-3 mr-1" />
                View
            </Button>
            <Button
                variant="outline"
                size="xs"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => setIsApproveDialogOpen(true)}
            >
                <Check className="w-3 h-3 mr-1" />
                Approve
            </Button>
            <Button
                variant="outline"
                size="xs"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setIsRejectDialogOpen(true)}
            >
                <X className="w-3 h-3 mr-1" />
                Reject
            </Button>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Physical Seller Application</DialogTitle>
                        <DialogDescription>
                            Review the application details below
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="font-semibold">Applicant Name</Label>
                            <p className="text-sm text-muted-foreground">{userData.fullName}</p>
                        </div>
                        <div>
                            <Label className="font-semibold">Email</Label>
                            <p className="text-sm text-muted-foreground">{userData.email}</p>
                        </div>
                        <div>
                            <Label className="font-semibold">Phone Number</Label>
                            <p className="text-sm text-muted-foreground">{userData.phoneNumber}</p>
                        </div>
                        <div>
                            <Label className="font-semibold">Business Name</Label>
                            <p className="text-sm text-muted-foreground">{userData.businessName || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="font-semibold">Business Address</Label>
                            <p className="text-sm text-muted-foreground">{userData.businessAddress || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="font-semibold">Business Phone</Label>
                            <p className="text-sm text-muted-foreground">{userData.businessPhone || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="font-semibold">Business License</Label>
                            <p className="text-sm text-muted-foreground">{userData.businessLicense || 'N/A'}</p>
                        </div>
                        {userData.taxId && (
                            <div>
                                <Label className="font-semibold">Tax ID</Label>
                                <p className="text-sm text-muted-foreground">{userData.taxId}</p>
                            </div>
                        )}
                        <div>
                            <Label className="font-semibold">Reason for Application</Label>
                            <p className="text-sm text-muted-foreground">{userData.reason || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="font-semibold">Application Status</Label>
                            <p className="text-sm text-muted-foreground">{userData.applicationStatus || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="font-semibold">Applied At</Label>
                            <p className="text-sm text-muted-foreground">
                                {userData.$createdAt ? new Date(userData.$createdAt).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                        {userData.applicationReviewedAt && (
                            <div>
                                <Label className="font-semibold">Reviewed At</Label>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(userData.applicationReviewedAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                        {userData.applicationReviewNotes && (
                            <div>
                                <Label className="font-semibold">Review Notes</Label>
                                <p className="text-sm text-muted-foreground">{userData.applicationReviewNotes}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseViewDialog}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Physical Seller Application</DialogTitle>
                        <DialogDescription>
                            This will approve the application and grant physical seller permissions to the user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="approve-notes">Review Notes (Optional)</Label>
                            <Textarea
                                id="approve-notes"
                                placeholder="Add any notes about the approval..."
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCloseApproveDialog}
                            disabled={isReviewingApplication}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isReviewingApplication}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isReviewingApplication ? 'Approving...' : 'Approve Application'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Physical Seller Application</DialogTitle>
                        <DialogDescription>
                            This will reject the application. Please provide a reason for the rejection.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reject-notes">Rejection Reason *</Label>
                            <Textarea
                                id="reject-notes"
                                placeholder="Please provide a reason for rejection..."
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCloseRejectDialog}
                            disabled={isReviewingApplication}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={isReviewingApplication || !reviewNotes.trim()}
                            variant="destructive"
                        >
                            {isReviewingApplication ? 'Rejecting...' : 'Reject Application'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ApproveConfirmDialog />
            <RejectConfirmDialog />
        </>
    );
}