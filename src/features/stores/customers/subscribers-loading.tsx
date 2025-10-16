import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatsCardsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-3 w-40" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function SubscribersTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters skeleton */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-[180px]" />
                </div>

                {/* Results count skeleton */}
                <Skeleton className="h-4 w-48" />

                {/* Table skeleton */}
                <div className="border rounded-lg">
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-4 w-full max-w-[200px]" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}