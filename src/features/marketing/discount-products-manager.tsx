
"use client";

import React, { useState, useEffect } from 'react';
import { Search, X, Package, Plus, Loader2, AlertCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import Image from 'next/image';
import { cn } from '@/lib/utils';

import {
    assignProductsToDiscountAction,
    removeProductsFromDiscountAction,
    getDiscountProductsAction,
    getStoreProductsForDiscountAction
} from '@/lib/actions/discount-actions';
import { Products } from '@/lib/types/appwrite-types';

interface DiscountProductsManagerProps {
    discountId: string;
    storeId: string;
    applicableTo: string;
    onUpdate?: () => void;
}

export function DiscountProductsManager({
    discountId,
    storeId,
    applicableTo,
    onUpdate
}: DiscountProductsManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [allProducts, setAllProducts] = useState<Products[]>([]);
    const [assignedProductIds, setAssignedProductIds] = useState<Set<string>>(new Set());
    const [originalAssignedIds, setOriginalAssignedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounce(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch assigned products
    const { execute: fetchAssigned, status: fetchAssignedStatus } = useAction(
        getDiscountProductsAction,
        {
            onSuccess: ({ data }) => {
                if (data?.data?.products) {
                    const ids = new Set(data.data.products.map((p: Products) => p.$id));
                    setAssignedProductIds(ids);
                    setOriginalAssignedIds(ids);
                }
            },
            onError: ({ error }) => {
                console.error('Failed to fetch assigned products:', error);
                toast.error('Failed to load assigned products');
            }
        }
    );

    // Fetch store products
    const { execute: fetchProducts, status: fetchProductsStatus } = useAction(
        getStoreProductsForDiscountAction,
        {
            onSuccess: ({ data }) => {
                if (data) {
                    setAllProducts(data.data?.products || []);
                    setTotalPages(data.data?.totalPages || 1);
                }
            },
            onError: ({ error }) => {
                console.error('Failed to fetch products:', error);
                toast.error('Failed to load products');
            }
        }
    );

    // Initial fetch
    useEffect(() => {
        if (applicableTo === 'products' && discountId && storeId) {
            fetchAssigned({ discountId, storeId });
        }
    }, [discountId, storeId, applicableTo]);

    // Fetch products when search or page changes
    useEffect(() => {
        if (storeId) {
            fetchProducts({
                storeId,
                search: searchDebounce || undefined,
                page: currentPage,
                limit: 50,
            });
        }
    }, [storeId, searchDebounce, currentPage]);

    // Assign products action
    const { execute: assignProducts, status: assignStatus } = useAction(
        assignProductsToDiscountAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.message || 'Products assigned successfully');
                // Refresh assigned products list
                fetchAssigned({ discountId, storeId });
                onUpdate?.();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || 'Failed to assign products');
            }
        }
    );

    // Remove products action
    const { execute: removeProducts, status: removeStatus } = useAction(
        removeProductsFromDiscountAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.message || 'Products removed successfully');
                // Refresh assigned products list
                fetchAssigned({ discountId, storeId });
                onUpdate?.();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || 'Failed to remove products');
            }
        }
    );

    const handleToggleProduct = (productId: string) => {
        setAssignedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleSaveChanges = async () => {
        const currentIds = Array.from(assignedProductIds);
        const originalIds = Array.from(originalAssignedIds);

        // Find products to add and remove
        const toAdd = currentIds.filter(id => !originalIds.includes(id));
        const toRemove = originalIds.filter(id => !currentIds.includes(id));

        if (toAdd.length === 0 && toRemove.length === 0) {
            toast.info('No changes to save');
            return;
        }

        // Execute add operations
        if (toAdd.length > 0) {
            await assignProducts({
                discountId,
                productIds: toAdd,
                storeId
            });
        }

        // Execute remove operations
        if (toRemove.length > 0) {
            await removeProducts({
                discountId,
                productIds: toRemove,
                storeId
            });
        }
    };

    const handleCancel = () => {
        setAssignedProductIds(new Set(originalAssignedIds));
        setSearchTerm('');
    };

    const hasChanges =
        assignedProductIds.size !== originalAssignedIds.size ||
        Array.from(assignedProductIds).some(id => !originalAssignedIds.has(id));

    const isSaving = assignStatus === 'executing' || removeStatus === 'executing';
    const isLoadingProducts = fetchProductsStatus === 'executing';
    const isLoadingAssigned = fetchAssignedStatus === 'executing';

    const assignedProducts = allProducts.filter(p => assignedProductIds.has(p.$id));

    if (applicableTo !== 'products') {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    This discount applies to <strong>{applicableTo}</strong>.
                    Change "Applicable To" to "Products" to manage individual products.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Manage Products</h3>
                    <p className="text-sm text-muted-foreground">
                        Select which products this discount should apply to
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                        {assignedProductIds.size} selected
                    </Badge>
                    {hasChanges && (
                        <Badge variant="default" className="animate-pulse">
                            Unsaved changes
                        </Badge>
                    )}
                </div>
            </div>

            {/* Currently Assigned Products */}
            {isLoadingAssigned ? (
                <Card>
                    <CardContent className="py-8">
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            ) : assignedProducts.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Assigned Products</CardTitle>
                        <CardDescription>
                            Products currently receiving this discount
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-2 pr-4">
                                {assignedProducts.map(product => (
                                    <div
                                        key={product.$id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {product.images?.[0] ? (
                                                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    SKU: {product.sku} • {product.currency || 'RWF'} {product.basePrice.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleProduct(product.$id)}
                                            disabled={isSaving}
                                            className="flex-shrink-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            ) : null}

            {/* Product Search & Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Add Products</CardTitle>
                    <CardDescription>
                        Search and select products to add to this discount
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                            disabled={isLoadingProducts}
                        />
                        {isLoadingProducts && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {/* Product List */}
                    <ScrollArea className="h-[400px] rounded-md border">
                        <div className="p-4 space-y-2">
                            {isLoadingProducts ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : allProducts.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {searchTerm ? 'No products found' : 'No products available'}
                                    </p>
                                </div>
                            ) : (
                                allProducts.map(product => {
                                    const isSelected = assignedProductIds.has(product.$id);
                                    const wasOriginallySelected = originalAssignedIds.has(product.$id);
                                    const isPending = isSelected !== wasOriginallySelected;

                                    return (
                                        <div
                                            key={product.$id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                                isSelected
                                                    ? 'bg-primary/5 border-primary'
                                                    : 'hover:bg-muted/50',
                                                isPending && 'ring-2 ring-primary'
                                            )}
                                            onClick={() => handleToggleProduct(product.$id)}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleProduct(product.$id)}
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={isSaving}
                                            />

                                            {product.images?.[0] ? (
                                                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    SKU: {product.sku} • {product.currency || 'RWF'} {product.basePrice.toLocaleString()}
                                                </p>
                                            </div>

                                            {isSelected && !isPending && (
                                                <Badge variant="default" className="text-xs shrink-0">
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Selected
                                                </Badge>
                                            )}

                                            {isPending && (
                                                <Badge variant="outline" className="text-xs shrink-0 animate-pulse">
                                                    {isSelected ? 'Adding' : 'Removing'}
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoadingProducts}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isLoadingProducts}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Info Alert */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            <strong>Tip:</strong> Use the search to quickly find products.
                            Changes will be saved when you click "Save Changes".
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving || !hasChanges}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving || !hasChanges}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes ({hasChanges ? 'Unsaved' : 'No changes'})
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}