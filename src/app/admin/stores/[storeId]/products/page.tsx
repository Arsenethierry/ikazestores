import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import {
    Skeleton
} from "@/components/ui/skeleton";
import { VirtualProductCard } from "@/features/products/components/product-cards/virtual-product-card";
import { ProductSekeleton } from "@/features/products/components/products-list-sekeleton";
import { ProductsDataTable } from "@/features/products/components/products-list-table/products-data-table";
import { getVirtualStoreProducts } from "@/lib/actions/affiliate-product-actions";
import { getStoreOriginalProducts } from "@/lib/actions/original-products-actions";
import { Products, VirtualProducts } from "@/lib/types/appwrite/appwrite";
import { getAuthState } from "@/lib/user-permission";
import { AlertTriangle, Copy, Eye, Package, Plus, RefreshCw, Search, ShoppingCart, Star, Store, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

interface StoreProductsPageProps {
    params: Promise<{ storeId: string }>;
}

export default async function StoreProductsPage({ params }: StoreProductsPageProps) {
    const { storeId } = await params;

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Suspense fallback={<StoreProductsPageSkeleton />}>
                <StoreProductsContent storeId={storeId} />
            </Suspense>
        </div>
    )
}

async function StoreProductsContent({ storeId }: { storeId: string }) {
    const authState = await getAuthState();
    const {
        isPhysicalStoreOwner,
        isVirtualStoreOwner,
        // canAccessStore,
        user
    } = authState;

    if (!user || (!isPhysicalStoreOwner && !isVirtualStoreOwner)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                            <p className="text-muted-foreground mb-4">
                                You don't have permission to view products for this store.
                            </p>
                            <Button asChild>
                                <Link href="/admin/stores">
                                    Back to Stores
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    let originalProducts = null;
    let virtualProductsResult = null;

    try {
        if (isPhysicalStoreOwner) {
            originalProducts = await getStoreOriginalProducts(storeId);
        }

        if (isVirtualStoreOwner) {
            virtualProductsResult = await getVirtualStoreProducts(
                storeId,
                {
                    limit: 20,
                }
            );
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }

    if (isVirtualStoreOwner) {
        return (
            <VirtualStoreProductsView
                storeId={storeId}
                // @ts-ignore
                virtualProductsResult={virtualProductsResult}
            />
        )
    }

    if (isPhysicalStoreOwner) {
        return (
            <PhysicalStoreProductsView
                storeId={storeId}
                originalProducts={originalProducts}
            />
        );
    }

    return <AccessDeniedView />;
}

function VirtualStoreProductsView({
    storeId,
    virtualProductsResult
}: {
    storeId: string;
    virtualProductsResult: { success: boolean; data?: VirtualProducts[]; error?: string } | null;
}) {
    if (virtualProductsResult && !virtualProductsResult.success) {
        return (
            <div className="space-y-6">
                <ProductsHeader
                    title="Virtual Products"
                    description="Manage your cloned products"
                    storeId={storeId}
                    isVirtual={true}
                />

                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>{virtualProductsResult.error}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const virtualProducts = virtualProductsResult?.data || [];

    return (
        <div className="space-y-6">
            <ProductsHeader
                title="Virtual Products"
                description="Manage your cloned products from the marketplace"
                storeId={storeId}
                isVirtual={true}
                productCount={virtualProducts.length}
            />

            <VirtualProductsStats products={virtualProducts} />

            {virtualProducts.length === 0 ? (
                <EmptyVirtualProductsState storeId={storeId} />
            ) : (
                <VirtualProductsGrid
                    products={virtualProducts}
                    storeId={storeId}
                />
            )}
        </div>
    )
}

function PhysicalStoreProductsView({
    storeId,
    originalProducts
}: {
    storeId: string;
    originalProducts: { documents: Products[]; total: number; hasMore: boolean } | null;
}) {
    if (originalProducts && 'error' in originalProducts) {
        return (
            <div className="space-y-6">
                <ProductsHeader
                    title="Original Products"
                    description="Manage your store's product catalog"
                    storeId={storeId}
                    isVirtual={false}
                />

                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {(originalProducts as any).error}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const products = originalProducts?.documents || [];
    const totalCount = originalProducts?.total || 0;

    return (
        <div className="space-y-6">
            <ProductsHeader
                title="Original Products"
                description="Manage your store's product catalog"
                storeId={storeId}
                isVirtual={false}
                productCount={products.length}
                totalCount={totalCount}
            />

            <OriginalProductsStats products={products} />

            {products.length === 0 ? (
                <EmptyOriginalProductsState storeId={storeId} />
            ) : (
                <div className="space-y-4">
                    <Suspense fallback={<TableSkeleton />}>
                        <ProductsDataTable
                            data={products}
                            currentStoreId={storeId}
                            totalCount={totalCount}
                        />
                    </Suspense>
                </div>
            )}
        </div>
    )
}

function ProductsHeader({
    title,
    description,
    storeId,
    isVirtual,
    productCount,
    totalCount
}: {
    title: string;
    description: string;
    storeId: string;
    isVirtual: boolean;
    productCount?: number;
    totalCount?: number;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    {productCount !== undefined && (
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                            {totalCount ? `${productCount}/${totalCount}` : productCount}
                        </Badge>
                    )}
                </div>
                <p className="text-muted-foreground">{description}</p>
            </div>

            <div className="flex items-center gap-2">
                {isVirtual ? (
                    <>
                        <Button variant="outline" asChild>
                            <Link href={`/admin/stores/${storeId}/products/analytics`}>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Analytics
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/admin/stores/${storeId}/products/clone-products`}>
                                <Copy className="h-4 w-4 mr-2" />
                                Clone Products
                            </Link>
                        </Button>
                    </>
                ) : (
                    <>
                        <Button asChild>
                            <Link href={`/admin/stores/${storeId}/products/new`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Product
                            </Link>
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

function VirtualProductsStats({ products }: { products: VirtualProducts[] }) {
    const totalValue = products.reduce((sum, product) => sum + (product.sellingPrice || 0), 0);
    const averageCommission = products.length > 0
        ? products.reduce((sum, product) => sum + (product.mainProdCommission || 0), 0) / products.length
        : 0;
    const activeProducts = products.filter(p => p.virtualStore).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
                title="Total Products"
                value={products.length.toString()}
                icon={Package}
                description="Cloned products"
            />
            <StatsCard
                title="Active Products"
                value={activeProducts.toString()}
                icon={Eye}
                description="Currently visible"
            />
            <StatsCard
                title="Total Value"
                value={`$${totalValue.toFixed(2)}`}
                icon={ShoppingCart}
                description="Combined selling price"
            />
            <StatsCard
                title="Avg. Commission"
                value={`$${averageCommission.toFixed(2)}`}
                icon={TrendingUp}
                description="Per product"
            />
        </div>
    )
}

function OriginalProductsStats({ products }: { products: Products[] }) {
    const activeProducts = products.filter(p => p.status === 'active').length;
    const draftProducts = products.filter(p => p.status === 'draft').length;
    const featuredProducts = products.filter(p => p.featured).length;
    const dropshippingEnabled = products.filter(p => p.isDropshippingEnabled).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
                title="Total Products"
                value={products.length.toString()}
                icon={Package}
                description="All products"
            />
            <StatsCard
                title="Active"
                value={activeProducts.toString()}
                icon={Eye}
                description={`${draftProducts} drafts`}
                variant="success"
            />
            <StatsCard
                title="Featured"
                value={featuredProducts.toString()}
                icon={Star}
                description="Highlighted products"
                variant="warning"
            />
            <StatsCard
                title="Dropshipping"
                value={dropshippingEnabled.toString()}
                icon={Store}
                description="Available for affiliates"
                variant="info"
            />
        </div>
    )
}

function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    variant = "default"
}: {
    title: string;
    value: string;
    icon: any;
    description: string;
    variant?: "default" | "success" | "warning" | "info";
}) {
    const variants = {
        default: "text-blue-600",
        success: "text-green-600",
        warning: "text-yellow-600",
        info: "text-purple-600"
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${variants[variant]}`} />
                </div>
            </CardContent>
        </Card>
    )
}

function VirtualProductsGrid({
    products,
    storeId
}: {
    products: VirtualProducts[];
    storeId: string;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Products</h2>
                {products.length >= 20 && (
                    <Button variant="outline" asChild>
                        <Link href={`/admin/stores/${storeId}/products?view=all`}>
                            View All Products
                        </Link>
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {products.map((product) => (
                    <div key={product.$id}>
                        <Suspense fallback={<ProductSekeleton />}>
                            <VirtualProductCard
                                product={product}
                                storeId={storeId}
                                isMyProduct={true}
                            />
                        </Suspense>
                    </div>
                ))}
            </div>
        </div>
    )
}

function EmptyVirtualProductsState({ storeId }: { storeId: string }) {
    return (
        <Card className="text-center py-16">
            <CardContent>
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Copy className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start building your virtual store by cloning products from the marketplace.
                    You'll earn commissions on every sale.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild>
                        <Link href={`/admin/stores/${storeId}/products/clone-products`}>
                            <Search className="h-4 w-4 mr-2" />
                            Browse Marketplace
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/marketplace">
                            <Eye className="h-4 w-4 mr-2" />
                            View Marketplace
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function EmptyOriginalProductsState({ storeId }: { storeId: string }) {
    return (
        <Card className="text-center py-16">
            <CardContent>
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Package className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No products created yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first product to start building your catalog.
                    You can also enable dropshipping to let affiliates sell your products.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild>
                        <Link href={`/admin/stores/${storeId}/products/new`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Product
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/admin/stores/${storeId}/products/bulk-import`}>
                            <Package className="h-4 w-4 mr-2" />
                            Bulk Import
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function AccessDeniedView() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                        <p className="text-muted-foreground mb-4">
                            You don't have permission to view products.
                        </p>
                        <Button asChild>
                            <Link href="/admin">
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StoreProductsPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

function TableSkeleton() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}