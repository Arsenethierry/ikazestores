"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bulkUpdateOrdersAction } from "@/lib/actions/product-order-actions";
import { OrderStatus } from "@/lib/constants";
import { OrderWithRelations } from "@/lib/models/OrderModel";
import { Checkbox } from "@radix-ui/react-checkbox";
import { format } from "date-fns";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { OrderActionsMenu } from "./order-actions-menu";
import { OrderDetailsDialog } from "./order-details-dialog";

interface OrdersTableProps {
    orders: OrderWithRelations[];
    total: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
    storeId: string;
    storeType: 'virtual' | 'physical' | undefined;
    permissions: {
        canUpdateStatus: boolean;
        canUpdateFulfillment: boolean;
        canCancel: boolean;
        canBulkUpdate: boolean;
        canViewAll: boolean;
    };
    view?: 'default' | 'fulfillment' | 'commissions';
}

export function OrdersTable({
    orders: initialOrders,
    total,
    page,
    limit,
    sortBy,
    sortOrder,
    storeId,
    storeType,
    permissions,
    view = 'default'
}: OrdersTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState("");

    const [orders, setOptimisticOrders] = useOptimistic(
        initialOrders,
        (state, { orderId, updates }: { orderId: string; updates: Partial<OrderWithRelations> }) => {
            return state.map(order =>
                order.$id === orderId ? { ...order, ...updates } : order
            );
        }
    );

    const totalPages = Math.ceil(total / limit);

    const createQueryString = useCallback(
        (params: Record<string, string | number | undefined>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    newSearchParams.set(key, value.toString());
                } else {
                    newSearchParams.delete(key);
                }
            });

            return newSearchParams.toString();
        },
        [searchParams]
    );

    const handleSort = (column: string) => {
        const newSortOrder = column === sortBy && sortOrder === 'asc' ? 'desc' : 'asc';
        router.push(`${pathname}?${createQueryString({ sortBy: column, sortOrder: newSortOrder })}`);
    };

    const handlePageChange = (newPage: number) => {
        router.push(`${pathname}?${createQueryString({ page: newPage })}`);
    };

    const handleLimitChange = (newLimit: string) => {
        router.push(`${pathname}?${createQueryString({ limit: newLimit, page: 1 })}`);
    };

    const handleRefresh = () => {
        router.refresh();
    };

    const handleSearch = (value: string) => {
        setGlobalFilter(value);
        // Debounce search
        const timeoutId = setTimeout(() => {
            router.push(`${pathname}?${createQueryString({ search: value, page: 1 })}`);
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOrders(new Set(orders.map(o => o.$id)));
        } else {
            setSelectedOrders(new Set());
        }
    };

    const handleSelectOrder = (orderId: string, checked: boolean) => {
        const newSelection = new Set(selectedOrders);
        if (checked) {
            newSelection.add(orderId);
        } else {
            newSelection.delete(orderId);
        }
        setSelectedOrders(newSelection);
    };

    const handleBulkStatusUpdate = async (status: OrderStatus) => {
        if (selectedOrders.size === 0) return;

        startTransition(async () => {
            try {
                const result = await bulkUpdateOrdersAction({
                    orderIds: Array.from(selectedOrders),
                    updates: { orderStatus: status }
                });

                if (result?.data?.success) {
                    toast.success(`Updated ${selectedOrders.size} orders`);
                    setSelectedOrders(new Set());
                    router.refresh();
                } else {
                    toast.error(result?.data?.error || "Failed to update orders");
                }
            } catch (error) {
                toast.error("Failed to update orders");
            }
        });
    };

    const handleOrderUpdate = async (orderId: string, updates: any) => {
        setOptimisticOrders({ orderId, updates });
        router.refresh();
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case OrderStatus.PENDING: return "secondary";
            case OrderStatus.PROCESSING: return "default";
            case OrderStatus.SHIPPED: return "outline";
            case OrderStatus.DELIVERED: return "default";
            case OrderStatus.CANCELLED: return "destructive";
            default: return "secondary";
        }
    };

    const exportOrders = () => {
        // Create CSV content
        const headers = ['Order #', 'Customer', 'Status', 'Total', 'Date'];
        const rows = orders.map(order => [
            order.orderNumber,
            order.customerEmail || 'Guest',
            order.orderStatus,
            `${order.customerTotalAmount} ${order.customerCurrency}`,
            format(new Date(order.$createdAt), 'PPp')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center space-x-2">
                    <Input
                        placeholder="Search orders..."
                        value={globalFilter}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="max-w-sm"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isPending}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                <div className="flex items-center space-x-2">
                    {permissions.canBulkUpdate && selectedOrders.size > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Bulk Actions ({selectedOrders.size})
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.values(OrderStatus).map((status) => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        onClick={() => handleBulkStatusUpdate(status)}
                                        disabled={isPending}
                                    >
                                        Mark as {status}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <Button variant="outline" size="sm" onClick={exportOrders}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedOrders.size === orders.length && orders.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('orderNumber')}
                                    className="h-8 p-0 hover:bg-transparent"
                                >
                                    Order #
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            {view === 'fulfillment' && (
                                <TableHead>Fulfillment</TableHead>
                            )}
                            {view === 'commissions' && (
                                <TableHead>Commission</TableHead>
                            )}
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('customerTotalAmount')}
                                    className="h-8 p-0 hover:bg-transparent"
                                >
                                    Total
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort('$createdAt')}
                                    className="h-8 p-0 hover:bg-transparent"
                                >
                                    Date
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.$id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedOrders.has(order.$id)}
                                            onCheckedChange={(checked) =>
                                                handleSelectOrder(order.$id, !!checked)
                                            }
                                            aria-label="Select row"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        #{order.orderNumber}
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[150px] truncate">
                                            {order.customerEmail || 'Guest'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.orderStatus)} className="capitalize">
                                            {order.orderStatus}
                                        </Badge>
                                    </TableCell>
                                    {view === 'fulfillment' && (
                                        <TableCell>
                                            {order.fulfillmentRecords?.[0] ? (
                                                <Badge variant="outline" className="capitalize">
                                                    {order.fulfillmentRecords[0].physicalStoreFulfillmentOrderStatus.replace('_', ' ')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">No Record</Badge>
                                            )}
                                        </TableCell>
                                    )}
                                    {view === 'commissions' && (
                                        <TableCell>
                                            <div className="font-medium">
                                                {order.commissionRecords?.reduce((sum, r) => sum + r.totalCommission, 0).toFixed(2)} {order.baseCurrency}
                                            </div>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="font-medium">
                                            {order.customerTotalAmount.toFixed(2)} {order.customerCurrency}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(order.$createdAt), 'PPp')}
                                    </TableCell>
                                    <TableCell>
                                        <OrderActionsMenu
                                            order={order}
                                            permissions={permissions}
                                            onOrderUpdate={() => handleOrderUpdate(order.$id, {})}
                                            onViewDetails={() => setSelectedOrderId(order.$id)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <select
                        value={limit}
                        onChange={(e) => handleLimitChange(e.target.value)}
                        className="h-8 w-[70px] rounded border border-input bg-transparent px-3 py-1 text-sm"
                    >
                        {[10, 25, 50, 100].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePageChange(1)}
                            disabled={page === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={page >= totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {selectedOrderId && (
                <OrderDetailsDialog
                    orderId={selectedOrderId}
                    isOpen={!!selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                    permissions={permissions}
                    onOrderUpdate={() => router.refresh()}
                />
            )}
        </div>
    )
}

