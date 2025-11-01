import { getVirtualStoreProducts } from "@/lib/actions/affiliate-product-actions";
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientVirtualProductCard } from "../product-cards/client-virtual-product-card";
import { VirtualProductTypes } from "@/lib/types";

interface RelatedProductsProps {
    productId: string;
    virtualStoreId: string;
    categoryId?: string;
}

async function RelatedProductsContent({
    productId,
    virtualStoreId,
    categoryId
}: RelatedProductsProps) {

    const storeProductsResult = await getVirtualStoreProducts(
        virtualStoreId,
        {
            limit: 8,
            offset: 0,
            orderBy: "$createdAt",
            orderType: "desc",
        }
    );

    if (!storeProductsResult.documents) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No related products found
            </div>
        );
    }

    const storeProducts = storeProductsResult.documents;

    // Filter out current product and limit to 4
    const fromSameStore = storeProducts
        .filter(p => p.$id !== productId)
        .slice(0, 4);

    // Get products from same category (if categoryId provided)
    const similarProducts = categoryId
        ? storeProducts
            .filter(p => p.$id !== productId && p.categoryId === categoryId)
            .slice(0, 4)
        : [];

    return (
        <Tabs defaultValue="store" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="store">From This Store</TabsTrigger>
                <TabsTrigger value="similar">Similar Products</TabsTrigger>
            </TabsList>

            <TabsContent value="store" className="mt-6">
                {fromSameStore.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {fromSameStore.map((product: VirtualProductTypes) => (
                            <ClientVirtualProductCard
                                key={product.$id}
                                product={product}
                                // storeId prop is optional - product already contains virtualStore data
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        No other products from this store
                    </p>
                )}
            </TabsContent>

            <TabsContent value="similar" className="mt-6">
                {similarProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {similarProducts.map((product: VirtualProductTypes) => (
                            <ClientVirtualProductCard
                                key={product.$id}
                                product={product}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        No similar products found
                    </p>
                )}
            </TabsContent>
        </Tabs>
    );
}

export const RelatedProducts = (props: RelatedProductsProps) => {
    return (
        <Card className="my-8">
            <CardHeader>
                <CardTitle>You May Also Like</CardTitle>
            </CardHeader>
            <CardContent>
                <Suspense fallback={
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded" />
                        ))}
                    </div>
                }>
                    <RelatedProductsContent {...props} />
                </Suspense>
            </CardContent>
        </Card>
    );
};