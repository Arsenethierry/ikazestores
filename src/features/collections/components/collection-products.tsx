"use client";

import { GroupProductSelector } from "@/features/collections/components/group-select-products-list";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { Info, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CollectionProductsPagination } from "./collection-products-pagination";
import { usePathname } from "next/navigation";
import { ClientVirtualProductCard } from "@/features/products/components/product-cards/client-virtual-product-card";
import {
    useGetCollectionProducts,
    useAddProductsToCollection,
    useRemoveProductFromCollection
} from "@/hooks/queries-and-mutations/use-products-collections";
import { VirtualProductTypes } from "@/lib/types";
import { useVirtualStoreProductsSearch } from "@/hooks/queries-and-mutations/use-affliate-products";

interface PageProps {
    virtualStoreId: string | null;
    collectionId: string;
    currentGroupId?: string;
    alreadySelectedProducts?: string[];
    collectionType: 'simple' | 'grouped';
    collectionName: string;
}

export const CollectionProducts = ({
    virtualStoreId,
    collectionId,
    currentGroupId,
    alreadySelectedProducts,
    collectionType,
    collectionName
}: PageProps) => {

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

    // React Query hooks
    const addProductsMutation = useAddProductsToCollection();
    const removeProductMutation = useRemoveProductFromCollection();

    const { data: allProductsData, isLoading: isAllProductsLoading } = useVirtualStoreProductsSearch(
        virtualStoreId || '',
        search || '',
        {
            limit: Number(pageSize),
            page: Number(page),
        }
    );

    const { data: storeProductsData, isLoading: isStoreProductsLoading } = useVirtualStoreProductsSearch(
        virtualStoreId || '',
        search || '',
        {
            limit: Number(pageSize),
            page: Number(page),
        }
    );

    const { data: collectionProductsData, isLoading: isCollectionProductsLoading } = useGetCollectionProducts(
        collectionId,
        currentGroupId || null,
        Number(page),
        Number(pageSize)
    );

    useEffect(() => {
        if (alreadySelectedProducts) {
            setExistingProductIds(alreadySelectedProducts);
            setSelectedProductsIds(alreadySelectedProducts);
        }
    }, [alreadySelectedProducts]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput || null);
        setPage("1");
        setPageSize(pageSize);
    };

    const handleSelectionChange = (selectedIds: string[]) => {
        setSelectedProductsIds(selectedIds);

        const added = selectedIds.filter(id => !existingProductIds.includes(id));
        const removed = existingProductIds.filter(id => !selectedIds.includes(id));

        setAddedProductIds(added);
        setRemovedProductIds(removed);
    };

    const handleSaveProducts = async () => {
        if (selectedProductsIds.length === 0 && existingProductIds.length === 0) {
            toast.error("Please select at least one product to add to the collection");
            return;
        }

        if (addedProductIds.length === 0 && removedProductIds.length === 0) {
            toast.error('No changes. No products were added or removed');
            return;
        }

        try {
            // Handle removals first
            if (removedProductIds.length > 0) {
                for (const productId of removedProductIds) {
                    await new Promise((resolve, reject) => {
                        removeProductMutation.mutate(
                            {
                                collectionId,
                                productId,
                                groupId: collectionType === 'grouped' ? currentGroupId : undefined
                            },
                            {
                                onSuccess: resolve,
                                onError: reject
                            }
                        );
                    });
                }
            }

            // Handle additions
            if (addedProductIds.length > 0) {
                await new Promise((resolve, reject) => {
                    addProductsMutation.mutate(
                        {
                            collectionId,
                            productsIds: addedProductIds,
                            groupId: collectionType === 'grouped' ? currentGroupId : undefined
                        },
                        {
                            onSuccess: (data) => {
                                // Update local state after successful addition
                                setExistingProductIds(selectedProductsIds);
                                setAddedProductIds([]);
                                setRemovedProductIds([]);
                                resolve(data);
                            },
                            onError: reject
                        }
                    );
                });
            } else if (removedProductIds.length > 0) {
                // If only removals, update state
                setExistingProductIds(selectedProductsIds);
                setAddedProductIds([]);
                setRemovedProductIds([]);
            }

            toast.success("Collection updated successfully");
        } catch (error) {
            console.error("Error updating collection:", error);
            toast.error("Failed to update collection");
        }
    };

    const cardTitle = isAdminPortal
        ? (collectionType === 'grouped' ? 'Manage Products in Collection Group' : `Manage Products in Collection: ${collectionName}`)
        : `Products in Collection: ${collectionName}`;

    let isLoading: boolean;
    let productsData: VirtualProductTypes[] | undefined;
    let totalPages = 1;

    if (isAdminPortal) {
        if (virtualStoreId) {
            isLoading = isStoreProductsLoading;
            productsData = storeProductsData?.documents;
            // Assuming storeProductsData has pagination info
            totalPages = Math.ceil((storeProductsData?.documents?.length || 0) / Number(pageSize));
        } else {
            isLoading = isAllProductsLoading;
            productsData = allProductsData?.documents;
            totalPages = Math.ceil((allProductsData?.total || 0) / Number(pageSize));
        }
    } else {
        isLoading = isCollectionProductsLoading;
        productsData = collectionProductsData?.documents;
        totalPages = Math.ceil((collectionProductsData?.total || 0) / Number(pageSize));
    }

    const isSaving = addProductsMutation.isPending || removeProductMutation.isPending;

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
                                    disabled={isSaving}
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
                ) : productsData && productsData.length > 0 ? (
                    <div className="grid gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {isAdminPortal ? (
                            <GroupProductSelector
                                products={productsData}
                                onSelectionChange={handleSelectionChange}
                                initialSelectedIds={selectedProductsIds}
                                existingProductIds={existingProductIds}
                            />
                        ) : (
                            productsData.map((product) => (
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
                        totalPages={totalPages}
                        currentPage={Number(page) || 1}
                    />
                )}

                {isAdminPortal && (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end text-sm text-muted-foreground">
                            <span>{selectedProductsIds.length} products selected</span>
                            {addedProductIds.length > 0 && (
                                <span className="text-green-600">+{addedProductIds.length} to add</span>
                            )}
                            {removedProductIds.length > 0 && (
                                <span className="text-red-600">-{removedProductIds.length} to remove</span>
                            )}
                        </div>
                        <Button
                            onClick={handleSaveProducts}
                            disabled={
                                (selectedProductsIds.length === 0 && existingProductIds.length === 0) ||
                                (addedProductIds.length === 0 && removedProductIds.length === 0) ||
                                isSaving
                            }
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};