import { getOrderStatsAction } from "@/lib/actions/product-order-actions";
import { OrdersStatsClient } from "./orders-stats-client";

interface OrdersStatsWrapperProps {
    storeId: string;
    storeType: 'virtual' | 'physical' | undefined;
    searchParams: { [key: string]: string | string[] | undefined };
}

export async function OrdersStatsWrapper({
    storeId,
    storeType,
    searchParams
}: OrdersStatsWrapperProps) {
    const timeRange = (searchParams.timeRange as string) || '30';
    const days = parseInt(timeRange);
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    
    const dateRange = { from, to };
    
    const statsResult = await getOrderStatsAction({
        storeId,
        storeType,
        dateRange
    });

    if (!statsResult?.success || !statsResult.data) {
        return (
            <div className="rounded-md border p-8 text-center">
                <p className="text-muted-foreground">Failed to load statistics</p>
                {statsResult?.error && (
                    <p className="mt-2 text-sm text-destructive">{statsResult.error}</p>
                )}
            </div>
        );
    }

    return (
        <OrdersStatsClient
            stats={statsResult.data}
            storeId={storeId}
            storeType={storeType}
            initialTimeRange={timeRange}
        />
    )
}