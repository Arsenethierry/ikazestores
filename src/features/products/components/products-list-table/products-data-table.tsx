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
    useReactTable,
    VisibilityState
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useConfirm } from "@/hooks/use-confirm";
import { OriginalProductTypes } from "@/lib/types";
import ErrorAlert from "@/components/error-alert";
import SpinningLoader from "@/components/spinning-loader";
import { useBulkUpdateProductStatus, useDeleteOriginalProducts, useToggleProductFeatured } from "@/hooks/queries-and-mutations/use-original-products-queries";
import Image from "next/image";
import { Archive, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Eye, Filter, MoreHorizontal, RefreshCw, RotateCcw, Search, SortAsc, SortDesc, Star, StarOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductsDataTableProps {
    data: OriginalProductTypes[];
    currentStoreId: string;
    isLoading?: boolean;
    totalCount?: number;
}

export function ProductsDataTable<TValue>({
    data,
    currentStoreId,
    isLoading = false,
    totalCount,
}: ProductsDataTableProps) {
    const router = useRouter();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState("");

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [ConfirmationDialog, confirm] = useConfirm(
        "Delete Products",
        "Are you sure you want to delete the selected products? This action cannot be undone.",
        "destructive"
    );

    const [ConfirmDeleteDialog, confirmDelete] = useConfirm(
        "Delete Products",
        "Are you sure you want to delete the selected products? This action cannot be undone.",
        "destructive"
    );

    const [ConfirmStatusDialog, confirmStatusUpdate] = useConfirm(
        "Update Product Status",
        "Are you sure you want to update the status of selected products?",
        "primary"
    );

    const onRefresh = () => {
        window.location.reload()
    }

    const deleteProductsMutation = useDeleteOriginalProducts();
    const toggleFeaturedMutation = useToggleProductFeatured();
    const bulkUpdateStatusMutation = useBulkUpdateProductStatus();

    const columns = useMemo<ColumnDef<OriginalProductTypes>[]>(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-[2px]"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 50,
        },
        {
            id: "image",
            header: "",
            cell: ({ row }) => {
                const product = row.original;
                const imageUrl = product.images?.[0];

                return (
                    <div className="w-12 h-12 relative rounded-md overflow-hidden bg-muted">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No Image
                            </div>
                        )}
                    </div>
                );
            },
            enableSorting: false,
            size: 60,
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                >
                    Product Name
                    {column.getIsSorted() === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <SortDesc className="ml-2 h-4 w-4" />
                    ) : null}
                </Button>
            ),
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="space-y-1 max-w-[300px]">
                        <div className="font-medium line-clamp-2">
                            {product.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                        </div>
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {product.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs h-5">
                                        {tag}
                                    </Badge>
                                ))}
                                {product.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs h-5">
                                        +{product.tags.length - 2}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
            minSize: 250,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const featured = row.original.featured;

                return (
                    <div className="space-y-1">
                        <Badge
                            variant={
                                status === "active"
                                    ? "default"
                                    : status === "draft"
                                        ? "secondary"
                                        : "outline"
                            }
                            className="capitalize"
                        >
                            {status}
                        </Badge>
                        {featured && (
                            <div>
                                <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Featured
                                </Badge>
                            </div>
                        )}
                        {row.original.isDropshippingEnabled && (
                            <div>
                                <Badge variant="outline" className="text-blue-600 border-blue-200">
                                    Dropshipping
                                </Badge>
                            </div>
                        )}
                    </div>
                );
            },
            filterFn: (row, id, value) => {
                if (value === "all") return true;
                return row.getValue(id) === value;
            },
            size: 120,
        },
        {
            accessorKey: "basePrice",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                >
                    Price
                    {column.getIsSorted() === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <SortDesc className="ml-2 h-4 w-4" />
                    ) : null}
                </Button>
            ),
            cell: ({ row }) => {
                const price = row.getValue("basePrice") as number;
                const currency = row.original.currency;
                return (
                    <div className="font-medium">
                        {formatPrice(price, currency)}
                    </div>
                );
            },
            size: 100,
        },
        {
            accessorKey: "categoryId",
            header: "Category",
            cell: ({ row }) => {
                const categoryId = row.getValue("categoryId") as string;
                return (
                    <Badge variant="outline" className="capitalize">
                        {categoryId || "Uncategorized"}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                if (value === "all") return true;
                return row.getValue(id) === value;
            },
            size: 120,
        },
        {
            accessorKey: "$createdAt",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                >
                    Created
                    {column.getIsSorted() === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <SortDesc className="ml-2 h-4 w-4" />
                    ) : null}
                </Button>
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue("$createdAt") as string);
                return (
                    <div className="text-sm">
                        {date.toLocaleDateString()}
                    </div>
                );
            },
            size: 100,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const product = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                            >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuItem
                                onClick={() => router.push(`/admin/stores/${currentStoreId}/products/${product.$id}`)}
                                className="cursor-pointer"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => router.push(`/admin/stores/${currentStoreId}/products/${product.$id}/edit`)}
                                className="cursor-pointer"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleToggleFeatured(product.$id)}
                                className="cursor-pointer"
                                disabled={toggleFeaturedMutation.isPending}
                            >
                                {product.featured ? (
                                    <>
                                        <StarOff className="mr-2 h-4 w-4" />
                                        Remove Featured
                                    </>
                                ) : (
                                    <>
                                        <Star className="mr-2 h-4 w-4" />
                                        Make Featured
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {product.status === 'active' ? (
                                <DropdownMenuItem
                                    onClick={() => handleSingleStatusUpdate(product.$id, "archived")}
                                    className="cursor-pointer"
                                    disabled={bulkUpdateStatusMutation.isPending}
                                >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => handleSingleStatusUpdate(product.$id, "active")}
                                    className="cursor-pointer"
                                    disabled={bulkUpdateStatusMutation.isPending}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Publish
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleDeleteSingle(product.$id)}
                                disabled={deleteProductsMutation.isPending}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
            enableSorting: false,
            enableHiding: false,
            size: 80,
        }
    ], [currentStoreId, toggleFeaturedMutation.isPending, bulkUpdateStatusMutation.isPending, deleteProductsMutation.isPending, router])

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
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter
        },
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedProductIds = selectedRows.map((row) => row.original.$id);

    const handleBulkDelete = useCallback(async () => {
        const confirmed = await confirmDelete();
        if (!confirmed) return;

        setErrorMessage(null);

        deleteProductsMutation.mutate(selectedProductIds, {
            onSuccess: (result) => {
                if ('error' in result) {
                    setErrorMessage(result.error || null);
                } else {
                    setRowSelection({});
                    onRefresh?.();
                }
            },
            onError: (error) => {
                setErrorMessage(error instanceof Error ? error.message : "Failed to delete products");
            }
        })
    }, [confirmDelete, selectedProductIds, deleteProductsMutation, onRefresh]);

    const handleDeleteSingle = useCallback(async (productId: string) => {
        const confirmed = await confirmDelete();
        if (!confirmed) return;

        setErrorMessage(null);

        deleteProductsMutation.mutate(productId, {
            onSuccess: (result) => {
                if ('error' in result) {
                    setErrorMessage(result.error || null);
                } else {
                    onRefresh?.();
                }
            },
            onError: (error) => {
                setErrorMessage(error instanceof Error ? error.message : "Failed to delete product");
            }
        })
    }, [confirmDelete, deleteProductsMutation, onRefresh]);

    const handleBulkStatusUpdate = useCallback(async (status: "active" | "draft" | "archived") => {
        const confirmed = await confirmStatusUpdate();
        if (!confirmed) return;

        setErrorMessage(null);

        bulkUpdateStatusMutation.mutate({ productIds: selectedProductIds, status }, {
            onSuccess: (result) => {
                if ('error' in result) {
                    setErrorMessage(result.error || null);
                } else {
                    setRowSelection({});
                    onRefresh?.();
                }
            },
            onError: (error) => {
                setErrorMessage(error instanceof Error ? error.message : "Failed to update product status");
            }
        });
    }, [confirmStatusUpdate, selectedProductIds, bulkUpdateStatusMutation, onRefresh]);

    const handleSingleStatusUpdate = useCallback(async (productId: string, status: "active" | "draft" | "archived") => {
        setErrorMessage(null);

        bulkUpdateStatusMutation.mutate({ productIds: [productId], status }, {
            onSuccess: (result) => {
                if ('error' in result) {
                    setErrorMessage(result.error || null);
                } else {
                    onRefresh?.();
                }
            },
            onError: (error) => {
                setErrorMessage(error instanceof Error ? error.message : "Failed to update product status");
            }
        })
    }, [bulkUpdateStatusMutation, onRefresh]);

    const handleToggleFeatured = useCallback(async (productId: string) => {
        setErrorMessage(null);

        toggleFeaturedMutation.mutate(productId, {
            onSuccess: (result) => {
                if ('error' in result) {
                    setErrorMessage(result.error || null);
                } else {
                    onRefresh?.();
                }
            },
            onError: (error) => {
                setErrorMessage(error instanceof Error ? error.message : "Failed to toggle featured status");
            }
        });
    }, [toggleFeaturedMutation, onRefresh]);

    const isAnyActionPending =
        deleteProductsMutation.isPending ||
        bulkUpdateStatusMutation.isPending ||
        toggleFeaturedMutation.isPending;

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <ConfirmDeleteDialog />
                <ConfirmStatusDialog />

                {errorMessage && <ErrorAlert errorMessage={errorMessage} />}

                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Search products..."
                                        value={globalFilter}
                                        onChange={(e) => setGlobalFilter(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Select
                                        value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
                                        onValueChange={(value) =>
                                            table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)
                                        }
                                    >
                                        <SelectTrigger className="w-[130px]">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={(table.getColumn("categoryId")?.getFilterValue() as string) ?? "all"}
                                        onValueChange={(value) =>
                                            table.getColumn("categoryId")?.setFilterValue(value === "all" ? undefined : value)
                                        }
                                    >
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>

                                        </SelectContent>
                                    </Select>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={onRefresh}
                                                disabled={isLoading}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Refresh</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {selectedRows.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">
                                                {selectedRows.length} selected
                                            </span>

                                            <div className="flex gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleBulkStatusUpdate("active")}
                                                    disabled={isAnyActionPending}
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1" />
                                                    Activate
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleBulkStatusUpdate("archived")}
                                                    disabled={isAnyActionPending}
                                                >
                                                    <Archive className="h-4 w-4 mr-1" />
                                                    Archive
                                                </Button>

                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={handleBulkDelete}
                                                    disabled={isAnyActionPending}
                                                >
                                                    {deleteProductsMutation.isPending ? (
                                                        <>
                                                            <SpinningLoader />
                                                            Deleting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {totalCount && (
                                        <span className="text-sm text-muted-foreground">
                                            {data.length} of {totalCount} products
                                        </span>
                                    )}

                                    <Button
                                        onClick={() => router.push(`/admin/stores/${currentStoreId}/products/new`)}
                                        disabled={isLoading}
                                    >
                                        Add Product
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="whitespace-nowrap"
                                            style={{ width: header.getSize() }}
                                        >
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
                            {isLoading ? (
                                Array.from({ length }).map((_, index) => (
                                    <TableRow key={index}>
                                        {columns.map((_, cellIndex) => (
                                            <TableCell key={cellIndex}>
                                                <div className="h-6 bg-muted animate-pulse rounded" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="hover:bg-muted/50"
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
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <div className="text-muted-foreground mb-2">
                                                No products found
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push(`/admin/stores/${currentStoreId}/products/new`)}
                                            >
                                                Create your first product
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value));
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">
                                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                {table.getFilteredRowModel().rows.length} row(s) selected
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
                            </p>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to first page</span>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to previous page</span>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to next page</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to last page</span>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}