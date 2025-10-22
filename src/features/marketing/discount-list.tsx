"use client";

import { useState } from "react";
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
    Copy,
    Power,
    PowerOff,
    Search,
    Plus,
    Filter,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    deleteDiscountAction,
    bulkUpdateDiscountStatusAction,
} from "@/lib/actions/discount-actions";
import { Discounts } from "@/lib/types/appwrite/appwrite";

interface DiscountListProps {
    discounts: Discounts[];
    storeId: string;
}

export function DiscountList({ discounts, storeId }: DiscountListProps) {
    const router = useRouter();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});

    const { execute: deleteDiscount } = useAction(deleteDiscountAction, {
        onSuccess: ({ data }) => {
            toast.success(data?.message || "Discount deleted");
            router.refresh();
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to delete discount");
        },
    });

    const { execute: bulkUpdateStatus } = useAction(
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
            header: "Name",
            cell: ({ row }) => {
                const discount = row.original;
                return (
                    <div className="space-y-1">
                        <div className="font-medium">{discount.name}</div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {formatDiscountType(discount.discountType)}
                            </Badge>
                            {!discount.isActive && (
                                <Badge variant="secondary" className="text-xs">
                                    Inactive
                                </Badge>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "value",
            header: "Discount Value",
            cell: ({ row }) => {
                const discount = row.original;
                return (
                    <div className="font-medium">
                        {discount.valueType === "percentage"
                            ? `${discount.value}%`
                            : `${discount.value} RWF`}
                    </div>
                );
            },
        },
        {
            accessorKey: "applicableTo",
            header: "Applies To",
            cell: ({ row }) => {
                const applicableTo = row.getValue("applicableTo") as string;
                return (
                    <Badge variant="secondary">
                        {formatApplicableTo(applicableTo)}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "startDate",
            header: "Start Date",
            cell: ({ row }) => {
                const date = row.getValue("startDate") as string;
                return format(new Date(date), "MMM dd, yyyy");
            },
        },
        {
            accessorKey: "endDate",
            header: "End Date",
            cell: ({ row }) => {
                const date = row.getValue("endDate") as string | undefined;
                return date ? format(new Date(date), "MMM dd, yyyy") : "No end date";
            },
        },
        {
            accessorKey: "usage",
            header: "Usage",
            cell: ({ row }) => {
                const discount = row.original;
                const percentage = discount.usageLimit
                    ? ((discount.currentUsageCount || 0) / discount.usageLimit) * 100
                    : 0;

                return (
                    <div className="space-y-1">
                        <div className="text-sm">
                            {discount.currentUsageCount}
                            {discount.usageLimit && ` / ${discount.usageLimit}`}
                        </div>
                        {discount.usageLimit && (
                            <div className="w-full bg-secondary rounded-full h-1.5">
                                <div
                                    className={cn(
                                        "h-1.5 rounded-full transition-all",
                                        percentage >= 90 ? "bg-red-500" : "bg-primary"
                                    )}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
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
                                onClick={() =>
                                    router.push(
                                        `/admin/*/marketing/discounts/${discount.$id}/edit`
                                    )
                                }
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    router.push(
                                        `/admin/*/marketing/discounts/${discount.$id}/duplicate`
                                    )
                                }
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() =>
                                    bulkUpdateStatus({
                                        discountIds: [discount.$id],
                                        isActive: !discount.isActive,
                                    })
                                }
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
                                onClick={() => deleteDiscount({ discountId: discount.$id })}
                                className="text-destructive focus:text-destructive"
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

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search discounts..."
                            value={
                                (table.getColumn("name")?.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                                table.getColumn("name")?.setFilterValue(event.target.value)
                            }
                            className="pl-9"
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {hasSelection && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const ids = selectedRows.map((row) => row.original.$id);
                                    bulkUpdateStatus({ discountIds: ids, isActive: true });
                                }}
                            >
                                <Power className="mr-2 h-4 w-4" />
                                Activate ({selectedRows.length})
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const ids = selectedRows.map((row) => row.original.$id);
                                    bulkUpdateStatus({ discountIds: ids, isActive: false });
                                }}
                            >
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate ({selectedRows.length})
                            </Button>
                        </>
                    )}
                    <Button
                        onClick={() =>
                            router.push(`/admin/*/marketing/discounts/create`)
                        }
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Discount
                    </Button>
                </div>
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
            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    {hasSelection
                        ? `${selectedRows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected`
                        : `${table.getFilteredRowModel().rows.length} total discount(s)`}
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
        </div>
    );
}

function formatDiscountType(type: string): string {
    const types: Record<string, string> = {
        percentage: "Percentage",
        fixed_amount: "Fixed Amount",
        buy_x_get_y: "BOGO",
        bundle: "Bundle",
        bulk_pricing: "Bulk",
        flash_sale: "Flash Sale",
        first_time_buyer: "First Time",
    };
    return types[type] || type;
}

function formatApplicableTo(applicableTo: string): string {
    const types: Record<string, string> = {
        products: "Products",
        categories: "Categories",
        collections: "Collections",
        store_wide: "Store-wide",
        combinations: "Variants",
    };
    return types[applicableTo] || applicableTo;
}