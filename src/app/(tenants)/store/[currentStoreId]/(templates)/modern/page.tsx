import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import { StoreProductsList } from '@/features/products/components/store-products-list';
import SpinningLoader from '@/components/spinning-loader';

export const revalidate = 3600; // 1 hour
export const dynamic = 'force-static';

export default async function ModernHomePage({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}) {
    const { currentStoreId } = await params;
    const store = await getVirtualStoreById(currentStoreId);

    if (!store) notFound();

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="relative h-[500px] rounded-lg overflow-hidden">
                {store.bannerUrls?.[0] && (
                    <img
                        src={store.bannerUrls[0]}
                        alt={store.storeName}
                        className="w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                        <h1 className="text-5xl font-bold mb-4">{store.storeName}</h1>
                        <p className="text-xl">{store.storeBio || store.desccription}</p>
                    </div>
                </div>
            </section>

            {/* Products */}
            <section>
                <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
                <Suspense fallback={<SpinningLoader />}>
                    <StoreProductsList storeId={currentStoreId} />
                </Suspense>
            </section>
        </div>
    );
}
