import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCustomerOrdersAction } from "@/lib/actions/product-order-actions";
import { OrderStatus } from "@/lib/constants";
import { Package } from "lucide-react";
import { OrderCard } from "./order-card";

interface MyOrdersListProps {
    customerId: string;
    searchParams: { [key: string]: string | string[] | undefined };
}

export async function MyOrdersList({ customerId, searchParams }: MyOrdersListProps) {
    const page = parseInt(searchParams.page as string) || 1;
    const status = searchParams.status as OrderStatus;

    const result = await getCustomerOrdersAction({
        customerId,
        page,
        limit: 10,
        status: status ? [status] : undefined
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
            <OrderFilters currentStatus={status} />
            
            <div className="space-y-4">
                {orders.map((order) => (
                    <OrderCard key={order.$id} order={order} />
                ))}
            </div>

            {total > 10 && (
                <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(total / 10)}
                    baseUrl="/my-orders"
                />
            )}
        </div>
    )
}