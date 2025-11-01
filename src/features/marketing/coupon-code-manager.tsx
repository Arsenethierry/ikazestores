"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    Plus,
    Copy,
    MoreHorizontal,
    Trash2,
    Power,
    PowerOff,
    Loader2,
    Search,
    CheckCircle,
    XCircle,
    Eye,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CouponCodes } from "@/lib/types/appwrite-types";
import { useConfirm } from "@/hooks/use-confirm";
import {
    toggleCouponStatusAction,
    deleteCouponAction,
    bulkCouponOperationAction,
} from "@/lib/actions/coupon-actions";
import { createCouponCodeAction } from "@/lib/actions/discount-actions";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load dialogs
const CreateCouponDialog = lazy(() =>
    import("./create-coupon-dialog").then((mod) => ({ default: mod.CreateCouponDialog }))
);
const DeleteCouponDialog = lazy(() =>
    import("./delete-coupon-dialog").then((mod) => ({ default: mod.DeleteCouponDialog }))
);
const CouponUsageDialog = lazy(() =>
    import("./coupon-usage-dialog").then((mod) => ({ default: mod.CouponUsageDialog }))
);

interface CouponCodeManagerProps {
    discountId: string;
    discountName: string;
    storeId: string;
    existingCoupons: CouponCodes[];
}

export function CouponCodeManager({
    discountId,
    discountName,
    storeId,
    existingCoupons,
}: CouponCodeManagerProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCoupons, setSelectedCoupons] = useState<Set<string>>(new Set());
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deletingCoupon, setDeletingCoupon] = useState<CouponCodes | null>(null);
    const [viewingUsage, setViewingUsage] = useState<CouponCodes | null>(null);

    const [ConfirmDeactivate, confirmDeactivate] = useConfirm(
        "Deactivate Coupon",
        "Are you sure you want to deactivate this coupon? Customers will no longer be able to use it.",
        "destructive"
    );

    const [ConfirmBulkDeactivate, confirmBulkDeactivate] = useConfirm(
        "Deactivate Multiple Coupons",
        "Are you sure you want to deactivate the selected coupons?",
        "destructive"
    );

    const { execute: toggleStatus, status: toggleStatus_status } = useAction(
        toggleCouponStatusAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.message || "Coupon status updated");
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to update coupon");
            },
        }
    );

    const { execute: bulkOperation, status: bulkStatus } = useAction(
        bulkCouponOperationAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.message || "Operation completed");
                setSelectedCoupons(new Set());
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Operation failed");
            },
        }
    );

    const isLoading = toggleStatus_status === "executing" || bulkStatus === "executing";

    const filteredCoupons = existingCoupons.filter((coupon) =>
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggleStatus = async (coupon: CouponCodes) => {
        if (coupon.isActive) {
            const confirmed = await confirmDeactivate();
            if (!confirmed) return;
        }

        toggleStatus({
            couponId: coupon.$id,
            isActive: !coupon.isActive,
            storeId,
        });
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Coupon code copied to clipboard");
    };

    const toggleCouponSelection = (couponId: string) => {
        const newSelection = new Set(selectedCoupons);
        if (newSelection.has(couponId)) {
            newSelection.delete(couponId);
        } else {
            newSelection.add(couponId);
        }
        setSelectedCoupons(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedCoupons.size === filteredCoupons.length) {
            setSelectedCoupons(new Set());
        } else {
            setSelectedCoupons(new Set(filteredCoupons.map((c) => c.$id)));
        }
    };

    const handleBulkActivate = () => {
        bulkOperation({
            couponIds: Array.from(selectedCoupons),
            operation: "activate",
            storeId,
        });
    };

    const handleBulkDeactivate = async () => {
        const confirmed = await confirmBulkDeactivate();
        if (!confirmed) return;

        bulkOperation({
            couponIds: Array.from(selectedCoupons),
            operation: "deactivate",
            storeId,
        });
    };

    const handleBulkDelete = () => {
        bulkOperation({
            couponIds: Array.from(selectedCoupons),
            operation: "delete",
            storeId,
        });
    };

    const hasSelection = selectedCoupons.size > 0;

    return (
        <>
            <ConfirmDeactivate />
            <ConfirmBulkDeactivate />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Coupon Codes</CardTitle>
                            <CardDescription>
                                Manage coupon codes for {discountName}
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsCreateOpen(true)} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Coupon
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search and Bulk Actions */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search coupon codes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {hasSelection && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {selectedCoupons.size} selected
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkActivate}
                                    disabled={isLoading}
                                >
                                    <Power className="mr-2 h-4 w-4" />
                                    Activate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkDeactivate}
                                    disabled={isLoading}
                                >
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Deactivate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    disabled={isLoading}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Coupons Table */}
                    {filteredCoupons.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? "No coupons match your search"
                                    : "No coupon codes yet"}
                            </p>
                            {!searchQuery && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => setIsCreateOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Coupon
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={
                                                    selectedCoupons.size === filteredCoupons.length
                                                }
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Usage</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCoupons.map((coupon) => (
                                        <TableRow key={coupon.$id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedCoupons.has(coupon.$id)}
                                                    onCheckedChange={() =>
                                                        toggleCouponSelection(coupon.$id)
                                                    }
                                                    aria-label="Select coupon"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                                                        {coupon.code}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleCopy(coupon.code)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        coupon.isActive ? "default" : "secondary"
                                                    }
                                                    className={cn(
                                                        coupon.isActive
                                                            ? "bg-green-500 hover:bg-green-600"
                                                            : "bg-gray-300 text-gray-700"
                                                    )}
                                                >
                                                    {coupon.isActive ? (
                                                        <>
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="mr-1 h-3 w-3" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {coupon.usageCount || 0} uses
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {format(
                                                        new Date(coupon.$createdAt),
                                                        "MMM dd, yyyy"
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <span className="sr-only">
                                                                Open menu
                                                            </span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => handleCopy(coupon.code)}
                                                        >
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Copy Code
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setViewingUsage(coupon)}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Usage
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleStatus(coupon)}
                                                            disabled={isLoading}
                                                        >
                                                            {coupon.isActive ? (
                                                                <>
                                                                    <PowerOff className="mr-2 h-4 w-4" />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Power className="mr-2 h-4 w-4" />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setDeletingCoupon(coupon)
                                                            }
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Summary */}
                    {existingCoupons.length > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                            <span>
                                Total: {existingCoupons.length} coupon
                                {existingCoupons.length !== 1 ? "s" : ""}
                            </span>
                            <span>
                                {existingCoupons.filter((c) => c.isActive).length} active
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Lazy-loaded Dialogs */}
            <Suspense fallback={<DialogLoadingFallback />}>
                {isCreateOpen && (
                    <CreateCouponDialog
                        discountId={discountId}
                        storeId={storeId}
                        isOpen={isCreateOpen}
                        onClose={() => setIsCreateOpen(false)}
                        onSuccess={() => router.refresh()}
                    />
                )}
            </Suspense>

            <Suspense fallback={<DialogLoadingFallback />}>
                {deletingCoupon && (
                    <DeleteCouponDialog
                        coupon={deletingCoupon}
                        storeId={storeId}
                        isOpen={!!deletingCoupon}
                        onClose={() => setDeletingCoupon(null)}
                        onSuccess={() => router.refresh()}
                    />
                )}
            </Suspense>

            <Suspense fallback={<DialogLoadingFallback />}>
                {viewingUsage && (
                    <CouponUsageDialog
                        coupon={viewingUsage}
                        isOpen={!!viewingUsage}
                        onClose={() => setViewingUsage(null)}
                    />
                )}
            </Suspense>
        </>
    );
}

function DialogLoadingFallback() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-white p-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        </div>
    );
}

export function CouponCodeManagerSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-9 w-32" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full max-w-sm" />
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}