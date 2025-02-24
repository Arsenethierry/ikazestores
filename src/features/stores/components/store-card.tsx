import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { StoreTypes } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { StoreQuickActions } from './store-action-button';
import { getStoreSubdomainUrl } from '@/lib/domain-utils';
import { Badge } from '@/components/ui/badge';

export const StoreCard = ({ store, currentUser }: StoreTypes) => {
    const primaryBannerUrl = Array.isArray(store.bannerUrls) ?
        store.bannerUrls[0] :
        store.bannerUrls[0];

    const isStoreOwner = currentUser && currentUser?.$id === store.ownerId
    
    return (
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow max-w-[350px]">
            {isStoreOwner && (
                <div className='flex items-center gap-2 absolute z-30 top-1 right-2 w-fit'>
                    <Badge className='h-full'>{store?.storeType}</Badge>
                    <span className='bg-muted-foreground text-white rounded-full border-2'>
                        <StoreQuickActions store={store} currentUser={currentUser}/>
                    </span>
                </div>
            )}
            <Link href={store?.subDomain ? getStoreSubdomainUrl({ subdomain: store.subDomain }) : `/admin/stores/${store.$id}`} target={store?.subDomain ? '_blank' : '_parent'}>
                <CardHeader className="p-0">
                    {primaryBannerUrl ? (
                        <div className="relative h-48 w-full">
                            <Image
                                src={primaryBannerUrl}
                                alt={store.storeName}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    ) : (
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No banner available</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-4">
                    <h2 className="text-xl font-semibold mb-2">{store.storeName}</h2>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        Created: {new Date(store.$createdAt).toLocaleDateString()}
                    </span>
                </CardFooter>
            </Link>
        </Card>
    );
}