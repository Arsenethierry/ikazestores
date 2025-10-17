import { ExploreStoreCard } from "./explore-store-card";
import { EnhancedVirtualStore } from "@/lib/actions/explore-stores.action";
import { NoItemsCard } from "@/components/no-items-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Store } from "lucide-react";

interface StoresGridProps {
    stores: EnhancedVirtualStore[];
    viewMode: "grid" | "list";
}

export function StoresGrid({ stores, viewMode }: StoresGridProps) {
    if (stores.length === 0) {
        return (
            <NoItemsCard
                title="No stores found"
                description="Try adjusting your filters or search terms"
                icon={<Store className="h-12 w-12" />}
            />
        );
    }

    if (viewMode === "list") {
        return (
            <div className="space-y-4">
                {stores.map((store) => (
                    <ExploreStoreCard
                        key={store.$id}
                        store={store}
                        viewMode="list"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stores.map((store) => (
                <ExploreStoreCard
                    key={store.$id}
                    store={store}
                    viewMode="grid"
                />
            ))}
        </div>
    );
}


function StoreCardSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
    if (viewMode === "list") {
        return (
            <Card>
                <div className="flex flex-col md:flex-row">
                    <Skeleton className="h-48 md:h-full md:w-64" />
                    <div className="flex-1 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Skeleton className="h-9 w-full" />
            </CardFooter>
        </Card>
    );
}

export function StoresGridSkeleton({ count = 8, viewMode = "grid" }: { count?: number; viewMode?: "grid" | "list" }) {
    if (viewMode === "list") {
        return (
            <div className="space-y-4">
                {Array.from({ length: count }).map((_, i) => (
                    <StoreCardSkeleton key={i} viewMode="list" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <StoreCardSkeleton key={i} viewMode="grid" />
            ))}
        </div>
    );
}