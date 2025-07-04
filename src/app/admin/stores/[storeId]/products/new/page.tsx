import { AccessDeniedCard } from "@/components/access-denied-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/features/products/components/product-form";
import { getPhysicalStoreById } from "@/lib/actions/physical-store.action";
import { getAuthState } from "@/lib/user-permission";
import { AlertTriangle, ArrowLeft, Package2, Tags, Layers } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { getCategories, getProductTypes, getVariantTemplates } from "@/features/variants management/ecommerce-catalog";

interface ProductCreatePageProps {
    params: Promise<{ storeId: string }>;
}

export default async function ProductCreatePage({ params }: ProductCreatePageProps) {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<ProductCreatePageSkeleton />}>
                <ProductCreateContent params={params} />
            </Suspense>
        </div>
    );
}

async function ProductCreateContent({ params }: ProductCreatePageProps) {
    const { storeId } = await params;
    const { isPhysicalStoreOwner, user } = await getAuthState();

    if (!isPhysicalStoreOwner) {
        return <AccessDeniedCard />;
    }

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Authentication required. Please log in to continue.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const storeData = await getPhysicalStoreById(storeId);

    if (!storeData) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/stores">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Store Not Found</h1>
                        <p className="text-muted-foreground">The requested store could not be found.</p>
                    </div>
                </div>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Store not found. Please check the store ID and try again.
                        <br />
                        <Link href="/admin/stores" className="text-primary hover:underline">
                            Return to Stores List
                        </Link>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const categories = getCategories();
    const productTypes = getProductTypes();
    const variantTemplates = getVariantTemplates();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/admin/stores/${storeId}/products`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
                    <p className="text-muted-foreground">
                        Add a new product to {storeData.storeName} with comprehensive catalog options
                    </p>
                </div>
            </div>

            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/admin" className="hover:text-foreground">
                    Admin
                </Link>
                <span>/</span>
                <Link href="/admin/stores" className="hover:text-foreground">
                    Stores
                </Link>
                <span>/</span>
                <Link href={`/admin/stores/${storeId}`} className="hover:text-foreground">
                    {storeData.storeName}
                </Link>
                <span>/</span>
                <Link href={`/admin/stores/${storeId}/products`} className="hover:text-foreground">
                    Products
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">Create</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Package2 className="h-5 w-5 text-blue-600" />
                            <div>
                                <div className="text-2xl font-bold">{categories.length}</div>
                                <p className="text-xs text-muted-foreground">Product Categories</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-green-600" />
                            <div>
                                <div className="text-2xl font-bold">{productTypes.length}</div>
                                <p className="text-xs text-muted-foreground">Product Types</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-purple-600" />
                            <div>
                                <div className="text-2xl font-bold">{variantTemplates.length}</div>
                                <p className="text-xs text-muted-foreground">Variant Templates</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">Ready</div>
                                <p className="text-xs text-muted-foreground">Catalog Status</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Comprehensive Product Catalog</h3>
                            <p className="text-sm text-muted-foreground">
                                Our catalog includes extensive categories, variants, and properties for all types of products
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <Package2 className="h-4 w-4" />
                                Popular Categories
                            </h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div>• Fashion & Apparel</div>
                                <div>• Electronics & Technology</div>
                                <div>• Home & Garden</div>
                                <div>• Health & Beauty</div>
                                <div>• Sports & Outdoors</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <Tags className="h-4 w-4" />
                                Variant Options
                            </h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div>• Size & Dimensions</div>
                                <div>• Colors & Materials</div>
                                <div>• Technical Specifications</div>
                                <div>• Features & Properties</div>
                                <div>• Quality & Condition</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Smart Features
                            </h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div>• Auto-pricing for variants</div>
                                <div>• Intelligent combinations</div>
                                <div>• Category-specific templates</div>
                                <div>• Real-time validation</div>
                                <div>• Inventory management</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ProductForm storeData={storeData} />
        </div>
    );
}

function ProductCreatePageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-12" />
                <span>/</span>
                <Skeleton className="h-4 w-16" />
                <span>/</span>
                <Skeleton className="h-4 w-24" />
                <span>/</span>
                <Skeleton className="h-4 w-20" />
                <span>/</span>
                <Skeleton className="h-4 w-16" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <div>
                                    <Skeleton className="h-8 w-12 mb-1" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <div className="space-y-1">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <Skeleton key={j} className="h-4 w-40" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-96" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-32 w-full" />
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-40 w-full" />
                    </div>

                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export async function generateMetadata({ params }: ProductCreatePageProps) {
    const { storeId } = await params;

    try {
        const storeData = await getPhysicalStoreById(storeId);

        if (!storeData) {
            return {
                title: 'Store Not Found',
                description: 'The requested store could not be found.',
                robots: 'noindex',
            };
        }

        return {
            title: `Create Product - ${storeData.storeName}`,
            description: `Add a new product to ${storeData.storeName} with comprehensive catalog management, variants, and pricing options.`,
            robots: 'noindex',
            openGraph: {
                title: `Create Product - ${storeData.storeName}`,
                description: `Add a new product to ${storeData.storeName} with advanced catalog management.`,
                type: 'website',
            },
        };
    } catch {
        return {
            title: 'Create Product',
            description: 'Add a new product with comprehensive catalog management.',
            robots: 'noindex',
        };
    }
}