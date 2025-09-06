import { getOrdersAction } from "@/lib/actions/product-order-actions";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "@/lib/constants";
import { OrdersTable } from "./orders-table";
import { NoItemsCard } from "@/components/no-items-card";
import { OrderWithRelations } from "@/lib/models/OrderModel";

interface OrdersTableWrapperProps {
    storeId: string;
    storeType: 'virtual' | 'physical' | undefined;
    permissions: {
        canUpdateStatus: boolean;
        canUpdateFulfillment: boolean;
        canCancel: boolean;
        canBulkUpdate: boolean;
        canViewAll: boolean;
    };
    searchParams: { [key: string]: string | string[] | undefined };
    view?: 'default' | 'fulfillment' | 'commissions';
}

function parseSearchParams(searchParams: { [key: string]: string | string[] | undefined }) {
    const page = parseInt(searchParams.page as string) || 1;
    const limit = parseInt(searchParams.limit as string) || 25;
    const sortBy = (searchParams.sortBy as string) || '$createdAt';
    const sortOrder = (searchParams.sortOrder as string) || 'desc';

    const filters: any = {};

    if (searchParams.status) {
        const statuses = Array.isArray(searchParams.status)
            ? searchParams.status
            : searchParams.status.split(',');
        filters.status = statuses as OrderStatus[];
    }

    if (searchParams.fulfillmentStatus) {
        const statuses = Array.isArray(searchParams.fulfillmentStatus)
            ? searchParams.fulfillmentStatus
            : searchParams.fulfillmentStatus.split(',');
        filters.fulfillmentStatus = statuses as PhysicalStoreFulfillmentOrderStatus[];
    }

    if (searchParams.search) {
        filters.search = searchParams.search as string;
    }

    if (searchParams.customerId) {
        filters.customerId = searchParams.customerId as string;
    }

    if (searchParams.customerEmail) {
        filters.customerEmail = searchParams.customerEmail as string;
    }

    if (searchParams.dateFrom && searchParams.dateTo) {
        filters.dateRange = {
            from: new Date(searchParams.dateFrom as string),
            to: new Date(searchParams.dateTo as string)
        };
    }

    return { page, limit, sortBy, sortOrder, filters };
}

export async function OrdersTableWrapper({
    storeId,
    storeType,
    permissions,
    searchParams,
    view = 'default'
}: OrdersTableWrapperProps) {
    const { page, limit, sortBy, sortOrder, filters } = parseSearchParams(searchParams);

    const result = await getOrdersAction({
        storeId,
        storeType,
        filters,
        pagination: { page, limit },
        sorting: { field: sortBy, direction: sortOrder as 'asc' | 'desc' }
    });

    if (!result?.data?.success || !result.data.data) {
        return (
            <div className="rounded-md border p-8 text-center">
                <p className="text-muted-foreground">Failed to load orders</p>
                {result?.data?.error && (
                    <p className="mt-2 text-sm text-destructive">{result.data.error}</p>
                )}
            </div>
        );
    }

    const orders = result.data.data.orders?.filter((o): o is OrderWithRelations => o !== null);

    if (!orders || orders.length === 0) {
        return <NoItemsCard />;
    }

    return (
        <OrdersTable
            orders={orders}
            total={result.data.data.total || 0}
            page={page}
            limit={limit}
            sortBy={sortBy}
            sortOrder={sortOrder}
            storeId={storeId}
            storeType={storeType}
            permissions={permissions}
            view={view}
        />
    );
}