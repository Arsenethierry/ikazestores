import { Suspense } from 'react';
import { GlobalProductTypesContainer, GlobalProductTypesContainerSkeleton } from '@/features/catalog/global-product-types-container';
import { getCatalogProductTypes } from '@/lib/actions/catalog-server-actions';

interface GlobalProductTypesPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        includeInactive?: string;
        categoryId?: string;
        subcategoryId?: string;
    }>;
}

export default async function GlobalProductTypesPage({ searchParams }: GlobalProductTypesPageProps) {
    const page = parseInt((await searchParams).page || '1');
    const search = (await searchParams).search;
    const includeInactive = (await searchParams).includeInactive === 'true';
    const categoryId = (await searchParams).categoryId;
    const subcategoryId = (await searchParams).subcategoryId;

    const productTypesResponse = await getCatalogProductTypes({
        page,
        search,
        includeInactive,
        categoryId,
        subcategoryId,
        limit: 25,
    });

    if (!productTypesResponse.success || !productTypesResponse.data) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Product Types</h1>
                        <p className="text-muted-foreground">
                            Manage all product types across your catalog
                        </p>
                    </div>
                </div>
                <div className="text-red-500">
                    Error loading product types: {productTypesResponse.error || 'Unknown error'}
                </div>
            </div>
        );
    }

    const productTypesData = productTypesResponse.data;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Types</h1>
                    <p className="text-muted-foreground">
                        Manage all product types across your catalog
                    </p>
                </div>
            </div>

            <Suspense fallback={<GlobalProductTypesContainerSkeleton />}>
                <GlobalProductTypesContainer initialData={productTypesData} />
            </Suspense>
        </div>
    );
}
