import { Alert, AlertDescription } from "@/components/ui/alert";
import { searchOrdersAction } from "@/lib/actions/product-order-actions";
import { OrderStatus } from "@/lib/constants";
import { Package } from "lucide-react";
import { OrderCard } from "./order-card";
import { OrderPagination } from "./order-pagination";
import { OrderFilter } from "./OrderFilter";

interface MyOrdersListProps {
    customerId: string;
    searchParams: { [key: string]: string | string[] | undefined };
}

export async function MyOrdersList({ customerId, searchParams }: MyOrdersListProps) {
    const page = parseInt(searchParams.page as string) || 1;
    const search = searchParams.search as string;
    const status = searchParams.status as OrderStatus & 'all';
    const paymentStatus = searchParams.paymentStatus as string;
    const dateFrom = searchParams.dateFrom as string;
    const dateTo = searchParams.dateTo as string;
    const minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice as string) : undefined;
    const maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice as string) : undefined;

    const result = await searchOrdersAction({
        search,
        status: status ? [status] : undefined,
        paymentStatus,
        dateFrom,
        dateTo,
        minPrice,
        maxPrice,
        page,
        limit: 10
    });

    if (!result?.data?.success || !result.data.orders) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Failed to load orders. Please try again later.
                </AlertDescription>
            </Alert>
        );
    }

    const { orders, total, hasMore } = result.data;

    if (orders.length === 0) {
        return (
            <div className="text-center py-12">
                <OrderFilter currentStatus={status} />

                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
                <p className="mt-2 text-muted-foreground">
                    You haven't placed any orders yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <OrderFilter
                currentStatus={status}
                showAdvanced={!!(search || dateFrom || dateTo || minPrice || maxPrice || paymentStatus)}
            />

            {(search || status || dateFrom || dateTo || minPrice || maxPrice || paymentStatus) && (
                <div className="text-sm text-muted-foreground">
                    Found {total} {total === 1 ? 'order' : 'orders'}
                    {search && ` matching "${search}"`}
                </div>
            )}

            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
                    <p className="mt-2 text-muted-foreground">
                        {search || status || dateFrom || dateTo || minPrice || maxPrice
                            ? "Try adjusting your filters"
                            : "You haven't placed any orders yet."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <OrderCard
                            key={order.$id}
                            order={order}
                        />
                    ))}
                </div>
            )}

            {total > 10 && (
                <OrderPagination
                    currentPage={page}
                    totalPages={Math.ceil(total / 10)}
                    baseUrl="/my-orders"
                />
            )}
        </div>
    )
}