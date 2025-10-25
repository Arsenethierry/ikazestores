"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Star, Package, Power, Loader2, Info } from "lucide-react";
import { toggleProductDropshippingAction, toggleProductFeatured } from "@/lib/actions/original-products-actions";
import { bulkUpdateProductStatus } from "@/lib/actions/original-products-actions";
import { Products, AffiliateProductImports } from "@/lib/types/appwrite/appwrite";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductTogglePanelProps {
    product: Products | (AffiliateProductImports & { originalProduct?: Products });
    type: "physical" | "virtual";
    storeId: string;
}

export function ProductTogglePanel({ product, type, storeId }: ProductTogglePanelProps) {
    const router = useRouter();

    const { execute: toggleFeatured, status: featuredStatus } = useAction(
        toggleProductFeatured,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.success || "Featured status updated");
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to update featured status");
            },
        }
    );

    const { execute: toggleDropshipping, status: dropshippingStatus } = useAction(
        toggleProductDropshippingAction,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.success || "Dropshipping status updated");
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to update dropshipping status");
            },
        }
    );

    const { execute: updateStatus, status: statusUpdateStatus } = useAction(
        bulkUpdateProductStatus,
        {
            onSuccess: ({ data }) => {
                toast.success(data?.success || "Product status updated");
                router.refresh();
            },
            onError: ({ error }) => {
                toast.error(error.serverError || "Failed to update status");
            },
        }
    );

    const isPhysical = type === "physical";
    const physicalProduct = isPhysical ? (product as Products) : null;
    const virtualProduct = !isPhysical ? (product as AffiliateProductImports & { originalProduct?: Products }) : null;

    const isFeatured = isPhysical
        ? physicalProduct?.featured
        : virtualProduct?.originalProduct?.featured || false;

    const isDropshipping = isPhysical
        ? physicalProduct?.isDropshippingEnabled
        : virtualProduct?.originalProduct?.isDropshippingEnabled || false;

    const currentStatus = isPhysical
        ? physicalProduct?.status
        : virtualProduct?.originalProduct?.status || "draft";

    const isActive = currentStatus === "active";

    const isAnyPending =
        featuredStatus === "executing" ||
        dropshippingStatus === "executing" ||
        statusUpdateStatus === "executing";

    const handleFeaturedToggle = () => {
        if (isPhysical && physicalProduct) {
            toggleFeatured({ productId: physicalProduct.$id });
        } else if (virtualProduct?.originalProduct) {
            // For virtual products, toggle the original product's featured status
            toggleFeatured({ productId: virtualProduct.originalProduct.$id });
        }
    };

    const handleDropshippingToggle = () => {
        if (isPhysical && physicalProduct) {
            toggleDropshipping({ productId: physicalProduct.$id });
        }
    };

    const handleStatusToggle = () => {
        const newStatus = isActive ? "draft" : "active";
        if (isPhysical && physicalProduct) {
            updateStatus({
                productIds: [physicalProduct.$id],
                status: newStatus,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Power className="h-5 w-5" />
                    Product Toggles
                </CardTitle>
                <CardDescription>
                    Quick controls for product visibility and features
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Featured Toggle */}
                <div className="flex items-center justify-between space-x-4">
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="featured" className="text-base font-medium">
                                Featured Product
                            </Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Featured products appear prominently on store homepage and
                                            category pages
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Highlight this product across the store
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isFeatured && (
                            <Badge variant="default" className="gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                Featured
                            </Badge>
                        )}
                        <Switch
                            id="featured"
                            checked={isFeatured}
                            onCheckedChange={handleFeaturedToggle}
                            disabled={isAnyPending || !isPhysical}
                        />
                        {featuredStatus === "executing" && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Dropshipping Toggle - Only for Physical Products */}
                {isPhysical && (
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="dropshipping" className="text-base font-medium">
                                    Dropshipping Enabled
                                </Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs">
                                                Enable influencers to import and resell this product in
                                                their virtual stores
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Allow virtual stores to import this product
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {isDropshipping && (
                                <Badge variant="secondary" className="gap-1">
                                    <Package className="h-3 w-3" />
                                    Enabled
                                </Badge>
                            )}
                            <Switch
                                id="dropshipping"
                                checked={isDropshipping}
                                onCheckedChange={handleDropshippingToggle}
                                disabled={isAnyPending}
                            />
                            {dropshippingStatus === "executing" && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                        </div>
                    </div>
                )}

                {/* Dropshipping Info for Virtual Products */}
                {!isPhysical && virtualProduct?.originalProduct && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Dropshipping Product
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    This product is imported from a physical store. Dropshipping
                                    settings are managed by the original store owner.
                                    {isDropshipping && (
                                        <span className="block mt-1 font-medium">
                                            ✓ Dropshipping is enabled for this product
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Toggle - Only for Physical Products */}
                {isPhysical && (
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="status" className="text-base font-medium">
                                    Product Status
                                </Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs">
                                                Active products are visible to customers. Draft products
                                                are hidden.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Control product visibility
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={isActive ? "default" : "secondary"}>
                                {isActive ? "Active" : "Draft"}
                            </Badge>
                            <Switch
                                id="status"
                                checked={isActive}
                                onCheckedChange={handleStatusToggle}
                                disabled={isAnyPending}
                            />
                            {statusUpdateStatus === "executing" && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}