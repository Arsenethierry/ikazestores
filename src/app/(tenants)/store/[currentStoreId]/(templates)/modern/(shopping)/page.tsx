import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getVirtualStoreById } from "@/lib/actions/virtual-store.action";
import { Skeleton } from "@/components/ui/skeleton";
import { HotCategoriesSection, HotCategoriesSkeleton } from "../_components/home/hot-categories-section";
import { HeroCollectionsServerWrapper, DualHeroSkeleton } from "../_components/home/hero-collections-server-wrapper";
import { BestProductsServerWrapper, BestPicksSkeleton } from "../_components/home/best-products-server-wrapper";
import { getStoreUrls } from "@/features/stores/store-domain-helper";

export const revalidate = 43200;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}): Promise<Metadata> {
    const { currentStoreId } = await params;
    const store = await getVirtualStoreById(currentStoreId);

    if (!store) {
        return {
            title: "Store Not Found",
            description: "The requested store could not be found.",
        };
    }

    const { storeUrl } = getStoreUrls(store);

    return {
        title: `${store.storeName} - Premium Online Shopping`,
        description:
            store.desccription ||
            store.storeBio ||
            `Shop at ${store.storeName} for quality products. Worldwide shipping available.`,
        openGraph: {
            title: `${store.storeName} - Premium Online Shopping`,
            description:
                store.desccription ||
                store.storeBio ||
                `Discover amazing products at ${store.storeName}`,
            url: storeUrl,
            siteName: store.storeName,
            images: store.bannerUrls?.length
                ? [
                    {
                        url: store.bannerUrls[0],
                        width: 1200,
                        height: 630,
                        alt: store.storeName,
                    },
                ]
                : [],
            locale: store.locale || "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${store.storeName} - Premium Online Shopping`,
            description:
                store.desccription ||
                store.storeBio ||
                `Shop at ${store.storeName}`,
            images: store.bannerUrls?.length ? [store.bannerUrls[0]] : [],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
    };
}

export default async function ModernHomePage({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}) {
    const { currentStoreId } = await params;
    const store = await getVirtualStoreById(currentStoreId);

    if (!store) notFound();

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section with Collections Carousel + Ad */}
            <section className="container mx-auto px-4 py-8">
                <Suspense fallback={<DualHeroSkeleton />}>
                    <HeroCollectionsServerWrapper
                        storeId={currentStoreId}
                        storeName={store.storeName}
                    />
                </Suspense>
            </section>

            {/* Hot Categories Section */}
            <section className="container mx-auto px-4">
                <Suspense fallback={<HotCategoriesSkeleton />}>
                    <HotCategoriesSection storeId={currentStoreId} maxCategories={12} />
                </Suspense>
            </section>

            {/* Best of the Month / Newly Added Products */}
            <section className="container mx-auto px-4">
                <Suspense fallback={<BestPicksSkeleton />}>
                    <BestProductsServerWrapper storeId={currentStoreId} limit={4} />
                </Suspense>
            </section>
        </div>
    );
}