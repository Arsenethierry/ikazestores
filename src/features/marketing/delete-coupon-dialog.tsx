"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { deleteCouponAction } from "@/lib/actions/coupon-actions";
import { CouponCodes } from "@/lib/types/appwrite-types";

interface DeleteCouponDialogProps {
    coupon: CouponCodes | null;
    storeId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function DeleteCouponDialog({
    coupon,
    storeId,
    isOpen,
    onClose,
    onSuccess,
}: DeleteCouponDialogProps) {
    const { execute: deleteCoupon, status } = useAction(deleteCouponAction, {
        onSuccess: ({ data }) => {
            toast.success(data?.message || "Coupon deleted successfully");
            onSuccess?.();
            onClose();
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to delete coupon");
        },
    });

    const isPending = status === "executing";

    const handleDelete = () => {
        if (!coupon) return;
        deleteCoupon({ couponId: coupon.$id, storeId });
    };

    if (!coupon) return null;

    const hasUsage = (coupon.usageCount || 0) > 0;

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <AlertDialogTitle>Delete Coupon Code</AlertDialogTitle>
                            <AlertDialogDescription className="mt-1">
                                This action cannot be undone
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="space-y-3 py-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete the coupon code{" "}
                        <code className="px-2 py-1 bg-muted rounded text-sm font-mono font-semibold">
                            {coupon.code}
                        </code>
                        ?
                    </p>

                    {hasUsage && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                            <p className="text-sm text-yellow-800">
                                <strong>Warning:</strong> This coupon has been used{" "}
                                {coupon.usageCount} time(s). Deleting it will remove all usage
                                history and customers will no longer be able to use it.
                            </p>
                        </div>
                    )}

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> The discount itself will remain active. Only
                            this specific coupon code will be deleted.
                        </p>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Coupon"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}