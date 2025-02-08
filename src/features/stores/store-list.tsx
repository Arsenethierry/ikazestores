import React from 'react';
import { StoreCard } from './components/store-card';
import { VirtualStoreTypes } from '@/lib/types';

function AllStoresList({ store: stores }: VirtualStoreTypes) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
                <StoreCard key={store.$id} store={store} />
            ))}
        </div>
    );
}

export default AllStoresList;