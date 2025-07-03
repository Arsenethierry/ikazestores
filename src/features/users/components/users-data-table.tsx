"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserRole } from '@/lib/constants';
import { UserDataTypes } from '@/lib/types';
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, EllipsisVertical } from 'lucide-react';
import React, { useState } from 'react';
import { PhysicalSellerActions } from './physical-seller-actions';
import { RoleManagementActions } from './role-mgnt-actions';

const columns: ColumnDef<UserDataTypes>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "fullName",
        header: "Full Name",
        cell: ({ row }) => {
            return row.original.fullName
        }
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
            return row.original.email
        }
    },
    {
        accessorKey: "phoneNumber",
        header: "Phone Number",
        cell: ({ row }) => {
            return row.original.phoneNumber
        }
    },
    {
        accessorKey: "accountType",
        header: "Account Type",
        cell: ({ row }) => {
            const user = row.original;

            const hasPhysicalSellerPending = user.accountType?.includes(UserRole.PHYSICAL_SELLER_PENDING);
            const isPhysicalSeller = user.accountType?.includes(UserRole.PHYSICAL_STORE_OWNER);
            const isVirtualSeller = user.accountType?.includes(UserRole.VIRTUAL_STORE_OWNER);
            const isSystemAdmin = user.accountType?.includes(UserRole.SYS_ADMIN);
            const isSystemAgent = user.accountType?.includes(UserRole.SYS_AGENT);

            if (hasPhysicalSellerPending) {
                return (
                    <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50 hover:bg-amber-100 transition-colors">
                        <div className="flex items-center gap-1.5">
                            <div className="relative">
                                <span className="absolute inset-0 size-2 rounded-full bg-amber-400 animate-ping" aria-hidden="true"></span>
                            </div>
                            <span className="font-medium">⏳ Vendor Pending</span>
                        </div>
                    </Badge>
                );
            } else if (isPhysicalSeller) {
                return (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold">🏪 Physical Vendor</span>
                        </div>
                    </Badge>
                );
            } else if (isVirtualSeller) {
                return (
                    <Badge variant="outline" className="text-blue-700 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold">💻 Virtual Seller</span>
                        </div>
                    </Badge>
                );
            } else if (isSystemAdmin) {
                return (
                    <Badge variant="outline" className="text-red-700 border-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold">⚡ System Admin</span>
                        </div>
                    </Badge>
                );
            } else if (isSystemAgent) {
                return (
                    <Badge variant="outline" className="text-purple-700 border-purple-500 bg-purple-50 hover:bg-purple-100 transition-colors">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold">🛡️ System Agent</span>
                        </div>
                    </Badge>
                );
            }

            return (
                <Badge variant="outline" className="text-slate-700 border-slate-400 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-1.5">
                        <span className="font-medium">🛒 Buyer</span>
                    </div>
                </Badge>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const user = row.original;
            const hasPhysicalSellerPending = user.accountType.includes(UserRole.PHYSICAL_SELLER_PENDING);
            const currentRole = user.accountType || UserRole.BUYER;

            return (
                <div className='flex items-center gap-2'>
                    {hasPhysicalSellerPending && (
                        <PhysicalSellerActions userId={user.$id} userData={user} />
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                                size="icon"
                            >
                                <EllipsisVertical />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            {!hasPhysicalSellerPending && (
                                <>
                                    <RoleManagementActions
                                        userId={user.$id}
                                        currentRole={currentRole}
                                        userName={user.fullName}
                                    />
                                </>
                            )}
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Make a copy</DropdownMenuItem>
                            <DropdownMenuItem>Favorite</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    }
];

export const UsersDataTable = ({
    data,
}: {
    data: UserDataTypes[]
}) => {

    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination
        },
        getRowId: (row) => row.$id.toString(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
        <div className='space-y-4'>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <div className="flex items-center gap-2">
                        <Select
                            value={columnFilters.find(f => f.id === 'accountType')?.value as string || 'all'}
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    setColumnFilters(prev => prev.filter(f => f.id !== 'accountType'));
                                } else {
                                    setColumnFilters(prev => [
                                        ...prev.filter(f => f.id !== 'accountType'),
                                        { id: 'accountType', value }
                                    ]);
                                }
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by accountType" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value={UserRole.PHYSICAL_SELLER_PENDING}>Pending vendor Applications</SelectItem>
                                <SelectItem value={UserRole.PHYSICAL_STORE_OWNER}>Approved Vendors</SelectItem>
                                <SelectItem value={UserRole.VIRTUAL_STORE_OWNER}>Virtual sellers</SelectItem>
                                <SelectItem value={UserRole.SYS_ADMIN}>Syst Admins</SelectItem>
                                <SelectItem value={UserRole.SYS_AGENT}>Sys Agents</SelectItem>
                                <SelectItem value={UserRole.BUYER}>Buyers</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <Table>
                <TableHeader className='bg-muted sticky top-0 z-10'>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} colSpan={header.colSpan}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                    {table.getRowModel().rows?.length ? (
                        <>
                            {table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </>
                    ) : (
                        <TableRow>
                            <TableCell>
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className='flex items-center justify-between px-4'>
                <div className='text-muted-foreground hidden flex-1 text-sm lg:flex'>
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className='flex w-full items-center gap-8 lg:w-fit'>
                    <div className='hidden items-center gap-2 lg:flex'>
                        <Label htmlFor='rows-per-page' className='text-sm font-medium'>
                            Rows per page
                        </Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value))
                            }}
                        >
                            <SelectTrigger className="w-20" id="rows-per-page">
                                <SelectValue
                                    placeholder={table.getState().pagination.pageSize}
                                />
                            </SelectTrigger>
                            <SelectContent side='top'>
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='flex w-fit items-center justify-center text-sm font-medium'>
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </div>
                    <div className='ml-auto flex items-center gap-2 lg:ml-0'>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden size-8 lg:flex"
                            size="icon"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}