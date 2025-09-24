import { getCatalogCategories } from "@/lib/actions/catalog-server-actions";
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Layers,
    Package,
    Grid3X3,
    Palette,
    ArrowRight,
    Plus,
    BarChart3
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default async function CatalogOverviewPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
                    <p className="text-muted-foreground">
                        Manage your product catalog structure, categories, and variants
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/sys-admin/catalog/analytics">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                        </Link>
                    </Button>
                </div>
            </div>

            <Suspense fallback={<CatalogStatsLoading />}>
                <CatalogStats />
            </Suspense>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="relative overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Layers className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Categories</CardTitle>
                                <CardDescription>Manage product categories and hierarchy</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span>Active Categories</span>
                                <Badge variant="secondary">View All</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <Button asChild className="w-full">
                                    <Link href="/admin/sys-admin/catalog/categories">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Manage Categories
                                        <ArrowRight className="h-4 w-4 ml-auto" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Product Types</CardTitle>
                                <CardDescription>Define product type specifications</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span>Total Types</span>
                                <Badge variant="secondary">Browse</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <Button asChild className="w-full">
                                    <Link href="/admin/sys-admin/catalog/product-types">
                                        <Grid3X3 className="h-4 w-4 mr-2" />
                                        Manage Types
                                        <ArrowRight className="h-4 w-4 ml-auto" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Palette className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle>Variant Templates</CardTitle>
                                <CardDescription>Create reusable variant configurations</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span>Templates</span>
                                <Badge variant="secondary">Configure</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <Button asChild className="w-full">
                                    <Link href="/admin/sys-admin/catalog/variant-templates">
                                        <Palette className="h-4 w-4 mr-2" />
                                        Manage Templates
                                        <ArrowRight className="h-4 w-4 ml-auto" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

async function CatalogStats() {
    const categoriesResult = await getCatalogCategories({ limit: 1000 });
    const categories = categoriesResult.data?.documents || [];

    const activeCategories = categories.filter(c => c.isActive).length;
    const inactiveCategories = categories.length - activeCategories;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeCategories}</div>
                    <p className="text-xs text-muted-foreground">
                        {inactiveCategories > 0 && `${inactiveCategories} inactive`}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Product Types</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Variant Templates</CardTitle>
                    <Palette className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                    <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                </CardContent>
            </Card>
        </div>
    )
}

function CatalogStatsLoading() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-12 mb-1" />
                        <Skeleton className="h-3 w-16" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}