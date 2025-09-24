import { Button } from "@/components/ui/button";
import { CategoriesListContainer, CategoriesListSkeleton } from "@/features/catalog/components/categories-list-container";
import { getCatalogCategories } from "@/lib/actions/catalog-server-actions";
import { Plus } from "lucide-react";
import { lazy, Suspense } from "react";

interface CategoriesPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        includeInactive?: string;
    }>;
}

const CreateCategoryModal = lazy(
  () => import("@/features/catalog/components/create-category-modal")
);

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
    const page = parseInt((await searchParams).page || '1');
    const search = (await searchParams).search;
    const includeInactive = (await searchParams).includeInactive === 'true';

    const categoriesResponse = await getCatalogCategories({
        page,
        search,
        includeInactive,
        limit: 25,
    });

    if (!categoriesResponse.success || !categoriesResponse.data) {        
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

                <div className="text-red-500">
                    Error loading categories: {categoriesResponse.error || 'Unknown error'}
                </div>
            </div>
        );
    }

    const categoriesData = categoriesResponse.data;

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