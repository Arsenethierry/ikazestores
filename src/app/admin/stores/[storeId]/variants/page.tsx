import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllProductTypes } from "@/features/products/actions/variants management/product-types-actions";
import VariantsDashboardClient from "./variants-dashboard-client";
import { CurrentUserType } from "@/lib/types";
import { getAuthState } from "@/lib/user-label-permission";
import { AccessDeniedCard } from "@/components/access-denied-card";

interface VariantsDashboardPageProps {
    params: Promise<{
        storeId: string;
    }>;
    searchParams: Promise<{
        productType?: string;
        tab?: string;
    }>;
}

export default async function VariantsDashboardPage({
    params,
    searchParams
}: VariantsDashboardPageProps) {
    const { storeId } = await params;
    const { user } = await getAuthState();

    if (!user) return <AccessDeniedCard />

    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<VariantsDashboardSkeleton />}>
                <VariantsDashboardContent
                    storeId={storeId}
                    searchParams={searchParams}
                    currentUser={user}
                />
            </Suspense>
        </div>
    );
}

async function VariantsDashboardContent({
    storeId,
    searchParams,
    currentUser
}: {
    storeId: string;
    searchParams: Promise<{ productType?: string; tab?: string; }>;
    currentUser: CurrentUserType
}) {
    const { productType, tab } = await searchParams;

    const productTypesResponse = await getAllProductTypes(storeId);
    const productTypes = productTypesResponse?.documents || [];

    return (
        <VariantsDashboardClient
            storeId={storeId}
            productTypes={productTypes}
            initialProductType={productType}
            initialTab={tab}
            currentUser={currentUser}
        />
    );
}

function VariantsDashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex space-x-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1">
                    <Skeleton className="h-32 w-full" />
                </div>

                <div className="col-span-1 md:col-span-3">
                    <div className="space-y-4">
                        <div className="flex space-x-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>

                        <Skeleton className="h-10 w-80" />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-4 border rounded-lg space-y-3">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <div className="flex space-x-2">
                                        <Skeleton className="h-8 w-16" />
                                        <Skeleton className="h-8 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}