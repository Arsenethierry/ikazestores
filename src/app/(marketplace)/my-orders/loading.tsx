import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Skeleton className="h-8 w-48 mb-8" />
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[...Array(2)].map((_, j) => (
                                <div key={j} className="flex items-center gap-4">
                                    <Skeleton className="h-16 w-16 rounded-lg" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-4 w-32" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}