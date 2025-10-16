import { AccessDeniedCard } from "@/components/access-denied-card";
import { RefreshButton } from "@/components/refresh-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StoreSubscribersStats } from "@/features/stores/customers/store-subscribers-stats";
import { StoreSubscribersTable } from "@/features/stores/customers/store-subscribers-table";
import { StatsCardsSkeleton, SubscribersTableSkeleton } from "@/features/stores/customers/subscribers-loading";
import { getVirtualStoreById } from "@/lib/actions/virtual-store.action";
import { getAuthState } from "@/lib/user-permission";
import { Users } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface CustomersPageProps {
    params: Promise<{ storeId: string }>;
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: 'all' | 'active' | 'inactive';
    }>;
}

async function CustomersPage({ params, searchParams }: CustomersPageProps) {
    const { storeId } = await params;
    const search = await searchParams;
    const { user, isVirtualStoreOwner } = await getAuthState();

    if (!user || !isVirtualStoreOwner) {
        return <AccessDeniedCard />;
    }

    const store = await getVirtualStoreById(storeId);

    if (!store) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Store Customers</h1>
                        <p className="text-muted-foreground">
                            Manage your store subscribers and send email campaigns
                        </p>
                    </div>
                </div>
                <RefreshButton />
            </div>

            <Suspense fallback={<StatsCardsSkeleton />}>
                <StoreSubscribersStats storeId={storeId} />
            </Suspense>

            <Suspense fallback={<SubscribersTableSkeleton />}>
                <StoreSubscribersTable
                    storeId={storeId}
                    searchParams={search}
                />
            </Suspense>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">About Store Customers</CardTitle>
                    <CardDescription>
                        How the subscription system works
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <p className="font-medium mb-1">📧 Email Preferences</p>
                        <p className="text-muted-foreground">
                            Customers can opt-in to receive marketing emails, order updates,
                            new product announcements, and promotions from your store.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">🎯 Targeted Campaigns</p>
                        <p className="text-muted-foreground">
                            Send bulk emails only to customers who opted-in for specific types
                            of communications. Respect customer preferences automatically.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">📊 Subscriber Management</p>
                        <p className="text-muted-foreground">
                            View and filter your subscriber list with advanced search and
                            status filtering capabilities.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">✅ GDPR Compliant</p>
                        <p className="text-muted-foreground">
                            Customers can easily unsubscribe or update their preferences at
                            any time. All emails include unsubscribe links.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CustomersPage;