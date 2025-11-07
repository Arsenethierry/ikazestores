import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DiscountModel } from '@/lib/models/DiscountModel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Percent, Tag, Settings, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DiscountProductsManager } from '@/features/marketing/discount-products-manager';

interface PageProps {
    params: Promise<{
        storeId: string;
        discountId: string;
    }>;
}

async function DiscountDetails({ discountId }: { discountId: string }) {
    const discountModel = new DiscountModel();
    const discount = await discountModel.getDiscountById(discountId);

    if (!discount) {
        notFound();
    }

    const getDiscountTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'percentage': 'Percentage Off',
            'fixed_amount': 'Fixed Amount Off',
            'buy_x_get_y': 'Buy X Get Y',
            'bundle': 'Bundle Discount',
        };
        return labels[type] || type;
    };

    const getApplicableToLabel = (applicableTo: string) => {
        const labels: Record<string, string> = {
            'products': 'Specific Products',
            'categories': 'Product Categories',
            'collections': 'Product Collections',
            'store_wide': 'Store Wide',
        };
        return labels[applicableTo] || applicableTo;
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-base mt-1">{discount.name}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="text-base mt-1">{getDiscountTypeLabel(discount.discountType)}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Applies To</label>
                    <p className="text-base mt-1">{getApplicableToLabel(discount.applicableTo)}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <p className="text-base mt-1">{discount.priority}</p>
                </div>
            </div>

            {discount.description && (
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-base mt-1">{discount.description}</p>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Discount Value</label>
                    <p className="text-2xl font-bold mt-1">
                        {discount.discountType === 'percentage'
                            ? `${discount.value}%`
                            : `RWF ${discount.value.toLocaleString()}`
                        }
                    </p>
                </div>

                {discount.maxDiscountAmount && discount.discountType === 'percentage' && (
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">
                            Maximum Discount Cap
                        </label>
                        <p className="text-2xl font-bold mt-1">
                            RWF {discount.maxDiscountAmount.toLocaleString()}
                        </p>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="text-base mt-1">
                        {new Date(discount.startDate).toLocaleDateString()}
                    </p>
                </div>
                {discount.endDate && (
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">End Date</label>
                        <p className="text-base mt-1">
                            {new Date(discount.endDate).toLocaleDateString()}
                        </p>
                    </div>
                )}
            </div>

            {(discount.usageLimit || discount.usageLimitPerCustomer) && (
                <div className="grid gap-4 md:grid-cols-2">
                    {discount.usageLimit && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Total Usage Limit
                            </label>
                            <p className="text-base mt-1">
                                {discount.currentUsageCount || 0} / {discount.usageLimit}
                            </p>
                        </div>
                    )}
                    {discount.usageLimitPerCustomer && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Per Customer Limit
                            </label>
                            <p className="text-base mt-1">{discount.usageLimitPerCustomer}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DiscountDetailsSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default async function DiscountEditPage({ params }: PageProps) {
    const { storeId, discountId } = await params;

    // Fetch discount for header info
    const discountModel = new DiscountModel();
    const discount = await discountModel.getDiscountById(discountId);

    if (!discount) {
        notFound();
    }

    return (
        <div className="container max-w-6xl py-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{discount.name}</h1>
                        <p className="text-muted-foreground">
                            Manage your discount settings and assigned products
                        </p>
                    </div>
                    <Badge variant={discount.isActive ? 'default' : 'secondary'} className="h-7">
                        {discount.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-4 pt-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs">Discount Value</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-primary" />
                                <span className="text-2xl font-bold">
                                    {discount.discountType === 'percentage'
                                        ? `${discount.value}%`
                                        : `${discount.value.toLocaleString()}`
                                    }
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs">Usage</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-blue-600" />
                                <span className="text-2xl font-bold">
                                    {discount.currentUsageCount || 0}
                                </span>
                                {discount.usageLimit && (
                                    <span className="text-xs text-muted-foreground">
                                        / {discount.usageLimit}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs">Products</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4 text-green-600" />
                                <span className="text-2xl font-bold">
                                    {discount.applicableTo === 'store_wide'
                                        ? 'All'
                                        : discount.targetIds?.length || 0
                                    }
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs">Status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-medium">
                                    {discount.endDate
                                        ? new Date(discount.endDate) > new Date()
                                            ? 'Active'
                                            : 'Expired'
                                        : 'No expiry'
                                    }
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Separator />

            {/* Main Content */}
            <Tabs defaultValue="details" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="products">
                        Products
                        {discount.applicableTo === 'products' && (
                            <Badge variant="secondary" className="ml-2 h-5">
                                {discount.targetIds?.length || 0}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Discount Information</CardTitle>
                            <CardDescription>
                                Basic information about this discount
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<DiscountDetailsSkeleton />}>
                                <DiscountDetails discountId={discountId} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="products" className="space-y-6">
                    <Suspense
                        fallback={
                            <Card>
                                <CardContent className="py-8">
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        }
                    >
                        {/* THIS IS THE KEY COMPONENT - Real database integration */}
                        <DiscountProductsManager
                            discountId={discountId}
                            storeId={storeId}
                            applicableTo={discount.applicableTo}
                        />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}