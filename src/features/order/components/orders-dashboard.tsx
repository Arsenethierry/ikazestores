import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhysicalStoreTypes, VirtualStoreTypes } from "@/lib/types";
import Link from "next/link";
import { Suspense } from "react";
import { OrdersTableWrapper } from "./0rders-table-wrapper";
import { OrdersStatsWrapper } from "./orders-stats-wrapper";
import { OrdersStatsSkeleton, OrdersTableSkeleton, QuickStatsSkeleton } from "./loading-skeletons";
import { OrdersFilters } from "./orders-filters";
import { QuickStats } from "./quick-stats";

interface OrdersDashboardProps {
    storeId: string;
    storeType: 'virtual' | 'physical' | undefined;
    userRole: 'admin' | 'physical_store' | 'virtual_store';
    currentStore: VirtualStoreTypes | PhysicalStoreTypes | null;
    permissions: {
        canUpdateStatus: boolean;
        canUpdateFulfillment: boolean;
        canCancel: boolean;
        canBulkUpdate: boolean;
        canViewAll: boolean;
    };
    searchParams: { [key: string]: string | string[] | undefined };
}

export function OrdersDashboard({
    storeId,
    storeType,
    userRole,
    currentStore,
    permissions,
    searchParams
}: OrdersDashboardProps) {
    const activeTab = (searchParams.tab as string) || 'orders';

    return (
        <div className="space-y-6">
            <Suspense fallback={<QuickStatsSkeleton />}>
                <QuickStats
                    storeId={storeId}
                    storeType={storeType}
                    dateRange={searchParams.dateRange ? {
                        from: new Date(searchParams.dateFrom as string),
                        to: new Date(searchParams.dateTo as string)
                    } : undefined}
                />
            </Suspense>

            <Tabs defaultValue={activeTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="orders" asChild>
                        <Link href={`?tab=orders`}>All Orders</Link>
                    </TabsTrigger>
                    <TabsTrigger value="stats" asChild>
                        <Link href={`?tab=stats`}>Analytics</Link>
                    </TabsTrigger>
                    {storeType === 'physical' && (
                        <TabsTrigger value="fulfillment" asChild>
                            <Link href={`?tab=fulfillment`}>Fulfillment</Link>
                        </TabsTrigger>
                    )}
                    {storeType === 'virtual' && (
                        <TabsTrigger value="commissions" asChild>
                            <Link href={`?tab=commissions`}>Commissions</Link>
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Management</CardTitle>
                            <CardDescription>
                                View and manage orders for {currentStore?.storeName}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <OrdersFilters
                                storeType={storeType!}
                                permissions={permissions}
                                searchParams={searchParams}
                            />
                            <Suspense fallback={<OrdersTableSkeleton />}>
                                <OrdersTableWrapper
                                    storeId={storeId}
                                    storeType={storeType}
                                    permissions={permissions}
                                    searchParams={searchParams}
                                    view="default"
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats">
                    <Suspense fallback={<OrdersStatsSkeleton />}>
                        <OrdersStatsWrapper
                            storeId={storeId}
                            storeType={storeType}
                            searchParams={searchParams}
                        />
                    </Suspense>
                </TabsContent>

                {storeType === 'physical' && (
                    <TabsContent value="fulfillment">
                        <Card>
                            <CardHeader>
                                <CardTitle>Fulfillment Management</CardTitle>
                                <CardDescription>
                                    Manage order fulfillment and shipping
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<OrdersTableSkeleton />}>
                                    <OrdersTableWrapper
                                        storeId={storeId}
                                        storeType={storeType}
                                        permissions={permissions}
                                        searchParams={searchParams}
                                        view="fulfillment"
                                    />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {storeType === 'virtual' && (
                    <TabsContent value="commissions">
                        <Card>
                            <CardHeader>
                                <CardTitle>Commission Tracking</CardTitle>
                                <CardDescription>
                                    Track your earnings and commission status
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<OrdersTableSkeleton />}>
                                    <OrdersTableWrapper
                                        storeId={storeId}
                                        storeType={storeType}
                                        permissions={permissions}
                                        searchParams={searchParams}
                                        view="commissions"
                                    />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}

