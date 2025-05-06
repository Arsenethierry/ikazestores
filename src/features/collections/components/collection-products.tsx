"use client";

import { GroupProductSelector } from "@/features/collections/components/group-select-products-list";
import { getAllVirtualProducts, getVirtualStoreProducts } from "@/features/products/actions/virtual-products-actions";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addProductsToCollection, getCollectionProducts } from "@/features/collections/actions/collections-actions";
import { toast } from "sonner";
import { Info, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CollectionProductsPagination } from "./collection-products-pagination";
import { usePathname } from "next/navigation";
import { ClientVirtualProductCard } from "@/features/products/components/product-cards/client-virtual-product-card";

interface PageProps {
    virtualStoreId: string | null;
    collectionId: string;
    currentGroupId?: string;
    alreadySelectedProducts?: string[];
    collectionType: 'simple' | 'grouped';
    collectionName: string;
}

export const CollectionProducts = ({ virtualStoreId, collectionId, currentGroupId, alreadySelectedProducts, collectionType, collectionName }: PageProps) => {

    const [search, setSearch] = useQueryState("search");
    const [page, setPage] = useQueryState("page", { defaultValue: "1" });
    const [pageSize, setPageSize] = useQueryState("pageSize", { defaultValue: "8" });
    const [searchInput, setSearchInput] = useState(search || "");
    const [selectedProductsIds, setSelectedProductsIds] = useState<string[]>([]);
    const [existingProductIds, setExistingProductIds] = useState<string[]>([]);
    const [removedProductIds, setRemovedProductIds] = useState<string[]>([]);
    const [addedProductIds, setAddedProductIds] = useState<string[]>([]);

    const path = usePathname();
    const isAdminPortal = path.includes('/admin');

    const { data: allProductsData, isLoading: isAllProductsLoading } = useQuery({
        queryKey: ["virtualStoreProducts", virtualStoreId ?? "all", Number(page), Number(pageSize), search ?? ""],
        queryFn: async () => {
            if (virtualStoreId) {
                const result = await getVirtualStoreProducts({
                    virtualStoreId,
                    limit: Number(pageSize),
                    page: Number(page),
                    search: search || undefined
                });
                return result
            } else {
                const results = await getAllVirtualProducts({
                    limit: Number(pageSize),
                    page: Number(page),
                    search: search || undefined
                });
                return results
            }
        },
        enabled: isAdminPortal && virtualStoreId !== undefined || true,
        staleTime: 1000 * 60 * 5
    });

    const { data: collectionProductsData, isLoading: isCollectionProductsLoading } = useQuery({
        queryKey: ["collectionProducts", collectionId, currentGroupId, Number(page), Number(pageSize), search ?? ""],
        queryFn: async () => {
            const result = await getCollectionProducts({
                collectionId,
                groupId: currentGroupId || null,
                page: Number(page),
                limit: Number(pageSize)
            });
            return result;
        },
        enabled: !isAdminPortal,
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

    const cardTitle = isAdminPortal
        ? (collectionType === 'grouped' ? 'Manage Products in Collection Group' : `Manage Products in Collection: ${collectionName}`)
        : `Products in Collection: ${collectionName}`;
        
    const isLoading = isAdminPortal ? isAllProductsLoading : isCollectionProductsLoading;
    const productsData = isAdminPortal ? allProductsData : collectionProductsData;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">
                    {cardTitle}
                </CardTitle>
                {isAdminPortal && (
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
                                {existingProductIds.length} existing products in this {collectionType === 'grouped' ? 'group' : 'collection'}
                            </div>
                        ) : null}
                    </div>
                )}

                {isAdminPortal && existingProductIds.length > 0 && (
                    <Alert className="mt-4 bg-secondary/50">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Products already in this {collectionType === 'grouped' ? 'group' : 'collection'} appear selected. Deselect them to remove from the {collectionType === 'grouped' ? 'group' : 'collection'}.
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
                        {isAdminPortal ? (
                            <GroupProductSelector
                                products={productsData.documents}
                                onSelectionChange={handleSelectionChange}
                                initialSelectedIds={selectedProductsIds}
                                existingProductIds={existingProductIds}
                            />
                        ) : (
                            productsData.documents.map((product) => (
                                <ClientVirtualProductCard
                                    product={product}
                                    key={product.$id}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No products found</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {productsData && (
                    <CollectionProductsPagination
                        totalPages={productsData.totalPages || 1}
                        currentPage={Number(page) || 1}
                    />
                )}

                {isAdminPortal && (
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
                )}
            </CardFooter>
        </Card>
    )
}