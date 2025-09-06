import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrdersTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-[250px]" />
                <div className="flex space-x-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>
            </div>
            
            <div className="rounded-md border">
                <div className="p-4">
                    {/* Table header */}
                    <div className="grid grid-cols-8 gap-4 mb-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                    
                    {/* Table rows */}
                    {Array.from({ length: 10 }).map((_, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-8 gap-4 py-3 border-t">
                            {Array.from({ length: 8 }).map((_, cellIndex) => (
                                <Skeleton key={cellIndex} className="h-4 w-full" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-[150px]" />
                <div className="flex space-x-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-8" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function OrdersStatsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex space-x-2">
                    <Skeleton className="h-10 w-[140px]" />
                    <Skeleton className="h-10 w-20" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-[200px] w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-[200px] w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function QuickStatsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-4" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-20 mb-1" />
                                <Skeleton className="h-6 w-12" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}