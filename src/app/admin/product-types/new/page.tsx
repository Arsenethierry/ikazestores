import ProductTypeForm from "@/app/admin/stores/[storeId]/product-types/product-type-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getGeneralCategories } from "@/features/categories/actions/categories-actions";
import { getAvailableVariantTemplatesForProductType } from "@/features/products/actions/variants management/product-types-actions";
import { getAuthState } from "@/lib/user-label-permission";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CreateProductTypePage() {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<CreateProductTypePageSkeleton />}>
                <CreateProductTypeContent />
            </Suspense>
        </div>
    );
}

async function CreateProductTypeContent() {
    const { user } = await getAuthState();
    if (!user) {
        redirect("/signin");
    }

    const [categoriesResponse, variantTemplatesResponse] = await Promise.all([
        getGeneralCategories(),
        getAvailableVariantTemplatesForProductType()
    ]);

    const categories = categoriesResponse?.documents || [];
    const variantTemplates = variantTemplatesResponse?.documents || [];

    return (
        <ProductTypeForm
            mode="create"
            storeId=""
            userId={user.$id}
            categories={categories}
            availableVariantTemplates={variantTemplates}
        />
    );
}

function CreateProductTypePageSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-96" />
            <div className="border rounded-lg p-6 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="flex justify-end space-x-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </div>
    );
}