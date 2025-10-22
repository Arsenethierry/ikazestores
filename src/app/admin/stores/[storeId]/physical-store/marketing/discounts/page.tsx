import { Suspense } from "react";
import { DiscountModel } from "@/lib/models/DiscountModel";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DiscountList } from "@/features/marketing/discount-list";

export const revalidate = 600; // ISR - 5 minutes

interface PageProps {
    params: { storeId: string };
}

export default async function PhysicalStoreDiscountsPage({ params }: PageProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Tag className="h-8 w-8" />
                    <div>
                        <h1 className="text-3xl font-bold">Discounts & Promotions</h1>
                        <p className="text-muted-foreground mt-1">
                            Create and manage discounts for your physical store
                        </p>
                    </div>
                </div>
                <Button asChild>
                    <Link href={`/admin/stores/${params.storeId}/physical-store/marketing/discounts/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Discount
                    </Link>
                </Button>
            </div>

            {/* Quick Stats */}
            <Suspense fallback={<StatsSkeletonPhysical />}>
                <DiscountStatsPhysical storeId={params.storeId} />
            </Suspense>

            {/* Discount List */}
            <Suspense fallback={<DiscountListSkeleton />}>
                <DiscountListServer storeId={params.storeId} storeType="physical" />
            </Suspense>
        </div>
    )
}

async function DiscountStatsPhysical({ storeId }: { storeId: string }) {
    const discountModel = new DiscountModel();
    const activeDiscounts = await discountModel.findMany({
        filters: [
            { field: "storeId", operator: "equal", value: storeId },
            { field: "isActive", operator: "equal", value: true },
        ],
    });

    const totalUsage = activeDiscounts.documents.reduce(
        (sum, d) => sum + (d.currentUsageCount || 0),
        0
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeDiscounts.documents.length}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUsage}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Discount Types</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Set(activeDiscounts.documents.map(d => d.discountType)).size}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

async function DiscountListServer({ storeId, storeType }: { storeId: string; storeType: string }) {
    const discountModel = new DiscountModel();
    const result = await discountModel.getActiveDiscounts(storeId, { limit: 50 });

    return <DiscountList discounts={result.documents} storeId={storeId} />;
}

function StatsSkeletonPhysical() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
        </div>
    );
}

function DiscountListSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
}
