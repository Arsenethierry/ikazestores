"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Package, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteProductType } from "@/features/categories/actions/product-types-actions";
import { CurrentUserType, ProductType } from "@/lib/types";
import { useConfirm } from "@/hooks/use-confirm";

interface ProductTypesClientProps {
    storeId?: string;
    initialProductTypes: ProductType[];
    currentUser: CurrentUserType
}

export default function ProductTypesClient({ storeId, initialProductTypes, currentUser }: ProductTypesClientProps) {
    const router = useRouter();
    const [productTypes, setProductTypes] = useState<ProductType[]>(initialProductTypes);
    const [searchTerm, setSearchTerm] = useState("");

    const [ConfirmDialog, confirm] = useConfirm(
        "Delete Product Type",
        "Are you sure you want to delete this product type? This action cannot be undone and will affect any associated variant templates.",
        "destructive"
    );

    const filteredProductTypes = productTypes.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const { execute: executeDelete, isPending: isDeleting } = useAction(deleteProductType, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: (error) => {
            console.error("Delete product type error:", error);
            toast.error("Failed to delete product type");
        }
    });

    const handleDeleteClick = async (productType: ProductType) => {
        const confirmed = await confirm();
        if (confirmed) {
            await executeDelete({ productTypeId: productType.$id });
            setProductTypes(prev => prev.filter(pt => pt.$id !== productType.$id));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };


    const getRoute = (path: string) => {
        return storeId ? `/admin/stores/${storeId}${path}` : `/admin${path}`;
    };

    const canModifyItem = useCallback((createdBy: string) => {
        return currentUser?.$id === createdBy;
    }, [currentUser?.$id]);

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Product Types</h1>
                        <p className="text-muted-foreground">
                            Manage product types and their associated variant templates
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push(getRoute("/product-types/new"))}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Product Type
                    </Button>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Input
                            placeholder="Search product types..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Product Types</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{productTypes.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Store Specific</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {productTypes.filter(pt => pt.storeId).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Global Templates</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {productTypes.filter(pt => !pt.storeId).length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {filteredProductTypes.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">
                            {searchTerm ? "No product types found" : "No product types yet"}
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                            {searchTerm
                                ? "Try adjusting your search criteria"
                                : "Get started by creating your first product type"
                            }
                        </p>
                        {!searchTerm && (
                            <Button
                                className="mt-4"
                                onClick={() => router.push(getRoute("/product-types/new"))}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Product Type
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProductTypes.map((productType) => (
                            <Card key={productType.$id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">{productType.name}</CardTitle>
                                            {productType.description && (
                                                <CardDescription className="line-clamp-2">
                                                    {productType.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        {canModifyItem(productType.createdBy) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(getRoute(`/product-types/edit/${productType.$id}`))}
                                                        disabled={isDeleting}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick(productType)}
                                                        className="text-destructive"
                                                        disabled={isDeleting}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Scope:</span>
                                            <Badge variant={productType.storeId ? "default" : "secondary"}>
                                                {productType.storeId ? "Store" : "Global"}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Created:</span>
                                            <span>{formatDate(productType.$createdAt)}</span>
                                        </div>

                                        {productType.$updatedAt !== productType.$createdAt && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Updated:</span>
                                                <span>{formatDate(productType.$updatedAt)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-2 mt-4">
                                        {canModifyItem(productType.createdBy) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(getRoute(`/product-types/${productType.$id}/edit`))}
                                                className="flex-1"
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(getRoute(`/product-types/${productType.$id}`))}
                                            className="flex-1"
                                        >
                                            View Variants
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog />
        </>
    );
}