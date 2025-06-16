"use client"

import { Button } from "@/components/ui/button";
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
} from "@tanstack/react-table"
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[],
    currentStoreId: string
}

export function ProductsDataTable<TData, TValue>({
    columns,
    data,
    currentStoreId
}: DataTableProps<TData, TValue>) {
    const router = useRouter();

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    );
    const [rowSelection, setRowSelection] = useState({});


    const table = useReactTable({
        data,
        columns,
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
            rowSelection
        },
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Filter products2..."
                        value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("title")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    {selectedRows.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                                {selectedRows.length} selected
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    if (confirm(`Delete ${selectedRows.length} products?`)) {
                                        // Handle bulk delete
                                        console.log('Bulk delete:', selectedRows);
                                    }
                                }}
                            >
                                Delete Selected
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
                                    colSpan={columns.length}
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
        // <>
        //     <div className="flex items-center py-4 justify-between">
        //         <Input
        //             placeholder="Filter products2..."
        //             value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
        //             onChange={(event) =>
        //                 table.getColumn("title")?.setFilterValue(event.target.value)
        //             }
        //             className="max-w-sm"
        //         />
        //         <Button onClick={() => router.push(`/admin/stores/${currentStoreId}/products/new`)}>New product</Button>
        //     </div >
        //     <div className="rounded-md border">
        //         <Table>
        //             <TableHeader>
        //                 {table.getHeaderGroups().map((headerGroup) => (
        //                     <TableRow key={headerGroup.id}>
        //                         {headerGroup.headers.map((header) => {
        //                             return (
        //                                 <TableHead key={header.id}>
        //                                     {header.isPlaceholder
        //                                         ? null
        //                                         : flexRender(
        //                                             header.column.columnDef.header,
        //                                             header.getContext()
        //                                         )}
        //                                 </TableHead>
        //                             )
        //                         })}
        //                     </TableRow>
        //                 ))}
        //             </TableHeader>

        //             <TableBody>
        //                 {table.getRowModel().rows?.length ? (
        //                     table.getRowModel().rows.map((row) => (
        //                         <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
        //                             {row.getVisibleCells().map((cell) => (
        //                                 <TableCell key={cell.id}>
        //                                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
        //                                 </TableCell>
        //                             ))}
        //                         </TableRow>
        //                     ))
        //                 ) : (
        //                     <TableRow>
        //                         <TableCell colSpan={columns.length} className="h-24 text-center">
        //                             No data found
        //                         </TableCell>
        //                     </TableRow>
        //                 )}
        //             </TableBody>
        //         </Table>
        //     </div>

        //     <div className="flex items-center justify-end space-x-2 py-4">
        //         <Button
        //             variant="outline"
        //             size="sm"
        //             onClick={() => table.previousPage()}
        //             disabled={!table.getCanPreviousPage()}
        //         >
        //             Previous
        //         </Button>
        //         <Button
        //             variant="outline"
        //             size="sm"
        //             onClick={() => table.nextPage()}
        //             disabled={!table.getCanNextPage()}
        //         >
        //             Next
        //         </Button>
        //     </div>
        // </>
    )
}