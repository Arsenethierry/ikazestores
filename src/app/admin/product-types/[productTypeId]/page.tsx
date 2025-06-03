import { Suspense } from "react";
import { getProductTypeById } from "@/features/products/actions/variants management/product-types-actions";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemNotFoundCard } from "@/components/item-not-found-card";

interface ProductTypeDetailsPageProps {
    params: {
        productTypeId: string;
    };
}

export default async function ProductTypeDetailsPage({ params }: ProductTypeDetailsPageProps) {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<ProductTypeDetailsPageSkeleton />}>
                <ProductTypeDetailsContent productTypeId={params.productTypeId} />
            </Suspense>
        </div>
    );
}

async function ProductTypeDetailsContent({ productTypeId }: { productTypeId: string }) {
    const productType = await getProductTypeById({ productTypeId });

    if (!productType) {
        return (
            <ItemNotFoundCard
                itemName="Product Type"
                message="You don't have access or this product type may have been deleted or moved."
                backUrl="/admin/product-types"
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/product-types">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{productType.name}</h1>
                        <p className="text-muted-foreground">Product Type Details</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <Link href={`/admin/product-types/${productTypeId}/edit`}>
                        <Button>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                    <Link href={`/admin/product-types/${productTypeId}/variants`}>
                        <Button variant="outline">
                            <Package className="mr-2 h-4 w-4" />
                            View Variants
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Core details about this product type</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="text-lg">{productType.name}</p>
                        </div>
                        {productType.description && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Description</p>
                                <p>{productType.description}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Scope</p>
                            <Badge variant={productType.storeId ? "default" : "secondary"}>
                                {productType.storeId ? "Store Specific" : "Global Template"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Metadata</CardTitle>
                        <CardDescription>System information and timestamps</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p>{new Date(productType.$createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            })}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                            <p>{new Date(productType.$updatedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            })}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Product Type ID</p>
                            <p className="font-mono text-sm">{productType.$id}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ProductTypeDetailsPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32 mt-2" />
                    </div>
                </div>
                <div className="flex space-x-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    );
}
