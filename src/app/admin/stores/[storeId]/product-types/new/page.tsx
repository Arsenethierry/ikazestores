import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCategoriesWithSubcategories } from "@/features/categories/actions/categories-actions";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import ProductTypeForm from "../product-type-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/user-label-permission";
import { getAvailableVariantTemplatesForProductType } from "@/features/products/actions/variants management/product-types-actions";

interface CreateProductTypePageProps {
    params: Promise<{ storeId: string }>;
}

async function CreateProductTypePageContent({ storeId, userId }: { storeId: string, userId: string }) {
    const [categoriesData, variantTemplatesData] = await Promise.all([
        getCategoriesWithSubcategories({ storeId }),
        getAvailableVariantTemplatesForProductType(undefined, undefined, storeId)
    ]);

    if (categoriesData.error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Failed to load categories: {categoriesData.error}
                    <br />
                    <Link href={`/admin/stores/${storeId}/categories`} className="underline">
                        Please create categories first
                    </Link>
                </AlertDescription>
            </Alert>
        );
    }

    if (categoriesData.categories.length === 0) {
        return (
            <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                    No categories found. You need to create at least one category before creating product types.
                    <br />
                    <Link
                        href={`/admin/stores/${storeId}/categories/create`}
                        className="inline-flex items-center gap-2 mt-2 text-primary hover:underline"
                    >
                        Create Category First
                    </Link>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <ProductTypeForm
            storeId={storeId}
            userId={userId}
            mode="create"
            categories={categoriesData.categories}
            availableVariantTemplates={variantTemplatesData.documents || []}
        />
    );
}

export default async function CreateProductTypePage({ params }: CreateProductTypePageProps) {
    const { storeId } = await params;
    const { user } = await getAuthState();

    if (!user) {
        redirect('/sign-in');
    }

    return (
        <div className="container mx-auto py-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/stores/${storeId}/product-types`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Product Types
                        </Link>
                    </Button>
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Package className="h-8 w-8" />
                        Create Product Type
                    </h1>
                    <p className="text-muted-foreground">
                        Define a new product type that can have associated variant templates and organize your products effectively.
                    </p>
                </div>

                <Suspense fallback={<CreateProductTypePageSkeleton />}>
                    <CreateProductTypePageContent storeId={storeId} userId={user.$id} />
                </Suspense>
            </div>
        </div>
    )
}

function CreateProductTypePageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-7 w-48" />
                </div>
                <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-6 w-32" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-3 w-72" />
                    </div>
                </div>

                <Skeleton className="h-px w-full" />

                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-6 w-48" />
                        </div>
                        <Skeleton className="h-4 w-80" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-start space-x-3 p-3 border rounded-lg">
                                <Skeleton className="h-4 w-4 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-full" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Skeleton className="h-px w-full" />
                <div className="space-y-4">
                    <Skeleton className="h-6 w-20" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                            <Skeleton className="h-4 w-10" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-36" />
                </div>
            </CardContent>
        </Card>
    );
}

export async function generateMetadata() {

    return {
        title: 'Create Product Type',
        description: 'Create a new product type to organize your products and manage variants effectively.',
        robots: 'noindex',
    };
}