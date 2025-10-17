import { ExploreStoresFilters, ExploreStoresFiltersSkeleton } from "@/features/stores/explore/explore-stores-filters";
import { ExploreStoresHero } from "@/features/stores/explore/explore-stores-hero";
import { StoresGrid, StoresGridSkeleton } from "@/features/stores/explore/stores-grid";
import { StoresPagination } from "@/features/stores/explore/stores-pagination";
import { ViewModeToggle } from "@/features/stores/explore/view-mode-toggle";
import { getExploreStores, getStoreStatistics } from "@/lib/actions/explore-stores.action";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Explore Virtual Stores | IkazeStores",
    description:
        "Discover unique virtual stores curated by influencers. Browse products from trusted sellers around the world.",
    openGraph: {
        title: "Explore Virtual Stores | IkazeStores",
        description:
            "Discover unique virtual stores curated by influencers. Browse products from trusted sellers around the world.",
        type: "website",
    },
};

export const revalidate = 300;

interface ExploreStoresPageProps {
    searchParams: Promise<{
        search?: string;
        rating?: string;
        sortBy?: string;
        page?: string;
        view?: string;
    }>;
}

export default async function ExploreStoresPage({ searchParams }: ExploreStoresPageProps) {
    const params = await searchParams;

    const filters = {
        search: params.search,
        rating: params.rating ? parseInt(params.rating) : undefined,
        sortBy: (params.sortBy as any) || "newest",
        page: params.page ? parseInt(params.page) : 1,
        limit: 25,
    };

    const viewMode = (params.view as "grid" | "list") || "grid";

    return (
        <div className="min-h-screen flex flex-col">
            <Suspense
                fallback={
                    <div className="bg-primary/10 animate-pulse">
                        <div className="h-64 md:h-80" />
                    </div>
                }
            >
                <HeroSection />
            </Suspense>

            <main className="flex-1 main-container py-8 space-y-6">
                {/* Filters */}
                <Suspense fallback={<ExploreStoresFiltersSkeleton />}>
                    <ExploreStoresFilters />
                </Suspense>

                {/* View Mode Toggle & Results Count */}
                <div className="flex items-center justify-between">
                    <Suspense fallback={<div className="h-10 w-32 bg-muted animate-pulse rounded" />}>
                        <ResultsCount filters={filters} />
                    </Suspense>
                    <ViewModeToggle />
                </div>

                {/* Stores Grid/List */}
                <Suspense fallback={<StoresGridSkeleton count={8} viewMode={viewMode} />}>
                    <StoresSection filters={filters} viewMode={viewMode} />
                </Suspense>
            </main>

        </div>
    )
}

async function HeroSection() {
    const stats = await getStoreStatistics();

    return (
        <ExploreStoresHero
            totalStores={stats.totalStores}
        />
    );
}

async function ResultsCount({ filters }: { filters: any }) {
    const result = await getExploreStores(filters);

    return (
        <div className="text-sm text-muted-foreground">
            <span className="font-medium">{result.total}</span> stores found
        </div>
    );
}

async function StoresSection({
    filters,
    viewMode,
}: {
    filters: any;
    viewMode: "grid" | "list";
}) {
    const result = await getExploreStores(filters);

    const totalPages = Math.ceil(result.total / filters.limit);

    return (
        <div className="space-y-6">
            <StoresGrid stores={result.documents} viewMode={viewMode} />

            {result.total > 0 && (
                <StoresPagination
                    currentPage={filters.page}
                    totalPages={totalPages}
                    totalResults={result.total}
                />
            )}
        </div>
    );
}