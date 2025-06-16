import { AccessDeniedCard } from "@/components/access-denied-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/features/products/components/product-form";
import { getCategoriesWithInheritance } from "@/features/categories/actions/categories-actions";
import { getPhysicalStoreById } from "@/lib/actions/physical-store.action";
import { getAuthState } from "@/lib/user-label-permission";
import { AlertTriangle, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { getVariantTemplatesForStore } from "@/features/categories/actions/products-variant-templates-action";
import { getProductTypes } from "@/features/categories/actions/product-types-actions";

interface ProductCreatePageProps {
    params: Promise<{ storeId: string }>;
}

export default async function ProductCreatePage({ params }: ProductCreatePageProps) {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<ProductCreatePageSkeleton />}>
                <ProductCreateContent params={params} />
            </Suspense>
        </div>
    );
}

async function ProductCreateContent({ params }: ProductCreatePageProps) {
    const { storeId } = await params;
    const { isPhysicalStoreOwner, user } = await getAuthState();

    if (!isPhysicalStoreOwner) {
        return <AccessDeniedCard />;
    }

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Authentication required. Please log in to continue.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const [
        storeData,
        categoriesData,
        productTypesData,
        variantTemplatesData
    ] = await Promise.all([
        getPhysicalStoreById(storeId),
        getCategoriesWithInheritance(storeId),
        getProductTypes(),
        getVariantTemplatesForStore(storeId)
    ]);

    if (!storeData) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/stores">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Store Not Found</h1>
                        <p className="text-muted-foreground">The requested store could not be found.</p>
                    </div>
                </div>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
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

    if (categoriesData.error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={`/admin/stores/${storeId}/products`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Product</h1>
                        <p className="text-muted-foreground">Add a new product to {storeData.storeName}</p>
                    </div>
                </div>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load categories: {categoriesData.error}
                        <br />
                        <Link
                            href={`/admin/stores/${storeId}/categories`}
                            className="text-primary hover:underline"
                        >
                            Manage Categories
                        </Link>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!categoriesData.documents || categoriesData.documents.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={`/admin/stores/${storeId}/products`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Product</h1>
                        <p className="text-muted-foreground">Add a new product to {storeData.storeName}</p>
                    </div>
                </div>
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        No categories found. You need to create categories before adding products.
                        <br />
                        <div className="flex gap-2 mt-3">
                            <Link href={`/admin/stores/${storeId}/categories/new`}>
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Store Category
                                </Button>
                            </Link>
                            <Link href="/admin/categories/new">
                                <Button variant="outline" size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Global Category
                                </Button>
                            </Link>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!productTypesData.documents || productTypesData.documents.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={`/admin/stores/${storeId}/products`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Product</h1>
                        <p className="text-muted-foreground">Add a new product to {storeData.storeName}</p>
                    </div>
                </div>
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        No product types found. You need to create product types before adding products.
                        <br />
                        <div className="flex gap-2 mt-3">
                            <Link href={`/admin/stores/${storeId}/product-types/new`}>
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Product Type
                                </Button>
                            </Link>
                            <Link href={`/admin/stores/${storeId}/categories`}>
                                <Button variant="outline" size="sm">
                                    Manage Categories
                                </Button>
                            </Link>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const formattedCategoriesData = {
        categories: categoriesData.documents,
        error: categoriesData.error
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/admin/stores/${storeId}/products`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
                    <p className="text-muted-foreground">
                        Add a new product to {storeData.storeName} with advanced variant management
                    </p>
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
                <span className="font-medium text-foreground">Create</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{categoriesData.total}</div>
                        <p className="text-xs text-muted-foreground">Available Categories</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{productTypesData.total}</div>
                        <p className="text-xs text-muted-foreground">Product Types</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{variantTemplatesData.total}</div>
                        <p className="text-xs text-muted-foreground">Variant Templates</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-600">Ready</div>
                        <p className="text-xs text-muted-foreground">System Status</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Quick Setup</h3>
                            <p className="text-sm text-muted-foreground">
                                Need to set up additional resources before creating products?
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href={`/admin/stores/${storeId}/categories/new`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Category
                            </Button>
                        </Link>
                        <Link href={`/admin/stores/${storeId}/product-types/new`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Product Type
                            </Button>
                        </Link>
                        <Link href={`/admin/stores/${storeId}/variants/new`}>
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Variant Template
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <ProductForm
                storeData={storeData}
                categoriesData={formattedCategoriesData}
                productTypes={productTypesData.documents}
                variantTemplates={variantTemplatesData.documents}
            />
        </div>
    );
}

function ProductCreatePageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-4">
                            <Skeleton className="h-8 w-12 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-96" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-32 w-full" />
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-40 w-full" />
                    </div>

                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export async function generateMetadata({ params }: ProductCreatePageProps) {
    const { storeId } = await params;

    try {
        const storeData = await getPhysicalStoreById(storeId);

        if (!storeData) {
            return {
                title: 'Store Not Found',
                description: 'The requested store could not be found.',
                robots: 'noindex',
            };
        }

        return {
            title: `Create Product - ${storeData.storeName}`,
            description: `Add a new product to ${storeData.storeName} with advanced variant management and configuration options.`,
            robots: 'noindex',
            openGraph: {
                title: `Create Product - ${storeData.storeName}`,
                description: `Add a new product to ${storeData.storeName} with advanced variant management.`,
                type: 'website',
            },
        };
    } catch {
        return {
            title: 'Create Product',
            description: 'Add a new product with advanced variant management.',
            robots: 'noindex',
        };
    }
}