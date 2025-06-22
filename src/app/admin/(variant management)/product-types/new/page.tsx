import ProductTypeForm from "@/features/variants management/components/product-type-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllCategoriesByStoreId } from "@/features/categories/actions/categories-actions";
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

async function CreateProductTypeContent({ storeId }: { storeId?: string }) {
    const { user } = await getAuthState();
    if (!user) {
        redirect("/signin");
    }

    // Get categories - either store-specific or global
    const categoriesResponse = storeId 
        ? await getAllCategoriesByStoreId({ storeId })
        : await getAllCategoriesByStoreId({ storeId: "" }); // Global categories

    const categories = categoriesResponse?.documents || [];

    if (categories.length === 0) {
        return (
            <div className="container mx-auto py-6">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">No Categories Available</h2>
                    <p className="text-muted-foreground">
                        You need to create categories first before you can create product types.
                    </p>
                    <a 
                        href={storeId ? `/admin/stores/${storeId}/categories/create` : '/admin/categories/create'}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        Create Category
                    </a>
                </div>
            </div>
        );
    }

    return (
        <ProductTypeForm
            mode="create"
            storeId={storeId || ""}
            userId={user.$id}
            categories={categories}
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