import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { AlertTriangle, Store } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import React, { Suspense } from 'react';
import { ProductsGridWrapper } from '../../_components/products-page/products-grid-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export const revalidate = 300;

interface ProductsPageProps {
    params: Promise<{ currentStoreId: string }>;
    searchParams: Promise<{
        category?: string;
        productType?: string;
        search?: string;
        minPrice?: string;
        maxPrice?: string;
        sortBy?: string;
    }>;
}

export default async function ModernProductsPage({
    params,
    searchParams,
}: ProductsPageProps) {
    try {
        const { currentStoreId: storeId } = await params;
        const filters = await searchParams;

        const store = await getVirtualStoreById(storeId);

        if (!store) {
            notFound();
        }

        return (
            <>
                <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-b">
                    <div className="container mx-auto py-8">
                        <div className="flex items-center gap-4 mb-6">
                            {store.storeLogoUrl ? (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white shadow-md">
                                    <Image
                                        src={store.storeLogoUrl}
                                        alt={store.storeName || 'store'}
                                        fill
                                        className="object-contain"
                                        sizes="64px"
                                        priority
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Store className="h-8 w-8 text-primary" />
                                </div>
                            )}

                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {filters.search
                                        ? `Search Results: "${filters.search}"`
                                        : filters.category
                                            ? `${filters.category}`
                                            : "All Products"}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {filters.search
                                        ? "Browse through our curated collection based on your search"
                                        : filters.category
                                            ? `Explore our wide range of ${filters.category.toLowerCase()} products`
                                            : "Discover our carefully curated selection of products"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Suspense fallback={<ProductsPageSkeleton />}>
                    <ProductsGridWrapper storeId={storeId} filters={filters} />
                </Suspense>
            </>
        )
    } catch (error) {
        console.error("Error loading products page:", error);
        return <StoreProductsErrorState error={error} />;
    }
}

function StoreProductsErrorState({ error }: { error: unknown }) {
    return (
        <div className="min-h-screen bg-gray-50/30">
            <div className="container mx-auto py-12">
                <Card className="p-8">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <AlertTriangle className="h-16 w-16 text-destructive" />
                        <h2 className="text-2xl font-bold">Something went wrong</h2>
                        <p className="text-muted-foreground max-w-md">
                            We encountered an error while loading the products page. Please try
                            again later.
                        </p>
                        {error instanceof Error && (
                            <p className="text-sm text-muted-foreground">{error.message}</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function ProductsPageSkeleton() {
    return (
        <div className="container mx-auto py-6">
            <div className="flex gap-6">
                {/* Sidebar Skeleton */}
                <aside className="hidden lg:block w-80 flex-shrink-0">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Price Range Skeleton */}
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-full" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 flex-1" />
                                    <Skeleton className="h-8 flex-1" />
                                </div>
                            </div>

                            {/* Filter Groups Skeleton */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="h-5 w-32" />
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4].map((j) => (
                                            <Skeleton key={j} className="h-8 w-full" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Content Skeleton */}
                <div className="flex-1 space-y-6">
                    {/* Header Controls Skeleton */}
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-32" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-[180px]" />
                            <Skeleton className="h-10 w-20" />
                        </div>
                    </div>

                    {/* Products Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProductCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-4 w-4 rounded-full" />
                    ))}
                </div>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </CardContent>
        </Card>
    );
}