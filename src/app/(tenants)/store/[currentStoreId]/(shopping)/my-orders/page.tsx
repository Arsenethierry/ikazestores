import { MyOrdersList } from "@/features/order/my-orders/my-orders-list";
import { getAuthState } from "@/lib/user-permission";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function MyOrdersPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { user } = await getAuthState();

    if (!user) {
        redirect('/sign-in?redirectUrl=/my-orders');
    }

    const params = await searchParams;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">My Orders</h1>
                <p className="text-muted-foreground mt-2">
                    Track and manage your orders
                </p>
            </div>

            <Suspense fallback={<OrdersSkeleton />}>
                <MyOrdersList
                    customerId={user.$id}
                    searchParams={params}
                />
            </Suspense>
        </div>
    )
}

function OrdersSkeleton() {
    return (
        <div className="space-y-6">
            <Card className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-9 w-[180px]" />
                </div>
            </Card>

            <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                    <OrderCardSkeleton key={index} />
                ))}
            </div>

            <div className="flex items-center justify-center">
                <div className="flex items-center gap-1">
                    {[...Array(7)].map((_, index) => (
                        <Skeleton key={index} className="h-9 w-9" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function OrderCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {[...Array(2)].map((_, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <Skeleton className="h-[50px] w-[50px] rounded-md" />
                            <div className="flex-1 min-w-0 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                    <Skeleton className="h-3 w-20" />
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                </div>

                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </CardContent>
        </Card>
    );
}