import { Suspense } from "react";
import { DiscountModel } from "@/lib/models/DiscountModel";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiscountList } from "@/features/marketing/discount-list";

export const revalidate = 600;

interface PageProps {
    params: Promise<{ storeId: string }>;
}

export default async function PhysicalStoreDiscountsPage({ params }: PageProps) {
    const { storeId } = await params;

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
                    <Link href={`/admin/stores/${storeId}/physical-store/marketing/discounts/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Discount
                    </Link>
                </Button>
            </div>

            {/* Quick Stats */}
            <Suspense fallback={<StatsSkeletonPhysical />}>
                <DiscountStatsPhysical storeId={storeId} />
            </Suspense>

            {/* Discount List */}
            <Suspense fallback={<DiscountListSkeleton />}>
                <DiscountListServer storeId={storeId} />
            </Suspense>
        </div>
    );
}

// Server Component - Fetch and render discount list
async function DiscountListServer({ storeId }: { storeId: string }) {
    const discountModel = new DiscountModel();
    const result = await discountModel.findMany({
        filters: [
            { field: "storeId", operator: "equal", value: storeId },
            { field: "storeType", operator: "equal", value: "physical" },
        ],
    });

    return <DiscountList discounts={result.documents} storeId={storeId} />;
}

// Stats component
async function DiscountStatsPhysical({ storeId }: { storeId: string }) {
    const discountModel = new DiscountModel();

    const [active, upcoming, expired] = await Promise.all([
        discountModel.findMany({
            filters: [
                { field: "storeId", operator: "equal", value: storeId },
                { field: "isActive", operator: "equal", value: true },
            ],
        }),
        discountModel.findMany({
            filters: [
                { field: "storeId", operator: "equal", value: storeId },
                { field: "startDate", operator: "greaterThan", value: new Date().toISOString() },
            ],
        }),
        discountModel.findMany({
            filters: [
                { field: "storeId", operator: "equal", value: storeId },
                { field: "endDate", operator: "lessThan", value: new Date().toISOString() },
            ],
        }),
    ]);

    const totalUsage = active.documents.reduce(
        (sum, d) => sum + (d.currentUsageCount || 0),
        0
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{active.documents.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Currently active</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUsage}</div>
                    <p className="text-xs text-muted-foreground mt-1">Times used</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{upcoming.documents.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Expired</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{expired.documents.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Past discounts</p>
                </CardContent>
            </Card>
        </div>
    );
}

// Loading skeletons
function DiscountListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 flex-1 max-w-sm" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
            <div className="rounded-md border">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatsSkeletonPhysical() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-3 w-24" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}