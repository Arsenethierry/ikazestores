import VSFooter from "@/features/stores/components/home-page/virtual-shop/footer";
import { StoreProductsList } from "@/features/products/components/store-products-list";
import { getQueryClient } from "@/lib/get-query-client";
import { getVirtualStoreById } from "@/lib/actions/vitual-store.action";
import { TenantHomeHeroSection } from "@/features/stores/components/home-page/tenant-homepage-hero-section";
import { Suspense } from "react";
import SpinningLoader from "@/components/spinning-loader";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

function StoreErrorBoundary({
    storeId
}: {
    storeId: string;
}) {
    return (
        <>
            <div className="text-center py-12">
                <h3 className='text-3xl text-red-600 mb-4'>Error Loading Store</h3>
                <p className='text-gray-600'>
                    Unable to load store with ID: {storeId}
                </p>
                <p className='text-sm text-gray-500 mt-2'>
                    Please try refreshing the page or contact support if the problem persists.
                </p>
            </div>
        </>
    );
}

async function page({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}) {
    const { currentStoreId } = await params;
    const queryClient = getQueryClient();

    try {
        await queryClient.prefetchQuery({
            queryKey: ['virtualStore', currentStoreId],
            queryFn: () => getVirtualStoreById(currentStoreId),
        });

        return (
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<SpinningLoader />}>
                    <TenantHomeHeroSection currentStoreId={currentStoreId} />
                </Suspense>
                <StoreProductsList storeId={currentStoreId} />
                <VSFooter />
            </HydrationBoundary>
        )
    } catch (error) {
        console.error('Page error:', error);
        return <StoreErrorBoundary storeId={currentStoreId} />;
    }
}

export default page;