import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { VirtualStoreTypes } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { StoreQuickActions } from './store-actions';

export const StoreCard = ({ store }: VirtualStoreTypes) => {
    const primaryBannerUrl = Array.isArray(store.bannerUrls) ?
        store.bannerUrls[0] :
        store.bannerUrls[0];

    return (
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className='bg-muted-foreground text-white rounded-full border-2 w-fit absolute z-30 top-0 right-5'>
                <StoreQuickActions storeId={store.$id} />
            </div>
            <Link href={`/stores/${store.$id}`}>
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