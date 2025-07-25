import { NoItemsCard } from '@/components/no-items-card';
import { getUserSavedItems } from '@/hooks/queries-and-mutations/saved-items-action';
import { getVirtualProductById } from '@/lib/actions/virtual-products-actions';
import { VirtualProductCard } from '@/features/products/components/product-cards/virtual-product-card';
import { getAuthState } from '@/lib/user-permission';
import { redirect } from 'next/navigation';
import React from 'react';

async function SavedItemsPage() {
    const { user } = await getAuthState();
    if (!user) {
        redirect('/sign-in?redirectUrl/saved-items');
    };
    const savedItemsResult = await getUserSavedItems(user.$id);

    const savedProducts = await Promise.all(
        savedItemsResult.documents.map(async (savedItem) => {
            const product = await getVirtualProductById(savedItem.productId);
            return {
                savedItemId: savedItem.$id,
                product: product.data
            };
        })
    );

    const validSavedProducts = savedProducts.filter(item => item.product !== null);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Your Saved Items</h1>
            {validSavedProducts.length === 0 ? (
                <NoItemsCard />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {validSavedProducts.map(({ product }) => (
                        product && <VirtualProductCard
                            product={product}
                            key={product.$id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default SavedItemsPage;