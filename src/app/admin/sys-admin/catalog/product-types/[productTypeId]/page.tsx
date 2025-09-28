import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Package } from 'lucide-react';
import { getVariantsForProductType } from '@/lib/actions/catalog-server-actions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductTypeVariantsContainer, ProductTypeVariantsContainerSkeleton } from '@/features/catalog/product-type-variants-container';

interface ProductTypeDetailPageProps {
    params: Promise<{
        productTypeId: string;
    }>;
}

export default async function ProductTypeDetailPage({ 
    params
}: ProductTypeDetailPageProps) {
    const { productTypeId } = await params;

    const variantsResponse = await getVariantsForProductType({
        productTypeId
    });

    if (!variantsResponse.success || !variantsResponse.data) {
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
                            <h1 className="text-3xl font-bold tracking-tight">Product Type Variants</h1>
                            <p className="text-muted-foreground">
                                Configure variant templates for this product type
                            </p>
                        </div>
                    </div>
                </div>
                <div className="text-red-500">
                    Error loading variants: {variantsResponse.error}
                </div>
            </div>
        );
    }

    const variantsData = variantsResponse.data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/sys-admin/catalog/categories">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Categories
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Product Type Variants</h1>
                        <p className="text-muted-foreground">
                            Configure variant templates for this product type
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/admin/catalog/variant-templates">
                            <Package className="h-4 w-4 mr-2" />
                            Manage Templates
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Variants Management */}
            <Suspense fallback={<ProductTypeVariantsContainerSkeleton />}>
                <ProductTypeVariantsContainer 
                    productTypeId={productTypeId}
                    initialData={variantsData} 
                />
            </Suspense>
        </div>
    );
}
