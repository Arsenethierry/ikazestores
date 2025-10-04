'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/components/ui/multiselect";
import { useDeleteProductType } from "@/hooks/queries-and-mutations/use-catalog-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { Edit, Eye, EyeOff, Grid3X3, MoreHorizontal, Search, Trash2, Package, Settings, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import Link from 'next/link';
import { CatalogProductTypes } from "@/lib/types/appwrite/appwrite";
import EditProductTypeModal from "./components/edit-product-type-modal";

const ProductTypeCard = React.memo<{
    productType: any;
    onEdit: (productType: any) => void;
    onDelete: (productTypeId: string) => void;
}>(({
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
                            <CardDescription className="line-clamp-2">
                                {productType.description || 'No description'}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
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
                                <DropdownMenuItem asChild>
                                    <Link href={`/admin/sys-admin/catalog/product-types/${productType.$id}`}>
                                        <Settings className="h-4 w-4 mr-2" />
                                        Manage Variants
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
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

            <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Slug: {productType.slug}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/sys-admin/catalog/product-types/${productType.$id}`}>
                            <Settings className="h-4 w-4 mr-1" />
                            Configure
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
});

ProductTypeCard.displayName = 'ProductTypeCard';

export function ProductTypesGrid({ initialData }: { initialData: any }) {
    const [editingProductType, setEditingProductType] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const { execute: deleteProductType } = useDeleteProductType();
    const [ConfirmDialog, confirm] = useConfirm(
        "Delete Product Type",
        "Are you sure you want to delete this product type? This action cannot be undone.",
        "destructive"
    );

    const filteredProductTypes = useMemo(() => {
        if (!debouncedSearchTerm) return initialData.documents;

        return initialData.documents.filter((productType: CatalogProductTypes) =>
            productType.productTypeName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            productType.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }, [initialData.documents, debouncedSearchTerm]);

    const handleEdit = useCallback((productType: any) => {
        setEditingProductType(productType);
    }, []);

    const handleDelete = useCallback(async (productTypeId: string) => {
        const confirmed = await confirm();
        if (confirmed) {
            deleteProductType({ productTypeId });
        }
    }, [confirm, deleteProductType]);

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search product types..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Badge variant="outline" className="whitespace-nowrap">
                    {filteredProductTypes.length} {filteredProductTypes.length === 1 ? 'type' : 'types'}
                </Badge>
            </div>

            {filteredProductTypes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No product types found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm ? 'No product types match your search.' : 'Get started by creating your first product type.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProductTypes.map((productType: CatalogProductTypes) => (
                        <ProductTypeCard
                            key={productType.$id}
                            productType={productType}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
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
