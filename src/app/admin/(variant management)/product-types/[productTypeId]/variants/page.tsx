import { AccessDeniedCard } from "@/components/access-denied-card";
import { NoItemsCard } from "@/components/no-items-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAvailableVariantTemplatesForProductType, getProductTypeById } from "@/features/categories/actions/product-types-actions";
import { ProductTypeVariantStats } from "@/features/variants management/components/product-type-variants-stats";
import { VariantTemplatesList } from "@/features/variants management/components/variant-templates-list";
import { VariantTemplate } from "@/lib/types";
import { getAuthState } from "@/lib/user-label-permission";
import { ArrowLeft, Package, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

interface ProductTypeVariantsPageProps {
    params: Promise<{
        productTypeId: string;
    }>;
}

export default async function ProductTypeVariantsPage({ params }: ProductTypeVariantsPageProps) {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<ProductTypeVariantsPageSkeleton />}>
                <ProductTypeVariantsContent params={params} />
            </Suspense>
        </div>
    )
}

async function ProductTypeVariantsContent({ params }: ProductTypeVariantsPageProps) {
    const { productTypeId } = await params;
    const { isSystemAdmin, user } = await getAuthState();

    if (!isSystemAdmin) {
        return <AccessDeniedCard message="Obly sytem admin access" />;
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

    const [productType, variantTemplates] = await Promise.all([
        getProductTypeById({ productTypeId }),
        getAvailableVariantTemplatesForProductType({ productTypeId })
    ]);

    if (!productType) {
        return <NoItemsCard />
    }

    const globalTemplates = variantTemplates.documents.filter((template: VariantTemplate) => !template.storeId);
    const storeTemplates = variantTemplates.documents.filter((template: VariantTemplate) => template.storeId);

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
                        <h1 className="text-3xl font-bold tracking-tight">
                            Variants for {productType.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Manage variant templates for this product type
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/admin/product-types/${productTypeId}/edit`}>
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Edit Product Type
                        </Button>
                    </Link>
                    <Link href="/admin/variants/new">
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
                <Link href="/admin/product-types" className="hover:text-foreground">Product Types</Link>
                <span>/</span>
                <span className="font-medium text-foreground">{productType.name}</span>
                <span>/</span>
                <span className="font-medium text-foreground">Variants</span>
            </nav>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {productType.name}
                            </CardTitle>
                            <CardDescription>
                                {productType.description || "No description provided"}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {!productType.storeId && (
                                <Badge variant="outline">Global Product Type</Badge>
                            )}
                            {productType.storeId && (
                                <Badge variant="secondary">Store-Specific</Badge>
                            )}
                            <Badge variant={productType.isActive ? "default" : "secondary"}>
                                {productType.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ProductTypeVariantStats productTypeId={productTypeId} />
                </CardContent>
            </Card>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">
                        All Templates ({variantTemplates.total})
                    </TabsTrigger>
                    <TabsTrigger value="global">
                        Global ({globalTemplates.length})
                    </TabsTrigger>
                    <TabsTrigger value="store">
                        Store-Specific ({storeTemplates.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <VariantTemplatesList
                        templates={variantTemplates.documents}
                        productTypeId={productTypeId}
                        showScope={true}
                    />
                </TabsContent>

                <TabsContent value="global" className="space-y-4">
                    <VariantTemplatesList
                        templates={globalTemplates}
                        productTypeId={productTypeId}
                        showScope={false}
                        emptyMessage="No global variant templates found for this product type."
                    />
                </TabsContent>

                <TabsContent value="store" className="space-y-4">
                    <VariantTemplatesList
                        templates={storeTemplates}
                        productTypeId={productTypeId}
                        showScope={false}
                        emptyMessage="No store-specific variant templates found for this product type."
                    />
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks for managing variants</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href="/admin/variants/new">
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Template
                            </Button>
                        </Link>
                        <Link href={`/admin/product-types/${productTypeId}/edit`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Settings className="w-4 h-4 mr-2" />
                                Edit Product Type
                            </Button>
                        </Link>
                        <Link href="/admin/product-types">
                            <Button variant="outline" className="w-full justify-start">
                                <Package className="w-4 h-4 mr-2" />
                                All Product Types
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

}

function ProductTypeVariantsPageSkeleton() {
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
                <Skeleton className="h-4 w-12" />
                <span>/</span>
                <Skeleton className="h-4 w-24" />
                <span>/</span>
                <Skeleton className="h-4 w-20" />
                <span>/</span>
                <Skeleton className="h-4 w-16" />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64 mt-2" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
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
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-24" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-64" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: ProductTypeVariantsPageProps) {
    const { productTypeId } = await params;

    try {
        const productType = await getProductTypeById({ productTypeId });

        if (!productType) {
            return {
                title: 'Product Type Not Found',
                description: 'The requested product type could not be found.',
                robots: 'noindex',
            };
        }

        return {
            title: `Variants - ${productType.name}`,
            description: `Manage variant templates for the ${productType.name} product type.`,
            robots: 'noindex',
        };
    } catch {
        return {
            title: 'Product Type Variants',
            description: 'Manage variant templates for product types.',
            robots: 'noindex',
        };
    }
}