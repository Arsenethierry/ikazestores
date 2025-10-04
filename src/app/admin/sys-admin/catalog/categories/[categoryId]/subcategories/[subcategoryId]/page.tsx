import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { getCatalogProductTypes } from '@/lib/actions/catalog-server-actions';
import Link from 'next/link';
import { ProductTypesListSkeleton } from '@/features/catalog/productTypes-list-container';
import CreateProductTypeModal from '@/features/catalog/components/create-product-type-modal';
import { ProductTypesGrid } from '@/features/catalog/producttypes-grid';

interface SubcategoryDetailPageProps {
    params: Promise<{
        categoryId: string;
        subcategoryId: string;
    }>;
    searchParams: Promise<{
        page?: string;
        search?: string;
    }>;
}

export default async function SubcategoryDetailPage({
    params,
    searchParams
}: SubcategoryDetailPageProps) {
    const { categoryId, subcategoryId } = await params;
    const page = parseInt((await searchParams).page || '1');
    const search = (await searchParams).search;

    const productTypesResponse = await getCatalogProductTypes({
        page,
        search,
        subcategoryId,
        limit: 25,
    });

    if (!productTypesResponse.success || !productTypesResponse.data) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/sys-admin/catalog/categories">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Categories
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Product Types</h1>
                            <p className="text-muted-foreground">
                                Manage product types for this subcategory
                            </p>
                        </div>
                    </div>
                </div>
                <div className="text-red-500">
                    Error loading product types: {productTypesResponse.error}
                </div>
            </div>
        );
    }

    const productTypesData = productTypesResponse.data;

    return (
        <div className="space-y-6">
            {/* Breadcrumb and Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/sys-admin/catalog/categories">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Categories
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Product Types</h1>
                        <p className="text-muted-foreground">
                            Manage product types for this subcategory
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <CreateProductTypeModal
                        subcategoryId={subcategoryId}
                        categoryId={categoryId}
                    >
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Product Type
                        </Button>
                    </CreateProductTypeModal>
                </div>
            </div>

            {/* Product Types List */}
            <Suspense fallback={<ProductTypesListSkeleton />}>
                <ProductTypesGrid initialData={productTypesData} />
            </Suspense>
        </div>
    )
}