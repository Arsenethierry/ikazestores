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
import { deleteDiscountAction } from "@/lib/actions/discount-actions";
import { Discounts } from "@/lib/types/appwrite-types";

interface DeleteDiscountDialogProps {
    discount: Discounts | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function DeleteDiscountDialog({
    discount,
    isOpen,
    onClose,
    onSuccess,
}: DeleteDiscountDialogProps) {
    const { execute: deleteDiscount, status } = useAction(deleteDiscountAction, {
        onSuccess: ({ data }) => {
            toast.success(data?.message || "Discount deleted successfully");
            onSuccess?.();
            onClose();
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to delete discount");
        },
    });

    const isPending = status === "executing";

    const handleDelete = () => {
        if (!discount) return;
        deleteDiscount({ discountId: discount.$id });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
                            <AlertDialogDescription className="mt-1">
                                This action cannot be undone
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="space-y-3 py-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete the discount{" "}
                        <span className="font-semibold text-foreground">
                            &quot;{discount?.name}&quot;
                        </span>
                        ?
                    </p>

                    {discount && discount.currentUsageCount && discount.currentUsageCount > 0 && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                            <p className="text-sm text-yellow-800">
                                <strong>Warning:</strong> This discount has been used{" "}
                                {discount.currentUsageCount} time(s). Deleting it will not affect
                                previous orders, but customers will no longer be able to use it.
                            </p>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                        All associated coupon codes will also be deleted.
                    </p>
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
                            "Delete Discount"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}