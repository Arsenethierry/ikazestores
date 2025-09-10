import { getAuthState } from "@/lib/user-permission";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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