"use client";

import { GroupProductSelector } from "@/features/collections/components/group-select-products-list";
import { getVirtualStoreProducts } from "@/features/products/actions/virtual-products-actions";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addProductsToCollection } from "@/features/collections/actions/collections-actions";
import { toast } from "sonner";
import { Info, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaginationComponent } from "@/components/pagination-component";
interface PageProps {
    virtualStoreId: string;
    collectionId: string;
    currentGroupId?: string;
    alreadySelectedProducts?: string[];
    collectionType: 'simple' | 'grouped';
}

export const GroupProductsComponents = ({ virtualStoreId, collectionId, currentGroupId, alreadySelectedProducts, collectionType }: PageProps) => {

    const [search, setSearch] = useQueryState("search");
    const [page, setPage] = useQueryState("page", { defaultValue: "1" });
    const [pageSize, setPageSize] = useQueryState("pageSize", { defaultValue: "8" });
    const [searchInput, setSearchInput] = useState(search || "");
    const [selectedProductsIds, setSelectedProductsIds] = useState<string[]>([]);
    const [existingProductIds, setExistingProductIds] = useState<string[]>([]);
    const [removedProductIds, setRemovedProductIds] = useState<string[]>([]);
    const [addedProductIds, setAddedProductIds] = useState<string[]>([]);

    const { data: productsData, isLoading } = useQuery({
        queryKey: ["virtualStoreProducts", virtualStoreId, page, pageSize, search],
        queryFn: async () => {
            const result = await getVirtualStoreProducts({
                virtualStoreId,
                limit: Number(pageSize),
                page: Number(page),
                search: search || undefined
            });
            return result
        },
        staleTime: 1000 * 60 * 5
    });

    useEffect(() => {
        if (alreadySelectedProducts) {
            setExistingProductIds(alreadySelectedProducts);
            setSelectedProductsIds(alreadySelectedProducts);
        }
    }, [alreadySelectedProducts]);

    const mutation = useMutation({
        mutationFn: async () => {
            const result = await addProductsToCollection({
                collectionId,
                productsIds: selectedProductsIds,
                groupId: collectionType === 'grouped' ? currentGroupId : null
            });

            return result;
        },
        onSuccess(data) {
            if (data?.data?.success) {
                toast.success(data.data.success)
                setExistingProductIds([...selectedProductsIds]);
                setSelectedProductsIds([])
                setRemovedProductIds([]);
            } else if (data?.data?.error) {
                toast.error(data.data.error);
            }
        },
        onError: (error) => {
            toast.error(error?.message)
        }
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput || null);
        setPage("1")
        setPageSize(pageSize)
    };

    const handleSelectionChange = (selectedIds: string[]) => {
        setSelectedProductsIds(selectedIds);

        const added = selectedIds.filter(id => !existingProductIds.includes(id));
        const removed = existingProductIds.filter(id => !selectedIds.includes(id));

        setAddedProductIds(added);
        setRemovedProductIds(removed)
    };

    const handleSaveProducts = () => {
        if (selectedProductsIds.length === 0) {
            toast.error("Please select at least one product to add to the collection");
            return;
        }
        if (addedProductIds.length === 0 && removedProductIds.length === 0) {
            toast.error('No changes. No products were added or removed');
            return;
        }
        
        mutation.mutate()
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">
                    {collectionType === 'grouped'
                        ? 'Manage Products in Collection Group'
                        : 'Manage Products in Collection'}
                </CardTitle>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between w-full">
                    <div className="w-full max-w-sm">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="pl-8"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </form>
                    </div>

                    {existingProductIds.length > 0 ? (
                        <div className="text-sm text-muted-foreground">
                            {existingProductIds.length} existing products in this group
                        </div>
                    ) : null}
                </div>

                {existingProductIds.length > 0 && (
                    <Alert className="mt-4 bg-secondary/50">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Products already in this group appear selected. Deselect them to remove from the group.
                        </AlertDescription>
                    </Alert>
                )}
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : productsData && productsData.documents.length > 0 ? (
                    <div className="grid gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        <GroupProductSelector
                            products={productsData.documents}
                            onSelectionChange={handleSelectionChange}
                            initialSelectedIds={selectedProductsIds}
                            existingProductIds={existingProductIds}
                        />
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No products found</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {productsData && (
                    <PaginationComponent
                        totalPages={productsData.totalPages || 1}
                        currentPage={Number(page) || 1}
                    />
                )}

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {selectedProductsIds.length} products selected
                    </span>
                    <Button
                        onClick={handleSaveProducts}
                        disabled={selectedProductsIds.length === 0 || mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Add to Collection"
                        )}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}