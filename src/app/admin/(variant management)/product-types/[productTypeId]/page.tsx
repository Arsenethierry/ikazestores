import { Suspense } from "react";
import { getProductTypeById } from "@/features/categories/actions/product-types-actions";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Package, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemNotFoundCard } from "@/components/item-not-found-card";
import { CreateVariantTemplateModal } from "@/features/variants management/components/create-variant-template-modal";
import { VariantTemplatesSection } from "@/features/variants management/components/variant-template-section";
import { getAuthState } from "@/lib/user-label-permission";
import { AccessDeniedCard } from "@/components/access-denied-card";

interface ProductTypeDetailsPageProps {
    params: Promise<{
        productTypeId: string;
    }>;
}

export default async function ProductTypeDetailsPage({ params }: ProductTypeDetailsPageProps) {
    const { productTypeId } = await params;
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<ProductTypeDetailsPageSkeleton />}>
                <ProductTypeDetailsContent productTypeId={productTypeId} />
            </Suspense>
        </div>
    );
}

async function ProductTypeDetailsContent({ productTypeId }: { productTypeId: string }) {
    const productType = await getProductTypeById({ productTypeId });
    const { user } = await getAuthState();

    if (!user) {
       return <AccessDeniedCard />
    }

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
                        <p className="text-muted-foreground">Product Type Details & Variants</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <Link href={`/admin/categories/product-types/${productTypeId}/edit`}>
                        <Button variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Type
                        </Button>
                    </Link>
                    <Button>
                        <Package className="mr-2 h-4 w-4" />
                        View Products
                    </Button>
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
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Slug</p>
                            <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{productType.slug}</p>
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

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Variant Templates
                            </CardTitle>
                            <CardDescription>
                                Define the variation options available for products of this type
                            </CardDescription>
                        </div>
                        <CreateVariantTemplateModal
                            productTypeId={productTypeId}
                            currentUser={user}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<VariantTemplatesSkeleton />}>
                        <VariantTemplatesSection
                            productTypeId={productTypeId}
                        />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}

function VariantTemplatesSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            ))}
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
