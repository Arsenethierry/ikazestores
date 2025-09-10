import { NoItemsCard } from '@/components/no-items-card';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CloneProductsContainer } from '@/features/products/components/clone-products/clone-products-container';
import { ProductsFiltersWrapper } from '@/features/products/components/clone-products/products-filters-wrapper';
import { ProductsHeader } from '@/features/products/components/clone-products/products-header';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { getAuthState } from '@/lib/user-permission';
import { ArrowLeft, TableOfContents } from 'lucide-react';
import Link from 'next/link';
import React, { Suspense } from 'react';

export default async function CloneProductsPage({
    params,
    searchParams,
}: {
    params: Promise<{ storeId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { storeId } = await params;
    const {
        // isPhysicalStoreOwner,
        isVirtualStoreOwner,
        isSystemAdmin,
        user
    } = await getAuthState();

    if (!isVirtualStoreOwner && !isSystemAdmin) {
        return (
            <div className="container mx-auto px-4 py-6">
                <div className="text-center py-12">
                    <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        You don&apos;t have permission to access this page. This feature is only available to virtual store owners.
                    </p>
                    <Link
                        href="/admin"
                        className={buttonVariants({ variant: "secondary" })}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const resolvedSearchParams = await searchParams;
    const storeData = await getVirtualStoreById(storeId);

    if(!storeData) return <NoItemsCard description={`Store with the id: ${storeId} is not found!`} />

    return (
        <div className="min-h-screen bg-gray-50/50">
            <ProductsHeader storeId={storeId} />

            <div className="container mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Clone Products</h1>
                    <p className="text-muted-foreground">
                        Browse and import products from other stores into your virtual store.
                    </p>
                </div>

                <ProductsFiltersWrapper
                    searchParams={resolvedSearchParams}
                    storeId={storeId}
                />

                <Suspense fallback={<ProductsGridSkeleton />}>
                    <CloneProductsContainer
                        storeData={storeData}
                        user={user}
                        searchParams={resolvedSearchParams}
                    />
                </Suspense>
            </div>
        </div>
    );
}

function ProductsGridSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-60 w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
