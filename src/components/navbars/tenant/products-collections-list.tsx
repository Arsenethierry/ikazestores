import { getAllCollectionsByStoreId } from '@/lib/actions/collections-actions';
import Link from 'next/link';
import React from 'react';

export const ProductsCollectionsList = async ({ currentStoreId = null }: { currentStoreId: string | null }) => {
    const collections = await getAllCollectionsByStoreId({ storeId: currentStoreId, limit: 5, featured: true });

    if (collections.total === 0 || !collections) return;
    return (
        collections.documents.map((collection) => (
            <Link href={`/collections/${collection.$id}`} key={collection.$id} className='hover:text-white/80 hover:underline capitalize'>{collection.collectionName}</Link>
        ))
    );
}