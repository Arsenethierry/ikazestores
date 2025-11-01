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
import { Discounts } from "@/lib/types/appwrite-types";

interface DiscountListProps {
    discounts: Discounts[];
    storeId: string;
}

export function DiscountList({ discounts, storeId }: DiscountListProps) {
    const router = useRouter();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});

    const { execute: deleteDiscount, status: deleteStatus } = useAction(deleteDiscountAction, {
        onSuccess: ({ data }) => {
            toast.success(data?.message || "Discount deleted");
            router.refresh();
        },
        onError: ({ error }) => {
            toast.error(error.serverError || "Failed to delete discount");
        },
    });

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

    const isDeleting = deleteStatus === "executing";
    const isBulkUpdating = status === "executing";

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
                const name = row.getValue("name") as string;
                return <div className="font-medium">{name}</div>;
            },
        },
        {
            accessorKey: "discountType",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("discountType") as string;
                return (
                    <Badge variant="outline">
                        {type.replace(/_/g, " ").toUpperCase()}
                    </Badge>
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
                    <div>
                        {valueType === "percentage" ? `${value}%` : `${value} RWF`}
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
                        {applicableTo.replace(/_/g, " ")}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "startDate",
            header: "Start Date",
            cell: ({ row }) => {
                const date = row.getValue("startDate") as string;
                return <div>{format(new Date(date), "MMM dd, yyyy")}</div>;
            },
        },
        {
            accessorKey: "endDate",
            header: "End Date",
            cell: ({ row }) => {
                const date = row.getValue("endDate") as string | undefined;
                return (
                    <div>
                        {date ? format(new Date(date), "MMM dd, yyyy") : "No end date"}
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
                                        storeId, // ✅ FIXED: Added missing storeId
                                    })
                                }
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
                                onClick={() =>
                                    deleteDiscount({ discountId: discount.$id })
                                }
                                className="text-red-600"
                                disabled={isDeleting}
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
            storeId, // ✅ FIXED: Added missing storeId
        });
    };

    const handleBulkDeactivate = () => {
        const discountIds = selectedRows.map((row) => row.original.$id);
        bulkUpdateStatus({
            discountIds,
            isActive: false,
            storeId, // ✅ FIXED: Added missing storeId
        });
    };

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search discounts..."
                            value={
                                (table.getColumn("name")?.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                                table.getColumn("name")?.setFilterValue(event.target.value)
                            }
                            className="pl-8"
                        />
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
                                <Power className="mr-2 h-4 w-4" />
                                Activate
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkDeactivate}
                                disabled={isBulkUpdating}
                            >
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                            </Button>
                        </div>
                    )}
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
        </div>
    );
}