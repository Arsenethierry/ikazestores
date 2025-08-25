import { NoItemsCard } from "@/components/no-items-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SavedProductsList } from "@/features/products/components/saved-products-list";
import { getUserSavedItems } from "@/hooks/queries-and-mutations/saved-items-action";
import { getVirtualProductById } from "@/lib/actions/affiliate-product-actions";
import { getAuthState } from "@/lib/user-permission";
import { Heart } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface SavedProductWithDetails {
    savedItemId: string;
    product: any;
    savedAt: string;
}

async function SavedProductsContent({ userId }: { userId: string }) {
    const savedItemsResult = await getUserSavedItems(userId);

    const savedProducts: SavedProductWithDetails[] = await Promise.all(
        savedItemsResult.documents.map(async (savedItem) => {
            const product = await getVirtualProductById(savedItem.productId);
            return {
                savedItemId: savedItem.$id,
                product,
                savedAt: savedItem.$createdAt
            };
        })
    );

    const validSavedProducts = savedProducts.filter(item => item.product !== null);

    if (validSavedProducts.length === 0) {
        return <NoItemsCard />;
    }

    return <SavedProductsList products={validSavedProducts} />;
}

export default async function SavedItemsPage() {
    const { user } = await getAuthState();
    if (!user) {
        redirect('/sign-in?redirectUrl=/saved-items');
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <Heart className="h-8 w-8 text-red-500" />
                    <h1 className="text-3xl font-bold">Your Saved Items</h1>
                </div>
                <p className="text-gray-600">
                    Manage and organize your favorite products in one place
                </p>
            </div>

            <Suspense fallback={<SavedProductsSkeleton />}>
                <SavedProductsContent userId={user.$id} />
            </Suspense>
        </div>
    );
};

function SavedProductsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Statistics Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-20" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Skeleton className="h-8 w-12" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Controls Skeleton */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex flex-1 items-center gap-2">
                    <Skeleton className="h-10 flex-1 max-w-md" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                            <Skeleton className="h-48 w-full mb-4 rounded-md" />
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-6 w-1/4" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}