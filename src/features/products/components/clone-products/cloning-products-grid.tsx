import { CurrentUserType } from "@/lib/types";
import { CloneProductCard } from "./clone-product-card";
import { NoItemsCard } from "@/components/no-items-card";
import { Package, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface ProductsGridProps {
    products: any[];
    virtualStoreId: string;
    user: CurrentUserType;
}

export function CloningProductsGrid({ products, virtualStoreId, user }: ProductsGridProps) {
    if (!products || !Array.isArray(products)) {
        return (
            <NoItemsCard
                title="Error loading products"
                description="There was a problem loading the products. Please try again."
                icon={<Package className="h-12 w-12" />}
            />
        );
    }

    const alreadyClonedProducts = products.filter(
        (product) => product?.vitualProducts && product.vitualProducts.length > 0
    );
    const availableProducts = products.filter(
        (product) => !product?.vitualProducts || product.vitualProducts.length === 0
    );

    if (products.length === 0) {
        return (
            <NoItemsCard
                title="No products found"
                description="Try adjusting your filters or search terms to find products to clone into your virtual store"
                icon={<Package className="h-12 w-12" />}
            />
        );
    }

    return (
        <div className="space-y-8">
            {/* Info Alert */}
            <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                    <span className="font-semibold">Found {products.length} product{products.length !== 1 ? 's' : ''}</span>
                    {alreadyClonedProducts.length > 0 && (
                        <span className="ml-2">
                            • {alreadyClonedProducts.length} already cloned
                        </span>
                    )}
                    {availableProducts.length > 0 && (
                        <span className="ml-2">
                            • {availableProducts.length} available to clone
                        </span>
                    )}
                </AlertDescription>
            </Alert>

            {/* Available Products Section */}
            {availableProducts.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Available Products
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Products you haven't cloned yet
                            </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {availableProducts.length} product{availableProducts.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {availableProducts.map((product) => (
                            <CloneProductCard
                                key={product.$id}
                                product={product}
                                virtualStoreId={virtualStoreId}
                                user={user}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Already Cloned Products Section */}
            {alreadyClonedProducts.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Already Cloned
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Products you've already added to your store
                            </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {alreadyClonedProducts.length} product{alreadyClonedProducts.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {alreadyClonedProducts.map((product) => (
                            <div key={product.$id} className="relative">
                                <CloneProductCard
                                    product={product}
                                    virtualStoreId={virtualStoreId}
                                    user={user}
                                />
                                <div className="absolute inset-0 bg-green-500/5 rounded-lg pointer-events-none" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Clone Summary</h4>
                                <p className="text-sm text-gray-600">
                                    You've cloned {alreadyClonedProducts.length} out of {products.length} products
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                                {products.length > 0 
                                    ? Math.round((alreadyClonedProducts.length / products.length) * 100)
                                    : 0}%
                            </div>
                            <p className="text-xs text-gray-600">Completion Rate</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}