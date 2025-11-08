import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { StoreProductsList } from '@/features/products/components/store-products-list';
import SpinningLoader from '@/components/spinning-loader';

export const revalidate = 3600;
export const dynamic = 'force-static';

export default async function ClassicHomePage({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}) {
    const { currentStoreId } = await params;
    const store = await getVirtualStoreById(currentStoreId);

    if (!store) notFound();

    return (
        <div className="space-y-8">
            {/* Classic Banner */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 rounded-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">{store.storeName}</h1>
                    <p className="text-xl">{store.storeBio || 'Welcome to our store'}</p>
                </div>
            </section>

            {/* Products */}
            <section>
                <h2 className="text-2xl font-bold mb-6 border-b pb-2">Our Products</h2>
                <Suspense fallback={<SpinningLoader />}>
                    <StoreProductsList storeId={currentStoreId} />
                </Suspense>
            </section>
        </div>
    );
}