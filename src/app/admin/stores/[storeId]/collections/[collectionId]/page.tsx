import { CollectionGroupManager } from '@/features/collections/components/collection-group-manager';
import { getAuthState } from '@/lib/user-permission';
import { redirect } from 'next/navigation';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import { DeleteCollectionButton } from '@/features/collections/components/delete-collection-button';
import { Suspense } from 'react';
import { getCollectionById } from '@/lib/actions/collections-actions';
import { ProductSekeleton } from '@/features/products/components/products-list-sekeleton';
import { CollectionProducts } from '@/features/collections/components/collection-products';

async function CollectionPage({
    params
}: {
    params: Promise<{ collectionId: string, storeId: string }>;
}) {
    const { collectionId, storeId } = await params;
    
    const collectionData = await getCollectionById({ collectionId, withGroups: true });

    if (!collectionData) {
        redirect('/collections');
    }

    const {
        user
    } = await getAuthState();

    if (!user) {
        redirect('/sign-in');
    }

    // const productsData = await getVirtualStoreProducts({
    //     virtualStoreId: storeId,
    //     limit: 2,
    //     page,
    //     search: search || undefined
    // });

    // const products = productsData?.documents || [];
    // const totalPages = productsData?.totalPages || 0;
    // const totalProducts = productsData?.total || 0;

    return (
        <div className="container mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <CardTitle className="text-2xl font-bold">
                            {collectionData.collectionName}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground flex gap-2 items-center">
                            Collection Type: {collectionData.type}
                            {collectionData.featured && <span className="ml-2 p-1 bg-primary/10 text-primary rounded text-xs">Featured</span>}
                            <DeleteCollectionButton
                                collection={collectionData}
                                storeId={storeId}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {collectionData.bannerImageUrl && (
                        <div className="w-full h-48 md:h-64 relative mb-6 rounded-md overflow-hidden">
                            <Image
                                src={collectionData.bannerImageUrl}
                                alt={collectionData.collectionName}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    {collectionData.description && (
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-2">Description</h3>
                            <p className="text-muted-foreground">{collectionData.description}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {collectionData.type === 'grouped' ? (
                <CollectionGroupManager
                    collectionId={collectionId}
                    initialGroups={collectionData?.groupsData || []}
                    storeId={storeId}
                />
            ) : (
                <Suspense fallback={<ProductSekeleton />}>
                    <CollectionProducts 
                        collectionId={collectionId}
                        virtualStoreId={storeId}
                        // storeId={storeId}
                        collectionName={collectionData.collectionName}
                        collectionType={collectionData.type}
                        // initialProducts={products}
                        // initialTotalPages={totalPages}
                        // initialTotal={totalProducts}
                        alreadySelectedProducts={collectionData.productsIds || []}
                    />
                </Suspense>
            )}
        </div>
    );
}

export default CollectionPage;