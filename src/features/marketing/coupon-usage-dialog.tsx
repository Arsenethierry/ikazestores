"use client";

import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    Clock,
    Package,
} from "lucide-react";
import { format } from "date-fns";
import { CouponCodes } from "@/lib/types/appwrite-types";
import { getCouponUsageAction } from "@/lib/actions/coupon-actions";

interface CouponUsageDialogProps {
    coupon: CouponCodes;
    isOpen: boolean;
    onClose: () => void;
}

export function CouponUsageDialog({ coupon, isOpen, onClose }: CouponUsageDialogProps) {
    const [usageData, setUsageData] = useState<any>(null);

    const { execute: getUsage, status } = useAction(getCouponUsageAction, {
        onSuccess: ({ data }) => {
            setUsageData(data);
        },
    });

    useEffect(() => {
        if (isOpen) {
            getUsage({ couponId: coupon.$id });
        }
    }, [isOpen, coupon.$id]);

    const isLoading = status === "executing";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Coupon Usage Statistics</DialogTitle>
                    <DialogDescription>
                        Usage details for coupon code{" "}
                        <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {coupon.code}
                        </code>
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                    {isLoading ? (
                        <UsageLoadingSkeleton />
                    ) : (
                        <div className="space-y-4">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Total Uses
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {usageData?.totalUses || 0}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Unique Customers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {usageData?.uniqueCustomers || 0}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Total Discount
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {usageData?.totalDiscount?.toFixed(2) || 0} RWF
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Coupon Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Coupon Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Status
                                        </p>
                                        <Badge
                                            variant={coupon.isActive ? "default" : "secondary"}
                                            className="mt-1"
                                        >
                                            {coupon.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Created
                                        </p>
                                        <p className="text-sm font-semibold mt-1">
                                            {format(
                                                new Date(coupon.$createdAt),
                                                "MMM dd, yyyy 'at' h:mm a"
                                            )}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Usage */}
                            {usageData?.recentUsage && usageData.recentUsage.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Recent Usage
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {usageData.recentUsage.map((usage: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 rounded-lg border"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                                            <Package className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                Order #{usage.orderId?.slice(0, 8)}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {format(
                                                                    new Date(usage.usedAt),
                                                                    "MMM dd, yyyy 'at' h:mm a"
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-green-600">
                                                            -{usage.discountAmount?.toFixed(2) || 0}{" "}
                                                            RWF
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            discount
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Empty State */}
                            {(!usageData?.recentUsage || usageData.recentUsage.length === 0) && (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                                        <p className="mt-4 text-sm text-muted-foreground">
                                            No usage history yet
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This coupon hasn't been used by any customers
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

function UsageLoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-3">
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}