import { NoItemsCard } from '@/components/no-items-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCollectionById } from '@/lib/actions/collections-actions';
import { CollectionProducts } from '@/features/collections/components/collection-products';
import { CollectionGroupsTypes } from '@/lib/types';
import Image from 'next/image';
import React from 'react';

async function page({ params }: {
    params: Promise<{ collectionId: string, currentStoreId: string }>
}) {
    const { collectionId, currentStoreId } = await params;
    if (!collectionId) return;
    const collectionData = await getCollectionById({ collectionId, withGroups: true });
    if (!collectionData) return <NoItemsCard />

    return (
        <div className="container mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <CardTitle className="text-2xl font-bold">
                            {collectionData.collectionName}
                        </CardTitle>
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
            {(collectionData.type === 'grouped' && collectionData.groupsData.length > 0) ? (
                collectionData.groupsData.map((group: CollectionGroupsTypes) => (
                    <div key={group.$id}>
                        {group.groupImageUrl ? (
                            <div className="h-48 md:h-64 w-56 md:w-64 relative mb-6 rounded-md overflow-hidden">
                                <Image
                                    src={group.groupImageUrl}
                                    alt={group.groupName || ''}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : <Skeleton className='h-48 md:h-64 w-56 md:w-64' />}

                        <p className='text-sm md:text-lg font-semibold'>{group.groupName}</p>
                    </div>
                ))
            ) : (
                <CollectionProducts
                    collectionId={collectionId}
                    collectionName={collectionData.collectionName}
                    collectionType={collectionData.type}
                    virtualStoreId={currentStoreId}
                />
            )}
        </div>
    );
}

export default page;