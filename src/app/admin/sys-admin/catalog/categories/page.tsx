import { Button } from "@/components/ui/button";
import { CategoriesListContainer, CategoriesListSkeleton } from "@/features/catalog/components/categories-list-container";
import { getCatalogCategories } from "@/lib/actions/catalog-server-actions";
import { Plus } from "lucide-react";
import { lazy, Suspense } from "react";

interface CategoriesPageProps {
    searchParams: {
        page?: string;
        search?: string;
        includeInactive?: string;
    };
}

const CreateCategoryModal = lazy(
  () => import("@/features/catalog/components/create-category-modal")
);

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
    const page = parseInt(searchParams.page || '1');
    const search = searchParams.search;
    const includeInactive = searchParams.includeInactive === 'true';

    const categoriesData = await getCatalogCategories({
        page,
        search,
        includeInactive,
        limit: 25,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">
                        Organize your products with categories and subcategories
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <CreateCategoryModal>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Category
                        </Button>
                    </CreateCategoryModal>
                </div>
            </div>

            <Suspense fallback={<CategoriesListSkeleton />}>
                <CategoriesListContainer initialData={categoriesData} />
            </Suspense>
        </div>
    )
}
