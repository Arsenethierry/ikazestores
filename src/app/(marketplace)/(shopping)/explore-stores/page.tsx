import { StoreCard } from '@/features/stores/components/store-card';
import { getAllVirtualStores } from '@/lib/actions/vitual-store.action';
import { getAuthState } from '@/lib/user-permission';
import React from 'react';

async function ExploreStoresPage() {
    const virtualStores = await getAllVirtualStores({ withProducts: true });
    const { user } = await getAuthState();

    return (
        <div className='main-container py-5 xl:py-10'>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">            {virtualStores && virtualStores.total > 0 && virtualStores.documents.map((store) => (
                <StoreCard
                    store={store}
                    key={store.$id}
                    currentUser={user}
                />
            ))}
            </div>
        </div>
    );
}

export default ExploreStoresPage;