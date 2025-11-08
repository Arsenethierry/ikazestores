import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getVirtualStoreById } from "@/lib/actions/virtual-store.action";
import { getStoreUrls } from "@/features/stores/store-domain-helper";
import { Metadata } from "next";
import { StoreDetailsContent, StoreDetailsSkeleton } from "@/features/stores/components/store-details-content";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}): Promise<Metadata> {
    const { currentStoreId } = await params;

    try {
        const store = await getVirtualStoreById(currentStoreId);

        if (!store) {
            return {
                title: "Store Not Found",
                description: "The requested store could not be found.",
            };
        }

        const { storeUrl } = getStoreUrls(store);

        return {
            title: `${store.storeName} - Store Details & Reviews`,
            description: store.desccription || `Learn more about ${store.storeName} and read customer reviews`,
            openGraph: {
                title: `${store.storeName} - Store Details`,
                description: store.desccription || `Discover ${store.storeName}`,
                type: "website",
                url: `${storeUrl}/details`,
                images: store.storeLogoUrl ? [store.storeLogoUrl] : [],
            },
        };
    } catch (error) {
        return {
            title: "Store Details",
            description: "View store information and reviews",
        };
    }
};

export default async function StoreDetailsPage({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}) {
    const { currentStoreId } = await params;

    const store = await getVirtualStoreById(currentStoreId);

    if (!store) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50/30">
            <Suspense fallback={<StoreDetailsSkeleton />}>
                <StoreDetailsContent storeId={currentStoreId} store={store} />
            </Suspense>
        </div>
    );
}