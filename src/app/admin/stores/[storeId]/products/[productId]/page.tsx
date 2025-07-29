import { AccessDeniedCard } from "@/components/access-denied-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getOriginalProductById } from "@/lib/actions/original-products-actions";
import { getPhysicalStoreById } from "@/lib/actions/physical-store.action";
import { getAuthState } from "@/lib/user-permission";
import { formatPrice } from "@/lib/utils";
import { AlertTriangle, Archive, ArrowLeft, Calendar, Copy, Edit, Eye, ImageIcon, MapPin, Package, RotateCcw, Star, Tag, Trash2, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface ProductDetailsPageProps {
    params: Promise<{ storeId: string; productId: string }>;
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<ProductDetailsPageSkeleton />}>
                <ProductDetailsContent params={params} />
            </Suspense>
        </div>
    )
}

async function ProductDetailsContent({ params }: ProductDetailsPageProps) {
    const { productId, storeId } = await params;
    const {
        isPhysicalStoreOwner,
        user,
        // canAccessStore
    } = await getAuthState();

    if (!isPhysicalStoreOwner) {
        return <AccessDeniedCard message="You do not have permission to access this page" />
    }

    if (!user) {
        redirect("/sign-in")
    }

    const [storeData, productResult] = await Promise.all([
        getPhysicalStoreById(storeId),
        getOriginalProductById(productId)
    ]);

    if (!storeData) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Store not found. Please check the store ID and try again.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if ('error' in productResult) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {productResult.error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const product = productResult.data;
    const createdDate = new Date(product.$createdAt);
    const updatedDate = new Date(product.$updatedAt);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/admin/stores/${storeId}/products`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight line-clamp-2">
                            {product.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Product details in {storeData.storeName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/admin/stores/${storeId}/products/${productId}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                        </Link>
                    </Button>

                    {product.status === "active" ? (
                        <Button variant="outline">
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                        </Button>
                    ) : (
                        <Button variant="outline">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                        </Button>
                    )}
                </div>
            </div>

            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/admin" className="hover:text-foreground">
                    Admin
                </Link>
                <span>/</span>
                <Link href="/admin/stores" className="hover:text-foreground">
                    Stores
                </Link>
                <span>/</span>
                <Link href={`/admin/stores/${storeId}`} className="hover:text-foreground">
                    {storeData.storeName}
                </Link>
                <span>/</span>
                <Link href={`/admin/stores/${storeId}/products`} className="hover:text-foreground">
                    Products
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">Details</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Product Images
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {product.images && product.images.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {product.images.map((imageUrl, index) => (
                                        <div
                                            key={index}
                                            className="aspect-square relative rounded-lg overflow-hidden border"
                                        >
                                            <Image
                                                src={imageUrl}
                                                alt={`${product.name} - Image ${index + 1}`}
                                                fill
                                                className="object-cover hover:scale-105 transition-transform duration-200"
                                                sizes="(max-width: 768px) 50vw, 33vw"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">No images uploaded</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Product Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Description</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {product.description || "No description provided"}
                                </p>
                            </div>

                            {product.shortDescription && (
                                <div>
                                    <h3 className="font-semibold mb-2">Short Description</h3>
                                    <p className="text-muted-foreground">
                                        {product.shortDescription}
                                    </p>
                                </div>
                            )}

                            {product.tags && product.tags.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline">
                                                <Tag className="h-3 w-3 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {product.hasVariants && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Variants</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-2" />
                                    <p>This product has variants configured</p>
                                    <p className="text-sm">Variant details would be displayed here</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status & Visibility</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status</span>
                                <Badge
                                    variant={
                                        product.status === "active"
                                            ? "default"
                                            : product.status === "draft"
                                                ? "secondary"
                                                : "outline"
                                    }
                                    className="capitalize"
                                >
                                    {product.status}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Featured</span>
                                <Badge
                                    variant={product.featured ? "secondary" : "outline"}
                                    className={product.featured ? "text-yellow-600 border-yellow-200" : ""}
                                >
                                    {product.featured ? (
                                        <>
                                            <Star className="w-3 h-3 mr-1 fill-current" />
                                            Featured
                                        </>
                                    ) : (
                                        "Not Featured"
                                    )}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Dropshipping</span>
                                <Badge
                                    variant={product.isDropshippingEnabled ? "secondary" : "outline"}
                                    className={product.isDropshippingEnabled ? "text-blue-600 border-blue-200" : ""}
                                >
                                    {product.isDropshippingEnabled ? (
                                        <>
                                            <Truck className="w-3 h-3 mr-1" />
                                            Enabled
                                        </>
                                    ) : (
                                        "Disabled"
                                    )}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Has Variants</span>
                                <Badge variant={product.hasVariants ? "default" : "outline"}>
                                    {product.hasVariants ? "Yes" : "No"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold">
                                    {formatPrice(product.basePrice, product.currency)}
                                </div>
                                <p className="text-sm text-muted-foreground">Base Price</p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Currency</span>
                                    <Badge variant="outline">{product.currency}</Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>SKU</span>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {product.sku}
                                    </code>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Category</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Category ID</span>
                                <Badge variant="outline">{product.categoryId}</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Subcategory ID</span>
                                <Badge variant="outline">{product.subcategoryId}</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Product Type ID</span>
                                <Badge variant="outline">{product.productTypeId}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Store Location</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{product.storeCountry}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <div>Latitude: {product.storeLatitude}</div>
                                <div>Longitude: {product.storeLongitude}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="font-medium">Created</div>
                                    <div className="text-muted-foreground">
                                        {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="font-medium">Last Updated</div>
                                    <div className="text-muted-foreground">
                                        {updatedDate.toLocaleDateString()} at {updatedDate.toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="font-medium">Created By</div>
                                    <div className="text-muted-foreground">
                                        {product.createdBy === user.$id ? "You" : product.createdBy}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href={`/admin/stores/${storeId}/products/${productId}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Product
                                </Link>
                            </Button>

                            <Button variant="outline" className="w-full justify-start">
                                <Eye className="h-4 w-4 mr-2" />
                                View in Store
                            </Button>

                            <Separator />

                            {product.status === "active" ? (
                                <Button variant="outline" className="w-full justify-start">
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive Product
                                </Button>
                            ) : (
                                <Button variant="outline" className="w-full justify-start">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Restore Product
                                </Button>
                            )}

                            <Button variant="destructive" className="w-full justify-start">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Product
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function ProductDetailsPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Breadcrumb Skeleton */}
            <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-12" />
                <span>/</span>
                <Skeleton className="h-4 w-16" />
                <span>/</span>
                <Skeleton className="h-4 w-24" />
                <span>/</span>
                <Skeleton className="h-4 w-20" />
                <span>/</span>
                <Skeleton className="h-4 w-16" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Images Card Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} className="aspect-square" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details Card Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Skeleton className="h-5 w-24 mb-2" />
                                <Skeleton className="h-4 w-full mb-1" />
                                <Skeleton className="h-4 w-3/4 mb-1" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <div>
                                <Skeleton className="h-5 w-28 mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="flex justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}