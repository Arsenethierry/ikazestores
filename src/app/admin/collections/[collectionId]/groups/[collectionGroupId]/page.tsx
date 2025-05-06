import { getCollectionById } from '@/features/collections/actions/collections-actions';
import { getAuthState } from '@/lib/user-label-permission';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import { CollectionGroupsTypes } from '@/lib/types';
import SpinningLoader from '@/components/spinning-loader';
import { CollectionProducts } from '@/features/collections/components/collection-products';

async function CollectionGroupPage({
    params,
}: {
    params: Promise<{ collectionId: string, storeId: string, collectionGroupId: string }>;
}) {
    const { collectionId, storeId, collectionGroupId } = await params;

    const collectionData = await getCollectionById({ collectionId, withGroups: true });

    const { user } = await getAuthState();

    if (!user) {
        redirect('/sign-in');
    }

    if (!collectionData) {
        redirect(`/admin/stores/${storeId}/collections`);
    }

    const currentGroup = collectionData.groupsData?.find((group: CollectionGroupsTypes) => group.$id === collectionGroupId) as CollectionGroupsTypes
    if (!currentGroup) {
        redirect(`/admin/stores/${storeId}/collections/${collectionId}`);
    }

    const alreadyAddedProductsIds = currentGroup.productsIds;

    return (
        <div className="container mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <CardTitle className="text-2xl font-bold">
                            {currentGroup.groupName}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Group in: {collectionData.collectionName}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {currentGroup.groupImageUrl && (
                        <div className="w-full h-48 md:h-64 relative mb-6 rounded-md overflow-hidden">
                            <Image
                                src={currentGroup.groupImageUrl}
                                alt={currentGroup.groupName}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Suspense fallback={<SpinningLoader />}>
                <CollectionProducts
                    collectionName={collectionData.collectionName}
                    collectionType='grouped'
                    virtualStoreId={storeId}
                    collectionId={collectionId}
                    currentGroupId={currentGroup.$id}
                    alreadySelectedProducts={alreadyAddedProductsIds}
                />
            </Suspense>
        </div>
    );
}

export default CollectionGroupPage;