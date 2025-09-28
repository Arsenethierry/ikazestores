'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/components/ui/multiselect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteProductType } from "@/hooks/queries-and-mutations/use-catalog-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { getProductTypesBySubcategory } from "@/lib/actions/catalog-server-actions";
import { CatalogProductTypes } from "@/lib/types/appwrite/appwrite";
import { Edit, Eye, EyeOff, Grid3X3, MoreHorizontal, Search, Trash2, Package, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import EditProductTypeModal from "./components/edit-product-type-modal";
import CreateProductTypeModal from "./components/create-product-type-modal";

interface ProductTypeItemProps {
    productType: CatalogProductTypes;
    onEdit: (productType: any) => void;
    onDelete: (productTypeId: string) => void;
}

const ProductTypeItem = React.memo<ProductTypeItemProps>(({
    productType,
    onEdit,
    onDelete
}) => {
    return (
        <Card className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{productType.productTypeName}</CardTitle>
                            <CardDescription className="line-clamp-1">
                                {productType.description || 'No description'}
                            </CardDescription>
                            <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {productType.categoryName || 'Unknown Category'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {productType.subcategoryName || 'Unknown Subcategory'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge variant={productType.isActive ? "default" : "secondary"}>
                            {productType.isActive ? (
                                <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Active
                                </>
                            ) : (
                                <>
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Inactive
                                </>
                            )}
                        </Badge>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(productType)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Product Type
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(productType.$id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Product Type
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
})

ProductTypeItem.displayName = 'ProductTypeItem';

interface ProductTypesListProps {
    subcategoryId: string;
    categoryId?: string;
}

export default function ProductTypesListContainer({ subcategoryId, categoryId }: ProductTypesListProps) {
    const [editingProductType, setEditingProductType] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [productTypes, setProductTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { execute: deleteProductType } = useDeleteProductType();
    const [ConfirmDialog, confirm] = useConfirm(
        "Delete Product Type",
        "Are you sure you want to delete this product type? This action cannot be undone.",
        "destructive"
    );

    useEffect(() => {
        const loadProductTypes = async () => {
            try {
                setLoading(true);
                const result = await getProductTypesBySubcategory({ subcategoryId });
                if (result.success && result.data) {
                    setProductTypes(result.data.documents || []);
                } else {
                    setError(result.error || 'Failed to load product types');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load product types');
            } finally {
                setLoading(false);
            }
        };

        loadProductTypes();
    }, [subcategoryId]);

    const handleEdit = useCallback((productType: any) => {
        setEditingProductType(productType);
    }, []);

    const handleDelete = useCallback(async (productTypeId: string) => {
        const confirmed = await confirm();
        if (confirmed) {
            deleteProductType({ productTypeId });
            setProductTypes(prev => prev.filter(pt => pt.$id !== productTypeId));
        }
    }, [confirm, deleteProductType]);

    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i} className="ml-6 border-l-4 border-l-green-200">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Skeleton className="w-6 h-6 rounded-md" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-2 w-28" />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Skeleton className="h-4 w-12 rounded-full" />
                                    <Skeleton className="h-6 w-6" />
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="ml-6 p-3 text-sm text-destructive border border-destructive/20 rounded-md">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between ml-6">
                <p className="text-xs text-muted-foreground">
                    {productTypes.length} {productTypes.length === 1 ? 'product type' : 'product types'}
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreateModal(true)}
                    className="h-6 text-xs"
                >
                    <Plus className="h-2 w-2 mr-1" />
                    Add Product Type
                </Button>
            </div>

            {productTypes.length === 0 ? (
                <div className="ml-6 p-3 text-center border border-dashed rounded-md">
                    <p className="text-xs text-muted-foreground mb-2">No product types yet</p>
                    <Button size="sm" onClick={() => setShowCreateModal(true)} className="h-6 text-xs">
                        <Plus className="h-2 w-2 mr-1" />
                        Create First Product Type
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {productTypes.map((productType) => (
                        <ProductTypeItem
                            key={productType.$id}
                            productType={productType}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {showCreateModal && (
                <Suspense fallback={null}>
                    <CreateProductTypeModal
                        subcategoryId={subcategoryId}
                        categoryId={categoryId}
                        open={showCreateModal}
                        onOpenChange={setShowCreateModal}
                    />
                </Suspense>
            )}

            {editingProductType && (
                <Suspense fallback={null}>
                    <EditProductTypeModal
                        productType={editingProductType}
                        open={!!editingProductType}
                        onOpenChange={(open) => !open && setEditingProductType(null)}
                    />
                </Suspense>
            )}

            <ConfirmDialog />
        </div>
    )
}

export function ProductTypesListSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                                    <div className="h-3 bg-muted rounded w-48 animate-pulse" />
                                    <div className="flex space-x-2">
                                        <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                                        <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
                                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}
