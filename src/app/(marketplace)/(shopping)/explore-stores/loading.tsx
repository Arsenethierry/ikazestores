import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { HomePageFooter } from "@/components/navbars/home-page-footer";

export default function ExploreStoresLoading() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Skeleton */}
            <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 md:py-24">
                <div className="main-container">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="flex justify-center">
                            <Skeleton className="h-8 w-48 bg-white/20" />
                        </div>
                        <Skeleton className="h-16 w-3/4 mx-auto bg-white/20" />
                        <Skeleton className="h-6 w-2/3 mx-auto bg-white/20" />
                        <div className="flex justify-center gap-8 pt-6">
                            <Skeleton className="h-20 w-32 bg-white/20" />
                            <Skeleton className="h-20 w-32 bg-white/20" />
                            <Skeleton className="h-20 w-32 bg-white/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 main-container py-8 space-y-6">
                {/* Filters Skeleton */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* View Toggle Skeleton */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-40" />
                </div>

                {/* Stores Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i}>
                            <Skeleton className="h-48 w-full rounded-t-lg" />
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
                                <Skeleton className="h-9 w-full mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="flex justify-center py-8">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                </div>
            </div>
        </div>
    );
}