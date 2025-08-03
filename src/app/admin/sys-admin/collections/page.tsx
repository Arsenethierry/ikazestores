import { AccessDeniedCard } from '@/components/access-denied-card';
import { NoItemsCard } from '@/components/no-items-card';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllCollectionsByStoreId } from '@/lib/actions/collections-actions';
import { DeleteCollectionButton } from '@/features/collections/components/delete-collection-button';
import { getAuthState } from '@/lib/user-permission';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

async function CollectionsPage() {
    const collections = await getAllCollectionsByStoreId({ storeId: null });

    const {
        isSystemAdmin,
        user
    } = await getAuthState();

    if (!user) {
        redirect('/sign-in')
    }

    if (!isSystemAdmin) {
        return <AccessDeniedCard message='Only system admins' />
    }

    return (
        <div className='w-full max-w-7xl space-y-5'>
            <div className='flex justify-between items-center'>
                <h3 className='text-lg font-semibold'>All Categories</h3>
                {(isSystemAdmin) && (
                    <Link href={`/admin/collections/new`} className={buttonVariants()}>
                        Create new collections
                    </Link>
                )}
            </div>
            {collections.total === 0 ? (
                <NoItemsCard />
            ) : (
                collections.documents.map(collectionData => (
                    <Card key={collectionData.$id}>
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
                                        storeId={null}
                                        isSystemAdmin={isSystemAdmin}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <Link href={`/admin/collections/${collectionData.$id}`}>
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
                        </Link>
                    </Card>
                ))
            )
            }
        </div >
    )
}

export default CollectionsPage;