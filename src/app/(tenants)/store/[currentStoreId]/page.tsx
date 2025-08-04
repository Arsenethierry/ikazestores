import VSFooter from "@/features/stores/components/home-page/virtual-shop/footer";
import { StoreProductsList } from "@/features/products/components/store-products-list";
import { getQueryClient } from "@/lib/get-query-client";
import { getVirtualStoreById } from "@/lib/actions/virtual-store.action";
import { TenantHomeHeroSection } from "@/features/stores/components/home-page/tenant-homepage-hero-section";
import { Suspense } from "react";
import SpinningLoader from "@/components/spinning-loader";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { virtualStoreKeys } from "@/hooks/queries-and-mutations/query-keys";
import { notFound } from "next/navigation";
import { getStoreUrls } from "@/features/stores/store-domain-helper";

function SEOTags({ store, storeUrl }: { store: any; storeUrl: string }) {
    return (
        <>
            {/* Open Graph / Facebook */}
            <link rel="canonical" href={storeUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={storeUrl} />
            <meta property="og:title" content={`${store.storeName} - Premium Online Shopping Experience`} />
            <meta property="og:description" content={store.desccription || store.storeBio || `Discover amazing products at ${store.storeName}. Quality guaranteed, worldwide shipping available.`} />
            {store.bannerUrls && store.bannerUrls[0] && (
                <meta property="og:image" content={store.bannerUrls[0]} />
            )}
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:site_name" content={store.storeName} />
            <meta property="og:locale" content={store.locale || "en_US"} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={storeUrl} />
            <meta property="twitter:title" content={`${store.storeName} - Premium Online Shopping`} />
            <meta property="twitter:description" content={store.desccription || store.storeBio || `Shop at ${store.storeName} for quality products`} />
            {store.bannerUrls && store.bannerUrls[0] && (
                <meta property="twitter:image" content={store.bannerUrls[0]} />
            )}

            {/* Additional SEO Meta Tags */}
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <meta name="googlebot" content="index, follow" />
            <meta name="bingbot" content="index, follow" />
            <meta name="theme-color" content="#000000" />

            {/* Geographic targeting */}
            {store.operatingCountries && store.operatingCountries.length > 0 && (
                <>
                    <meta name="geo.region" content={store.operatingCountries.join(', ')} />
                    <meta name="distribution" content="global" />
                </>
            )}

            {/* E-commerce specific */}
            <meta name="product-type" content="marketplace" />
            <meta name="store-type" content="virtual" />
            <meta name="commerce-platform" content="dropshipping" />

            {/* Preconnect for performance */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={`//${storeUrl.split('//')[1]}`} />
        </>
    )
}

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

function StructuredData({ store, storeUrl, baseUrl }: { store: any; storeUrl: string; baseUrl: string }) {
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Store",
                "@id": `${storeUrl}#store`,
                "name": store.storeName,
                "description": store.desccription || store.storeBio || `${store.storeName} - Your trusted online store for quality products`,
                "url": storeUrl,
                "logo": store.storeLogoUrl ? {
                    "@type": "ImageObject",
                    "url": store.storeLogoUrl,
                    "width": 400,
                    "height": 400
                } : undefined,
                "image": store.bannerUrls && store.bannerUrls.length > 0 ? store.bannerUrls.map((url: string) => ({
                    "@type": "ImageObject",
                    "url": url
                })) : undefined,
                "address": store.operatingCountries && store.operatingCountries.length > 0 ? {
                    "@type": "PostalAddress",
                    "addressCountry": store.operatingCountries
                } : undefined,
                "foundingDate": store.$createdAt,
                "sameAs": [
                    storeUrl
                ]
            },
            {
                "@type": "WebSite",
                "@id": `${storeUrl}#website`,
                "url": storeUrl,
                "name": `${store.storeName} - Online Store`,
                "description": store.desccription || store.storeBio || `Shop at ${store.storeName} for quality products with worldwide shipping`,
                "publisher": {
                    "@id": `${storeUrl}#store`
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": `${storeUrl}/search?q={search_term_string}`
                    },
                    "query-input": "required name=search_term_string"
                }
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${storeUrl}#breadcrumb`,
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": baseUrl
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": store.storeName,
                        "item": storeUrl
                    }
                ]
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(structuredData, null, 2)
            }}
        />
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
            queryKey: virtualStoreKeys.detail(currentStoreId),
            queryFn: () => getVirtualStoreById(currentStoreId),
        });

        const store = await getVirtualStoreById(currentStoreId);

        if (!store) {
            notFound();
        }

        const { baseUrl, storeUrl } = getStoreUrls(store);

        return (
            <>
                {/* SEO Components */}
                <SEOTags store={store} storeUrl={storeUrl} />
                <StructuredData store={store} storeUrl={storeUrl} baseUrl={baseUrl} />

                <HydrationBoundary state={dehydrate(queryClient)}>
                    <main role="main">
                        <section aria-label="Store Hero Section">
                            <Suspense fallback={<SpinningLoader />}>
                                <TenantHomeHeroSection currentStoreId={currentStoreId} />
                            </Suspense>
                        </section>

                        <section aria-label="Store Products" className="py-8">
                            <h2 className="sr-only">Our Products</h2>
                            <StoreProductsList storeId={currentStoreId} />
                        </section>
                    </main>

                    {/* Footer */}
                    <VSFooter />
                </HydrationBoundary>
            </>
        )
    } catch (error) {
        console.error('Page error:', error);
        return <StoreErrorBoundary storeId={currentStoreId} />;
    }
}

export default page;