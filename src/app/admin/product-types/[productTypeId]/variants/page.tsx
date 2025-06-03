import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductTypeById, getVariantGroupsByProductType } from "@/features/products/actions/variants management/product-types-actions";

interface ProductTypeVariantsPageProps {
    params: {
        productTypeId: string;
    };
}

export default async function ProductTypeVariantsPage({ params }: ProductTypeVariantsPageProps) {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<ProductTypeVariantsPageSkeleton />}>
                <ProductTypeVariantsContent productTypeId={params.productTypeId} />
            </Suspense>
        </div>
    );
}

async function ProductTypeVariantsContent({ productTypeId }: { productTypeId: string }) {
    const productType = await getProductTypeById({ productTypeId });
    if (!productType) {
        notFound();
    }

    const variantGroups = await getVariantGroupsByProductType(productType.name);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/product-types">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Variants for {productType.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Manage variant groups and templates for this product type
                        </p>
                    </div>
                </div>
                <Link href="/admin/variants/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Variant Group
                    </Button>
                </Link>
            </div>

            {variantGroups.documents.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No variant groups yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create variant groups to define product variations for {productType.name}
                        </p>
                        <Link href="/admin/variants/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Variant Group
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {variantGroups.documents.map((group) => (
                        <Card key={group.$id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg">{group.name}</CardTitle>
                                {group.description && (
                                    <CardDescription className="line-clamp-2">
                                        {group.description}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                        Variant Templates ({group.templates?.length || 0})
                                    </p>
                                    <div className="space-y-2">
                                        {group.templates?.slice(0, 3).map((template) => (
                                            <div key={template.$id} className="flex items-center justify-between">
                                                <span className="text-sm">{template.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {template.type}
                                                </Badge>
                                            </div>
                                        ))}
                                        {group.templates && group.templates.length > 3 && (
                                            <p className="text-xs text-muted-foreground">
                                                +{group.templates.length - 3} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <Badge variant={group.storeId ? "default" : "secondary"}>
                                        {group.storeId ? "Store" : "Global"}
                                    </Badge>
                                    <Link href={`/admin/variants/${group.$id}/edit`}>
                                        <Button variant="outline" size="sm">
                                            Edit
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function ProductTypeVariantsPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64" />
                ))}
            </div>
        </div>
    );
}
