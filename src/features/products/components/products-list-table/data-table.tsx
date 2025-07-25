"use client"

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirm } from "@/hooks/use-confirm";
import { OriginalProductTypes } from "@/lib/types";
import ErrorAlert from "@/components/error-alert";
import SpinningLoader from "@/components/spinning-loader";
import { useDeleteOriginalProducts } from "@/hooks/queries-and-mutations/use-original-products-queries";

interface DataTableProps<TValue> {
    columns: ColumnDef<OriginalProductTypes, TValue>[];
    data: OriginalProductTypes[];
    currentStoreId: string;
}

export function ProductsDataTable<TValue>({
    columns,
    data,
    currentStoreId
}: DataTableProps<TValue>) {
    const router = useRouter();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [ConfirmationDialog, confirm] = useConfirm(
        "Delete Products",
        "Are you sure you want to delete the selected products? This action cannot be undone.",
        "destructive"
    );

    const deleteProductsMutation = useDeleteOriginalProducts();

    const selectColumn: ColumnDef<OriginalProductTypes, TValue> = {
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
    };

    const table = useReactTable({
        data,
        columns: [selectColumn, ...columns],
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;

    const handleBulkDelete = async () => {
        const confirmed = await confirm();
        if (!confirmed) return;

        setErrorMessage(null);

        const productIds = selectedRows.map((row) => row.original.$id);
        
        deleteProductsMutation.mutate(productIds, {
            onSuccess: (result) => {
                if ('error' in result) {
                    setErrorMessage(result.error || null);
                } else {
                    setRowSelection({});
                }
            },
            onError: (error) => {
                setErrorMessage(error instanceof Error ? error.message : "Failed to delete products");
            }
        });
    };

    return (
        <div className="space-y-4">
            <ConfirmationDialog />
            {errorMessage && <ErrorAlert errorMessage={errorMessage} />}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Filter products..."
                        value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("title")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    {selectedRows.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <span className="w-max text-sm text-gray-600">
                                {selectedRows.length} selected
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={deleteProductsMutation.isPending}
                            >
                                {deleteProductsMutation.isPending ? (
                                    <>
                                        <SpinningLoader /> <span>Deleting...</span>
                                    </>
                                ) : 'Delete Selected'}
                            </Button>
                        </div>
                    )}
                </div>
                <Button onClick={() => router.push(`/admin/stores/${currentStoreId}/products/new`)}>
                    New Product
                </Button>
            </div>

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
                                    colSpan={columns.length + 1} // Account for select column
                                    className="h-24 text-center"
                                >
                                    No products found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
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