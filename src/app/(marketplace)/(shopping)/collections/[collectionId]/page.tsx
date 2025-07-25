import { NoItemsCard } from '@/components/no-items-card';
import { CollectionGroupPaginationComponent } from '@/features/collections/collection-group-pagination';
import SpinningLoader from '@/components/spinning-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCollectionById } from '@/lib/actions/collections-actions';
import { CollectionGroups } from '@/features/collections/components/collection-groups';
import { CollectionProducts } from '@/features/collections/components/collection-products';
import { CollectionGroupsTypes } from '@/lib/types';
import Image from 'next/image';
import React, { Suspense } from 'react';

async function page({ params, searchParams }: {
    params: Promise<{ collectionId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { collectionId } = await params;
    if (!collectionId) return;
    const { page = '1', limit = '4' } = await searchParams

    const currentPage = Number(page) || 1;
    const pageSize = Number(limit) || 4;

    const collectionData = await getCollectionById({ collectionId, withGroups: true });
    if (!collectionData) return <NoItemsCard />;

    const paginateGroups = (groups: CollectionGroupsTypes[], page: number, size: number) => {
        if (!groups || groups.length === 0) return { groupsToShow: [], totalGroups: 0, totalPages: 0 };

        const start = (page - 1) * size;
        const end = start + size;
        const groupsToShow = groups.slice(start, end);
        const totalGroups = groups.length;
        const totalPages = Math.ceil(totalGroups / size);

        return { groupsToShow, totalGroups, totalPages };
    };

    const { groupsToShow, totalPages } =
        collectionData.type === 'grouped' && collectionData.groupsData?.length
            ? paginateGroups(collectionData.groupsData, currentPage, pageSize)
            : { groupsToShow: [], totalPages: 0 };

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

            {(collectionData.type === 'grouped' && groupsToShow.length > 0) ? (
                <>
                    <CollectionGroups
                        groups={groupsToShow}
                        collectionId={collectionData.$id}
                    />

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                            <Suspense fallback={<SpinningLoader />}>
                                <CollectionGroupPaginationComponent
                                    totalPages={totalPages}
                                    currentPage={currentPage}
                                />
                            </Suspense>
                        </div>
                    )}
                </>
            ) : (
                <CollectionProducts
                    collectionId={collectionData.$id}
                    collectionType={collectionData.type}
                    virtualStoreId={null}
                    collectionName={collectionData.collectionName}
                />
            )}
        </div>
    );
}

export default page;