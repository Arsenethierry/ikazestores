import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthState } from "@/lib/user-label-permission";
import { AccessDeniedCard } from "@/components/access-denied-card";
import { getProductTypes } from "@/features/categories/actions/product-types-actions";
import ProductTypesClient from "@/features/variants management/components/product-types-client";

export default async function ProductTypesPage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<ProductTypesPageSkeleton />}>
                <ProductTypesContent storeId={storeId} />
            </Suspense>
        </div>
    );
}

async function ProductTypesContent({ storeId }: { storeId: string }) {
    const productTypesResponse = await getProductTypes({ storeId });
    const productTypes = productTypesResponse?.documents || [];
    const { user } = await getAuthState();

    if (!user) {
        return <AccessDeniedCard />
    }

    return (
        <ProductTypesClient
            initialProductTypes={productTypes}
            currentUser={user}
            storeId={storeId}
        />
    );
}

function ProductTypesPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-6 border rounded-lg space-y-4">
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
    );
}