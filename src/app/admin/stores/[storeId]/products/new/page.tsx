import { AccessDeniedCard } from "@/components/access-denied-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoriesWithSubcategories } from "@/features/categories/actions/categories-actions";
import { getAllProductTypes, getVariantGroupsByProductType } from "@/features/products/actions/variants management/product-types-actions";
import { getVariantTemplatesByProductType } from "@/features/products/actions/variants management/products-variant-templates-action";
import ProductForm from "@/features/products/components/product-form";
import { getPhysicalStoreById } from "@/lib/actions/physical-store.action";
import { getAuthState } from "@/lib/user-label-permission";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

async function ProductCreatePage({
    params
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;
    const { isPhysicalStoreOwner } = await getAuthState();

    if (!isPhysicalStoreOwner) {
        return <AccessDeniedCard />
    }

    const [
        storeData,
        categories,
        productTypes,
        variantTemplates,
        variantGroups
    ] = await Promise.all([
        getPhysicalStoreById(storeId),
        getCategoriesWithSubcategories({ storeId }),
        getAllProductTypes(storeId),
        getVariantTemplatesByProductType("", storeId),
        getVariantGroupsByProductType("", storeId)
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

    if (categories.error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load categories: {categories.error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (categories.categories.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        No categories found. Please create categories first before adding products.
                        <br />
                        <Link
                            href={`/admin/stores/${storeId}/categories`}
                            className="text-primary hover:underline"
                        >
                            Go to Categories Management
                        </Link>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }


    return (
        <div className="container mx-auto p-6">
            <Suspense fallback={<ProductFormSkeleton />}>
                <ProductForm
                    categoriesData={categories}
                    storeData={storeData}
                    storeId={storeId}
                    productTypes={productTypes.documents || []}
                    variantTemplates={variantTemplates.documents || []}
                    variantGroups={variantGroups.documents || []}
                />
            </Suspense>
        </div>
    )
};

function ProductFormSkeleton() {
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
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

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-32 w-full" />
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ProductCreatePage;

export async function generateMetadata({
    params
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    try {
        const storeData = await getPhysicalStoreById(storeId);

        if (!storeData) {
            return {
                title: 'Store Not Found',
                description: 'The requested store could not be found.'
            };
        }

        return {
            title: `Create Product - ${storeData.storeName}`,
            description: `Add a new product to ${storeData.storeName} with advanced variant management and configuration options.`,
            robots: 'noindex',
        };
    } catch {
        return {
            title: 'Create Product',
            description: 'Add a new product with advanced variant management.'
        };
    }
}