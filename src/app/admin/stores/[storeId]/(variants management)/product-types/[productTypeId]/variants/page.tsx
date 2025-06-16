import { AccessDeniedCard } from "@/components/access-denied-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProductTypeById } from "@/features/categories/actions/product-types-actions";
import { getVariantTemplatesForStore } from "@/features/categories/actions/products-variant-templates-action";
import { ProductTypeVariantStats } from "@/features/variants management/components/product-type-variants-stats";
import { VariantTemplatesList } from "@/features/variants management/components/variant-templates-list";
import { getPhysicalStoreById } from "@/lib/actions/physical-store.action";
import { getAuthState } from "@/lib/user-label-permission";
import { ArrowLeft, Globe, Link, Package, Plus, Settings, Store } from "lucide-react";
import React, { Suspense } from "react";

interface StoreProductTypeVariantsPageProps {
    params: Promise<{
        storeId: string;
        productTypeId: string;
    }>;
}

export default async function StoreProductTypeVariantsPage({ params }: StoreProductTypeVariantsPageProps) {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<StoreProductTypeVariantsPageSkeleton />}>
                <StoreProductTypeVariantsContent params={params} />
            </Suspense>
        </div>
    );
}

async function StoreProductTypeVariantsContent({ params }: StoreProductTypeVariantsPageProps) {
    const { storeId, productTypeId } = await params;
    const { isPhysicalStoreOwner, user } = await getAuthState();

    if (!isPhysicalStoreOwner) {
        return <AccessDeniedCard />;
    }

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Authentication Required</h2>
                    <p className="text-muted-foreground mt-2">Please log in to access this page.</p>
                </div>
            </div>
        );
    }

    const [storeData, productType, variantTemplates] = await Promise.all([
        getPhysicalStoreById(storeId),
        getProductTypeById({ productTypeId, storeId }),
        getVariantTemplatesForStore(storeId, productTypeId)
    ]);

    if (!storeData) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertDescription>
                        Store not found. Please check the store ID and try again.
                        <br />
                        <Link href="/admin/stores" className="text-primary hover:underline">
                            Return to Stores List
                        </Link>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!productType) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={`/admin/stores/${storeId}/product-types`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Product Type Not Found</h1>
                        <p className="text-muted-foreground">for {storeData.storeName}</p>
                    </div>
                </div>
                <Alert variant="destructive">
                    <AlertDescription>
                        Product type not found. Please check the product type ID and try again.
                        <br />
                        <Link
                            href={`/admin/stores/${storeId}/product-types`}
                            className="text-primary hover:underline"
                        >
                            Return to Product Types
                        </Link>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const globalTemplates = variantTemplates.documents.filter(template => !template.storeId);
    const storeTemplates = variantTemplates.documents.filter(template => template.storeId === storeId);
    const inheritedTemplates = variantTemplates.documents.filter(template =>
        template.storeId && template.storeId !== storeId
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/admin/stores/${storeId}/product-types`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Variants for {productType.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Manage variant templates for {storeData.storeName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/admin/stores/${storeId}/product-types/${productTypeId}/edit`}>
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Edit Product Type
                        </Button>
                    </Link>
                    <Link href={`/admin/stores/${storeId}/variants/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Variant Template
                        </Button>
                    </Link>
                </div>
            </div>

            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/admin" className="hover:text-foreground">Admin</Link>
                <span>/</span>
                <Link href="/admin/stores" className="hover:text-foreground">Stores</Link>
                <span>/</span>
                <Link href={`/admin/stores/${storeId}`} className="hover:text-foreground">
                    {storeData.storeName}
                </Link>
                <span>/</span>
                <Link href={`/admin/stores/${storeId}/product-types`} className="hover:text-foreground">
                    Product Types
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">{productType.name}</span>
                <span>/</span>
                <span className="font-medium text-foreground">Variants</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            Store Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Store Name:</span>
                                <span className="font-medium">{storeData.storeName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Location:</span>
                                <span className="font-medium">
                                    {storeData.city}, {storeData.country}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <Badge variant={storeData.isActive ? "default" : "secondary"}>
                                    {storeData.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Product Type Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Name:</span>
                                <span className="font-medium">{productType.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Scope:</span>
                                <Badge variant={productType.storeId ? "secondary" : "outline"}>
                                    {productType.storeId ? (
                                        <>
                                            <Store className="w-3 h-3 mr-1" />
                                            Store-Specific
                                        </>
                                    ) : (
                                        <>
                                            <Globe className="w-3 h-3 mr-1" />
                                            Global
                                        </>
                                    )}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <Badge variant={productType.isActive ? "default" : "secondary"}>
                                    {productType.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </div>
                        {productType.description && (
                            <div className="mt-4">
                                <span className="text-sm text-muted-foreground">Description:</span>
                                <p className="text-sm mt-1">{productType.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Variant Templates Overview</CardTitle>
                    <CardDescription>
                        Available variant templates for this product type
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductTypeVariantStats
                        productTypeId={productTypeId}
                        storeId={storeId}
                    />
                </CardContent>
            </Card>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">
                        All Templates ({variantTemplates.total})
                    </TabsTrigger>
                    <TabsTrigger value="store">
                        Store Templates ({storeTemplates.length})
                    </TabsTrigger>
                    <TabsTrigger value="global">
                        Global Templates ({globalTemplates.length})
                    </TabsTrigger>
                    {inheritedTemplates.length > 0 && (
                        <TabsTrigger value="inherited">
                            Inherited ({inheritedTemplates.length})
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <VariantTemplatesList
                        templates={variantTemplates.documents}
                        productTypeId={productTypeId}
                        storeId={storeId}
                        showScope={true}
                    />
                </TabsContent>

                <TabsContent value="store" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium">Store-Specific Templates</h3>
                            <p className="text-sm text-muted-foreground">
                                Templates created specifically for {storeData.storeName}
                            </p>
                        </div>
                        <Link href={`/admin/stores/${storeId}/variants/new`}>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Template
                            </Button>
                        </Link>
                    </div>

                    <VariantTemplatesList
                        templates={storeTemplates}
                        productTypeId={productTypeId}
                        storeId={storeId}
                        showScope={false}
                        emptyMessage="No store-specific variant templates found. Create one to get started."
                    />
                </TabsContent>

                <TabsContent value="global" className="space-y-4">
                    <div className="mb-4">
                        <h3 className="text-lg font-medium">Global Templates</h3>
                        <p className="text-sm text-muted-foreground">
                            Templates available to all stores
                        </p>
                    </div>
                    <VariantTemplatesList
                        templates={globalTemplates}
                        productTypeId={productTypeId}
                        storeId={storeId}
                        showScope={false}
                        emptyMessage="No global variant templates available for this product type."
                        readonly={true}
                    />
                </TabsContent>

                {inheritedTemplates.length > 0 && (
                    <TabsContent value="inherited" className="space-y-4">
                        <div className="mb-4">
                            <h3 className="text-lg font-medium">Inherited Templates</h3>
                            <p className="text-sm text-muted-foreground">
                                Templates from other stores that you can reference
                            </p>
                        </div>
                        <VariantTemplatesList
                            templates={inheritedTemplates}
                            productTypeId={productTypeId}
                            storeId={storeId}
                            showScope={true}
                            emptyMessage="No inherited templates found."
                            readonly={true}
                        />
                    </TabsContent>
                )}
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks for managing variants in this store</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Link href={`/admin/stores/${storeId}/variants/new`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Template
                            </Button>
                        </Link>
                        <Link href={`/admin/stores/${storeId}/product-types/${productTypeId}/edit`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Settings className="w-4 h-4 mr-2" />
                                Edit Product Type
                            </Button>
                        </Link>
                        <Link href={`/admin/stores/${storeId}/product-types`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Package className="w-4 h-4 mr-2" />
                                All Product Types
                            </Button>
                        </Link>
                        <Link href={`/admin/stores/${storeId}/products/new`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Product
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StoreProductTypeVariantsPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <React.Fragment key={i}>
                        <Skeleton className="h-4 w-16" />
                        {i < 6 && <span>/</span>}
                    </React.Fragment>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent>
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, j) => (
                                    <div key={j} className="flex justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-20" />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex space-x-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-28" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-64" />
                    ))}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}