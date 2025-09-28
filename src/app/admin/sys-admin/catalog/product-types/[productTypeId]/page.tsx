import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Eye, 
  Target, 
  BarChart3, 
  Layers,
  Hash,
  FileText,
  Palette,
  ToggleLeft,
  ListFilter,
  DollarSign,
  ShoppingCart,
  Edit3,
  ExternalLink,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  MapPin,
  Tags
} from 'lucide-react';
import Link from 'next/link';
import { getProductTypeWithFullDetails } from '@/lib/actions/catalog-server-actions';
import { VariantTemplatesOptionsSection } from '@/features/catalog/VariantTemplatesOptionsSection';

interface ProductTypeDetailPageProps {
    params: Promise<{
        productTypeId: string;
    }>;
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to get status color
function getStatusColor(isActive: boolean) {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
}

export default async function ProductTypeDetailPage({ 
    params
}: ProductTypeDetailPageProps) {
    const { productTypeId } = await params;

    // Fetch basic product type details (not variants - those are streamed)
    const response = await getProductTypeWithFullDetails(productTypeId);
    
    if (!response.success || !response.data) {
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
                            <h1 className="text-3xl font-bold tracking-tight">
                                {response.error || "Product Type Not Found"}
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="text-red-500">
                    {response.error || `Product type with ID ${productTypeId} was not found.`}
                </div>
            </div>
        );
    }

    const {
        productType,
        category,
        subcategory,
        statistics
    } = response.data;

    return (
        <div className="space-y-6">
            {/* Header with Breadcrumbs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/sys-admin/catalog/categories">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Categories
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{productType.productTypeName}</h1>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                                {category && (
                                    <>
                                        <Link href={`/admin/sys-admin/catalog/categories/${category.$id}`} className="hover:text-primary">
                                            {category.categoryName}
                                        </Link>
                                        <span>/</span>
                                    </>
                                )}
                                {subcategory && (
                                    <>
                                        <Link href={`/admin/sys-admin/catalog/subcategories/${subcategory.$id}`} className="hover:text-primary">
                                            {subcategory.subCategoryName}
                                        </Link>
                                        <span>/</span>
                                    </>
                                )}
                                <span className="font-medium">{productType.productTypeName}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/sys-admin/catalog/product-types/${productTypeId}/edit`}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Product Type
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/admin/sys-admin/catalog/variant-templates">
                                <Package className="h-4 w-4 mr-2" />
                                Manage Templates
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Status and Quick Info */}
                <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(productType.isActive)}>
                        {productType.isActive ? (
                            <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                            </>
                        ) : (
                            <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                            </>
                        )}
                    </Badge>
                    <Badge variant="outline">
                        <Hash className="h-3 w-3 mr-1" />
                        Sort Order: {productType.sortOrder}
                    </Badge>
                    <Badge variant="outline">
                        <Target className="h-3 w-3 mr-1" />
                        {statistics.totalVariantTemplates} Variant Template{statistics.totalVariantTemplates !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </div>

            {/* Product Type Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Basic Info Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Name</div>
                            <div className="font-medium">{productType.productTypeName}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Slug</div>
                            <div className="font-mono text-sm">{productType.slug}</div>
                        </div>
                        {productType.description && (
                            <div>
                                <div className="text-xs text-muted-foreground">Description</div>
                                <div className="text-sm">{productType.description}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Statistics Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Variant Statistics</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Total Templates</span>
                            <span className="font-medium">{statistics.totalVariantTemplates}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Required</span>
                            <span className="font-medium text-red-600">{statistics.requiredVariants}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Optional</span>
                            <span className="font-medium text-blue-600">{statistics.optionalVariants}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Total Options</span>
                            <span className="font-medium">{statistics.totalVariantOptions}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Hierarchy Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Category Hierarchy</CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {category && (
                            <div>
                                <div className="text-xs text-muted-foreground">Category</div>
                                <div className="font-medium">{category.categoryName}</div>
                            </div>
                        )}
                        {subcategory && (
                            <div>
                                <div className="text-xs text-muted-foreground">Subcategory</div>
                                <div className="font-medium">{subcategory.subCategoryName}</div>
                            </div>
                        )}
                        <div>
                            <div className="text-xs text-muted-foreground">Product Type</div>
                            <div className="font-medium">{productType.productTypeName}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Metadata Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Metadata</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Created</div>
                            <div className="text-sm">{formatDate(productType.$createdAt)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Updated</div>
                            <div className="text-sm">{formatDate(productType.$updatedAt)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">ID</div>
                            <div className="font-mono text-xs">{productType.$id}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Variant Templates & Options Section with Streaming */}
            <VariantTemplatesOptionsSection productTypeId={productTypeId} />

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Product Management</CardTitle>
                        <CardDescription>
                            Manage products of this type
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href={`/admin/products?productTypeId=${productTypeId}`}>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                View Products
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href={`/admin/products/create?productTypeId=${productTypeId}`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Product
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Analytics</CardTitle>
                        <CardDescription>
                            View insights and reports
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Performance Analytics
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            <Activity className="h-4 w-4 mr-2" />
                            Variant Usage Report
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Configuration</CardTitle>
                        <CardDescription>
                            Advanced settings and tools
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Configuration
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/admin/sys-admin/catalog/variant-templates" target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Global Templates
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}