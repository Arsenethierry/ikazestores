import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductTypeById, getAvailableVariantTemplatesForProductType } from "@/features/products/actions/variants management/product-types-actions";
import { getAuthState } from "@/lib/user-label-permission";
import { getGeneralCategories } from "@/features/categories/actions/categories-actions";
import ProductTypeForm from "@/app/admin/stores/[storeId]/product-types/product-type-form";
import { ItemNotFoundCard } from "@/components/item-not-found-card";

interface EditProductTypePageProps {
    params: {
        productTypeId: string;
    };
}

export default async function EditProductTypePage({ params }: EditProductTypePageProps) {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<EditProductTypePageSkeleton />}>
                <EditProductTypeContent productTypeId={params.productTypeId} />
            </Suspense>
        </div>
    );
}

async function EditProductTypeContent({ productTypeId }: { productTypeId: string }) {
    const { user } = await getAuthState();
    if (!user) {
        redirect("/signin");
    }

    const productType = await getProductTypeById({ productTypeId });
    if (!productType) {
        if (!productType) {
            return (
                <ItemNotFoundCard
                    itemName="Product Type"
                    message="You don't have access or this product type may have been deleted or moved."
                    backUrl="/admin/product-types"
                />
            );
        }
    }

    const [categoriesResponse, variantTemplatesResponse] = await Promise.all([
        getGeneralCategories(),
        getAvailableVariantTemplatesForProductType(undefined, productType.categoryId)
    ]);

    const categories = categoriesResponse?.documents || [];
    const variantTemplates = variantTemplatesResponse?.documents || [];

    return (
        <ProductTypeForm
            mode="edit"
            storeId=""
            userId={user.$id}
            categories={categories}
            availableVariantTemplates={variantTemplates}
            initialData={{
                ...productType,
                productTypeId: productType.$id,
                defaultVariants: productType.defaultVariantTemplates || [],
                isActive: productType.isActive !== false,
                sortOrder: productType.sortOrder || 0
            }}
        />
    );
}

function EditProductTypePageSkeleton() {
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
