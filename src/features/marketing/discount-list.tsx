"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
    ColumnFiltersState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    MoreHorizontal,
    Edit,
    Trash2,
    Power,
    PowerOff,
    Search,
    Eye,
    Loader2,
    Settings,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { bulkUpdateDiscountStatusAction } from "@/lib/actions/discount-actions";
import { Discounts } from "@/lib/types/appwrite-types";
import { useConfirm } from "@/hooks/use-confirm";

const EditDiscountDialog = lazy(() =>
    import("./edit-discount-dialog").then((mod) => ({ default: mod.EditDiscountDialog }))
);
const DeleteDiscountDialog = lazy(() =>
    import("./delete-discount-dialog").then((mod) => ({ default: mod.DeleteDiscountDialog }))
);

interface DiscountListProps {
    discounts: Discounts[];
    storeId: string;
}

export function DiscountList({ discounts, storeId }: DiscountListProps) {
    const router = useRouter();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});

    const [editingDiscount, setEditingDiscount] = useState<Discounts | null>(null);
    const [deletingDiscount, setDeletingDiscount] = useState<Discounts | null>(null);

    const [ConfirmDialog, confirm] = useConfirm(
        "Deactivate Discount",
        "Are you sure you want to deactivate this discount? It will no longer be available to customers.",
        "destructive"
    );

    const { execute: bulkUpdateStatus, status } = useAction(
        bulkUpdateDiscountStatusAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.message || "Discounts updated");
                setRowSelection({});
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to update discounts");
            },
        }
    );

    const isBulkUpdating = status === "executing";

    const handleStatusToggle = async (discount: Discounts) => {
        if (discount.isActive) {
            const confirmed = await confirm();
            if (!confirmed) return;
        }

        bulkUpdateStatus({
            discountIds: [discount.$id],
            isActive: !discount.isActive,
            storeId,
        });
    };

    const handleViewDetails = (discountId: string) => {
        router.push(
            `/admin/stores/${storeId}/physical-store/marketing/discounts/${discountId}`
        );
    };

    const columns: ColumnDef<Discounts>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: "Discount Name",
            cell: ({ row }) => {
                const discount = row.original;
                return (
                    <button
                        onClick={() => handleViewDetails(discount.$id)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                    >
                        {discount.name}
                    </button>
                );
            },
        },
        {
            accessorKey: "discountType",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("discountType") as string;
                const typeLabels: Record<string, string> = {
                    percentage: "Percentage",
                    fixed_amount: "Fixed Amount",
                    buy_x_get_y: "Buy X Get Y",
                    bundle: "Bundle",
                    bulk_pricing: "Bulk Pricing",
                    flash_sale: "Flash Sale",
                    first_time_buyer: "First Time Buyer",
                };
                return (
                    <span className="text-sm text-muted-foreground">
                        {typeLabels[type] || type}
                    </span>
                );
            },
        },
        {
            accessorKey: "value",
            header: "Value",
            cell: ({ row }) => {
                const value = row.getValue("value") as number;
                const valueType = row.original.valueType;
                return (
                    <span className="font-medium">
                        {valueType === "percentage" ? `${value}%` : `${value} RWF`}
                    </span>
                );
            },
        },
        {
            id: "usage",
            header: "Usage",
            cell: ({ row }) => {
                const discount = row.original;
                const current = discount.currentUsageCount || 0;
                const limit = discount.usageLimit;
                return (
                    <span className="text-sm">
                        {current}
                        {limit ? ` / ${limit}` : ""}
                    </span>
                );
            },
        },
        {
            id: "dates",
            header: "Duration",
            cell: ({ row }) => {
                const discount = row.original;
                const start = format(new Date(discount.startDate), "MMM dd");
                const end = discount.endDate
                    ? format(new Date(discount.endDate), "MMM dd, yyyy")
                    : "No end";
                return (
                    <div className="text-sm">
                        <div>{start}</div>
                        <div className="text-muted-foreground text-xs">{end}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("isActive") as boolean;
                return (
                    <Badge
                        variant={isActive ? "default" : "secondary"}
                        className={cn(
                            isActive
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-gray-300 text-gray-700"
                        )}
                    >
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "priority",
            header: "Priority",
            cell: ({ row }) => {
                const priority = row.getValue("priority") as number;
                return (
                    <Badge
                        variant={priority > 50 ? "default" : "secondary"}
                        className="font-mono"
                    >
                        {priority}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const discount = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => handleViewDetails(discount.$id)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setEditingDiscount(discount)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => router.push(`/admin/stores/${storeId}/physical-store/marketing/discounts/${discount.$id}/edit`)}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Manage
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleStatusToggle(discount)}
                                disabled={isBulkUpdating}
                            >
                                {discount.isActive ? (
                                    <>
                                        <PowerOff className="mr-2 h-4 w-4" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <Power className="mr-2 h-4 w-4" />
                                        Activate
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setDeletingDiscount(discount)}
                                className="text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: discounts,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const hasSelection = selectedRows.length > 0;

    const handleBulkActivate = () => {
        const discountIds = selectedRows.map((row) => row.original.$id);
        bulkUpdateStatus({
            discountIds,
            isActive: true,
            storeId,
        });
    };

    const handleBulkDeactivate = async () => {
        const confirmed = await confirm();
        if (!confirmed) return;

        const discountIds = selectedRows.map((row) => row.original.$id);
        bulkUpdateStatus({
            discountIds,
            isActive: false,
            storeId,
        });
    };

    return (
        <div className="space-y-4">
            <ConfirmDialog />

            {/* Search and Bulk Actions */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 max-w-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search discounts..."
                            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("name")?.setFilterValue(event.target.value)
                            }
                            className="pl-9"
                        />
                    </div>
                </div>

                {hasSelection && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {selectedRows.length} selected
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkActivate}
                            disabled={isBulkUpdating}
                        >
                            {isBulkUpdating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Power className="mr-2 h-4 w-4" />
                            )}
                            Activate
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDeactivate}
                            disabled={isBulkUpdating}
                        >
                            {isBulkUpdating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <PowerOff className="mr-2 h-4 w-4" />
                            )}
                            Deactivate
                        </Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No discounts found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Lazy-loaded Dialogs with Suspense */}
            <Suspense fallback={<DialogLoadingFallback />}>
                {editingDiscount && (
                    <EditDiscountDialog
                        discount={editingDiscount}
                        isOpen={!!editingDiscount}
                        onClose={() => setEditingDiscount(null)}
                        onSuccess={() => router.refresh()}
                    />
                )}
            </Suspense>

            <Suspense fallback={<DialogLoadingFallback />}>
                {deletingDiscount && (
                    <DeleteDiscountDialog
                        discount={deletingDiscount}
                        isOpen={!!deletingDiscount}
                        onClose={() => setDeletingDiscount(null)}
                        onSuccess={() => router.refresh()}
                    />
                )}
            </Suspense>
        </div>
    );
}

function DialogLoadingFallback() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-white p-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        </div>
    );
}