'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    ChevronRight,
    Package,
    Target
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteProductType } from '@/hooks/queries-and-mutations/use-catalog-actions';
import { useConfirm } from '@/hooks/use-confirm';
import { getProductTypesBySubcategory } from '@/lib/actions/catalog-server-actions';
import { Skeleton } from '@/components/ui/skeleton';

const ProductTypeItem = React.memo<{
    productType: any;
    onEdit: (productType: any) => void;
    onDelete: (productTypeId: string) => void;
    onToggleVariants: (productTypeId: string) => void;
    expandedProductTypes: Set<string>;
}>(({
    productType,
    onEdit,
    onDelete,
    onToggleVariants,
    expandedProductTypes
}) => {
    const isExpanded = expandedProductTypes.has(productType.$id);

    return (
        <Card className="ml-8 border-l-4 border-l-green-200 transition-all hover:shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-green-100 rounded-md">
                            <Package className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <CardTitle className="text-sm">{productType.productTypeName}</CardTitle>
                            <CardDescription className="text-xs line-clamp-1">
                                {productType.description || 'No description'}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge
                            variant={productType.isActive ? "default" : "secondary"}
                            className="text-xs"
                        >
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

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleVariants(productType.$id)}
                            className="h-6 w-6 p-0"
                        >
                            <ChevronRight
                                className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(productType)}>
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit Product Type
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onToggleVariants(productType.$id)}>
                                    <Target className="h-3 w-3 mr-2" />
                                    {isExpanded ? 'Hide' : 'Show'} Variants
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(productType.$id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete Product Type
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                        <p>Variant management coming soon...</p>
                        <p className="mt-1">ID: {productType.$id}</p>
                    </div>
                </CardContent>
            )}
        </Card>
    )
})

ProductTypeItem.displayName = 'ProductTypeItem';

interface ProductTypesListProps {
    subcategoryId: string;
}

export default function ProductTypesList({ subcategoryId }: ProductTypesListProps) {
    const [expandedProductTypes, setExpandedProductTypes] = useState<Set<string>>(new Set());
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

    const handleToggleVariants = useCallback((productTypeId: string) => {
        setExpandedProductTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productTypeId)) {
                newSet.delete(productTypeId);
            } else {
                newSet.add(productTypeId);
            }
            return newSet;
        });
    }, []);

    const handleEdit = useCallback((productType: any) => {
        setEditingProductType(productType);
    }, []);

    const handleDelete = useCallback(async (productTypeId: string) => {
        const confirmed = await confirm();
        if (confirmed) {
            deleteProductType({ productTypeId });
            // Remove from local state on successful deletion
            setProductTypes(prev => prev.filter(pt => pt.$id !== productTypeId));
        }
    }, [confirm, deleteProductType]);

    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i} className="ml-8 border-l-4 border-l-green-200">
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
                                    <Skeleton className="h-4 w-10 rounded-full" />
                                    <Skeleton className="h-6 w-6" />
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
            <div className="ml-8 p-3 text-xs text-destructive border border-destructive/20 rounded-md">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between ml-8">
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
                <div className="ml-8 p-3 text-center border border-dashed rounded-md">
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
                            onToggleVariants={handleToggleVariants}
                            expandedProductTypes={expandedProductTypes}
                        />
                    ))}
                </div>
            )}

            <ConfirmDialog />
        </div>
    )
}