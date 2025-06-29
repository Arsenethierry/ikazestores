import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductTypeById } from "@/features/categories/actions/product-types-actions";
import { getAuthState } from "@/lib/user-permission";
import { getAllCategoriesByStoreId } from "@/features/categories/actions/categories-actions";
import ProductTypeForm from "@/features/variants management/components/product-type-form";
import { ItemNotFoundCard } from "@/components/item-not-found-card";

interface EditProductTypePageProps {
    params: Promise<{
        productTypeId: string;
        storeId?: string;
    }>;
}

export default async function EditProductTypePage({ params }: EditProductTypePageProps) {
    const resolvedParams = await params; // Resolve the Promise
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<EditProductTypePageSkeleton />}>
                <EditProductTypeContent 
                    productTypeId={resolvedParams.productTypeId} 
                    storeId={resolvedParams.storeId}
                />
            </Suspense>
        </div>
    );
}

async function EditProductTypeContent({ 
    productTypeId, 
    storeId 
}: { 
    productTypeId: string;
    storeId?: string;
}) {
    const { user } = await getAuthState();
    if (!user) {
        redirect("/signin");
    }

    const productType = await getProductTypeById({ productTypeId, storeId });
    
    if (!productType) {
        return (
            <ItemNotFoundCard
                itemName="Product Type"
                message="You don't have access or this product type may have been deleted or moved."
                backUrl={storeId ? `/admin/stores/${storeId}/product-types` : "/admin/product-types"}
            />
        );
    }

    // Get categories - either store-specific or global
    const categoriesResponse = storeId 
        ? await getAllCategoriesByStoreId({ storeId })
        : await getAllCategoriesByStoreId({ storeId: "" }); // Global categories

    const categories = categoriesResponse?.documents || [];

    return (
        <ProductTypeForm
            mode="edit"
            storeId={storeId || ""}
            userId={user.$id}
            categories={categories}
            initialData={{
                ...productType,
                productTypeId: productType.$id,
                isActive: productType.isActive !== false,
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