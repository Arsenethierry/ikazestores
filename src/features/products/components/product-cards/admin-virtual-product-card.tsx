"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateAffiliateImport, useRemoveProductFromVirtualStore } from "@/hooks/queries-and-mutations/use-affliate-products";
import { VirtualProductTypes } from "@/lib/types";
import {
    Settings,
    MoreVertical,
    Eye,
    EyeOff,
    Trash2,
    ExternalLink,
    TrendingUp,
    Package,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    BarChart3,
    MapPin
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getCurrencySymbol } from "../../currency/currency-utils";

interface AdminVirtualProductCardProps {
    product: VirtualProductTypes;
    storeId: string;
}

export const AdminVirtualProductCard = ({
    product,
    storeId
}: AdminVirtualProductCardProps) => {
    const [showCommissionDialog, setShowCommissionDialog] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [newCommission, setNewCommission] = useState(product.commission || 0);
    const [isPending, startTransition] = useTransition();

    const router = useRouter();

    const updateImportMutation = useUpdateAffiliateImport();
    const removeProductMutation = useRemoveProductFromVirtualStore();

    const finalPrice = (product.basePrice || 0) + (product.commission || 0);
    const profitMargin = finalPrice > 0 ? ((product.commission || 0) / finalPrice * 100).toFixed(0) : "0";

    const handleCommissionUpdate = async () => {
        if (newCommission === product.commission || newCommission === 0) {
            setShowCommissionDialog(false);
            return;
        }

        if (newCommission < 0) {
            toast.error("Commission cannot be negative");
            return;
        }

        startTransition(async () => {
            try {
                const result = await updateImportMutation.mutateAsync({
                    importId: product.$id,
                    data: { commission: newCommission }
                });

                if (result && typeof result === 'object' && 'error' in result) {
                    toast.error(result.error);
                    return;
                }

                setShowCommissionDialog(false);
                setShowDropdown(false);
                toast.success("Commission updated successfully");

            } catch (error) {
                console.error("Commission update error:", error);
                toast.error(error instanceof Error ? error.message : "Failed to update commission");
            }
        });
    };

    const handleToggleStatus = async () => {
        startTransition(async () => {
            try {
                const result = await updateImportMutation.mutateAsync({
                    importId: product.$id,
                    data: { isActive: !product.isActive }
                });

                // Handle the response format properly
                if (result && typeof result === 'object' && 'error' in result) {
                    toast.error(result.error);
                    return;
                }

                // Success case
                setShowDropdown(false);
                toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'} successfully`);

            } catch (error) {
                console.error("Status toggle error:", error);
                toast.error(error instanceof Error ? error.message : "Failed to update product status");
            }
        });
    };

    const handleRemoveProduct = async () => {
        const confirmed = window.confirm(
            `Are you sure you want to remove "${product.name}" from your virtual store? This action cannot be undone.`
        );

        if (!confirmed) return;

        startTransition(async () => {
            try {
                const result = await removeProductMutation.mutateAsync(product.$id);

                // Handle the response format properly
                if (result && typeof result === 'object' && 'error' in result) {
                    toast.error(result.error);
                    return;
                }

                // Success case
                setShowDropdown(false);
                toast.success("Product removed successfully");
                router.refresh();

            } catch (error) {
                console.error("Product removal error:", error);
                toast.error(error instanceof Error ? error.message : "Failed to remove product");
            }
        });
    };

    // Click outside handler for dropdown
    const handleClickOutside = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setShowDropdown(false);
        }
    };

    // Check if any mutation is currently loading
    const isLoading = isPending || updateImportMutation.isPending || removeProductMutation.isPending;

    return (
        <>
            <Card className="relative bg-white border p-0 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <CardContent className="p-0 relative">
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg border border-gray-200 mb-4 group">
                        {product.images && product.images.length > 0 ? (
                            <div className="relative w-full h-full">
                                {product.images.length === 1 ? (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <div className="carousel-container w-full h-full overflow-hidden">
                                            <div className="carousel-content flex h-full transition-transform duration-300">
                                                {product.images.map((imageUrl: string, index: number) => (
                                                    <div key={index} className="relative flex-shrink-0 w-full h-full">
                                                        <Image
                                                            src={imageUrl}
                                                            alt={`${product.name} - Image ${index + 1}`}
                                                            fill
                                                            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Carousel Navigation */}
                                        <button
                                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-90 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const container = e.currentTarget.parentElement?.querySelector('.carousel-content') as HTMLElement;
                                                if (container) {
                                                    const scrollAmount = container.offsetWidth;
                                                    container.scrollLeft -= scrollAmount;
                                                }
                                            }}
                                        >
                                            <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="15,18 9,12 15,6"></polyline>
                                            </svg>
                                        </button>

                                        <button
                                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-90 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const container = e.currentTarget.parentElement?.querySelector('.carousel-content') as HTMLElement;
                                                if (container) {
                                                    const scrollAmount = container.offsetWidth;
                                                    container.scrollLeft += scrollAmount;
                                                }
                                            }}
                                        >
                                            <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="9,18 15,12 9,6"></polyline>
                                            </svg>
                                        </button>

                                        {/* Image indicators */}
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                            {product.images.map((_, index) => (
                                                <div
                                                    key={index}
                                                    className="w-2 h-2 rounded-full bg-white/60 transition-colors"
                                                />
                                            ))}
                                        </div>

                                        {/* Image count badge */}
                                        <div className="flex justify-between w-full absolute top-2 right-2">
                                            <div className={`flex items-center gap-1 px-1 py-1 ml-3 rounded-full text-xs font-medium ${isLoading ? "bg-yellow-50 text-yellow-700" :
                                                product.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                                                }`}>
                                                {isLoading ? (
                                                    <Clock className="h-3 w-3 animate-spin" />
                                                ) : product.isActive ? (
                                                    <CheckCircle className="h-3 w-3" />
                                                ) : (
                                                    <AlertTriangle className="h-3 w-3" />
                                                )}
                                                <span>{isLoading ? "Updating" : product.isActive ? "Active" : "Inactive"}</span>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={isLoading}
                                                        className="h-8 w-8 p-0 bg-white"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end" className="w-52">
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/admin/stores/${storeId}/products/${product.$id}`}
                                                            className="flex items-center"
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={() => setShowCommissionDialog(true)}
                                                        disabled={isLoading}
                                                    >
                                                        <DollarSign className="h-4 w-4 mr-2" />
                                                        Update Commission
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={handleToggleStatus}
                                                        disabled={isLoading}
                                                    >
                                                        {product.isActive ? (
                                                            <>
                                                                <EyeOff className="h-4 w-4 mr-2" />
                                                                Deactivate Product
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Activate Product
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem asChild>
                                                        <a
                                                            href={`/products/${product.$id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center"
                                                        >
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            View in Store
                                                        </a>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        onClick={handleRemoveProduct}
                                                        disabled={isLoading}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove from Store
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <div className="text-center">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <span className="text-sm text-gray-500">No image available</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-2 space-y-1">
                        <div>
                            <h3 className="font-semibold text-base leading-tight line-clamp-2 text-gray-900 mb-2">
                                {product.name}
                            </h3>

                            {/* Color variants */}
                            {product.colors && product.colors.length > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-gray-600">Colors:</span>
                                    <div className="flex items-center gap-1">
                                        {product.colors.slice(0, 4).map((color, idx) => (
                                            <div
                                                key={idx}
                                                className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                                                style={{ backgroundColor: color.colorCode }}
                                                title={color.name}
                                            />
                                        ))}
                                        {product.colors.length > 4 && (
                                            <span className="text-sm text-gray-500 font-medium ml-1">
                                                +{product.colors.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            {product.physicalStoreCountry && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4" />
                                    <span>From: {product.physicalStoreCountry}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-2 pb-4">
                        <div className="bg-gray-50 rounded-lg p-3 mt-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                        <Package className="h-3 w-3" />
                                        <span>Base Price</span>
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                        {product.basePrice} {getCurrencySymbol(product.currency)}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>Commission</span>
                                    </div>
                                    <div className="font-semibold text-green-600">
                                       {product.commission} {getCurrencySymbol(product.currency)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">Selling Price:</span>
                                    <div className="text-lg font-bold text-blue-600">
                                        {finalPrice} {getCurrencySymbol(product.currency)}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Profit Margin:</span>
                                    <span className="text-sm font-bold text-green-600">{profitMargin}%</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setShowCommissionDialog(true)}
                            disabled={isLoading}
                            variant={'primary'}
                            size={'sm'}
                            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Settings className="h-4 w-4" />
                            {isLoading ? "Updating..." : "Update Price"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showCommissionDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Update Commission</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="commission" className="text-sm font-medium text-gray-700">
                                        Commission Amount
                                    </Label>
                                    <Input
                                        id="commission"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newCommission}
                                        onChange={(e) => setNewCommission(parseFloat(e.target.value) || 0)}
                                        className="mt-1 text-base"
                                        placeholder="Enter commission amount"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Base Price:</span>
                                            <span className="font-semibold text-gray-900">
                                                {product.basePrice} {getCurrencySymbol(product.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Commission:</span>
                                            <span className="font-semibold text-green-600">
                                                {newCommission} {getCurrencySymbol(product.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-blue-200">
                                            <span className="font-semibold text-gray-900">New Selling Price:</span>
                                            <span className="font-bold text-blue-600 text-base">
                                                {(product.basePrice || 0) + newCommission} {getCurrencySymbol(product.currency)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCommissionDialog(false)}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCommissionUpdate}
                                        disabled={isLoading}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? "Updating..." : "Update Commission"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};