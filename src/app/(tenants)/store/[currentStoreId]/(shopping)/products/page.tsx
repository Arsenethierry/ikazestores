// import { getAllCategoriesByStoreId } from '@/features/categories/actions/categories-actions';
// import React, { Suspense } from 'react';
// import ProductPage from './product-page';
// import { SearchParams } from 'nuqs';
// import { ProductListSkeleton } from '@/features/products/components/products-list-sekeleton';
// import { FilterSidebar } from '@/features/products/components/filter-side-bar';
// import { SortControl } from '@/features/products/components/sort-controls';

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// import { getAllProductTypes } from "@/features/products/actions/variants management/product-types-actions";
import { ProductListWithFilters } from "@/features/products/components/filter/product-list-with-filters";
import { getVirtualStoreById } from "@/lib/actions/virtual-store.action";
import { AlertTriangle, Package, Store } from "lucide-react";
// import { Metadata } from "next";
// import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SearchParams } from "nuqs";
// import { notFound } from "next/navigation";
import { Suspense } from "react";

// async function page(
//     props: {
//         params: Promise<{ currentStoreId: string }>,
//         searchParams: Promise<SearchParams>
//     }
// ) {
//     const searchParams = await props.searchParams;
//     const { currentStoreId } = await props.params;
//     const queries = await searchParams
//     const categories = await getAllCategoriesByStoreId({ storeId: currentStoreId });

//     return (
//         <div className='flex gap-4 main-container py-5'>
//             <aside className='w-64 shrink-0'>
//                 <FilterSidebar categories={categories.documents} />
//             </aside>
//             <section>
//                 <SortControl />
//                 <div className='flex-1 flex flex-wrap gap-2 p-5'>
//                     <Suspense fallback={<ProductListSkeleton />}>
//                         <ProductPage currentStoreId={currentStoreId} searchParams={queries} />
//                     </Suspense>
//                 </div>
//             </section>
//         </div>
//     );
// }

// export default page;

// interface StoreProductsPageProps {
//     params: {
//         storeId: string;
//     };
//     searchParams: {
//         productType?: string;
//         category?: string;
//         search?: string;
//         sortBy?: string;
//         page?: string;
//         limit?: string;
//         minPrice?: string;
//         maxPrice?: string;
//         [key: string]: string | undefined;
//     }
// }

// export async function generateMetadata({
//     params,
//     searchParams,
// }: StoreProductsPageProps): Promise<Metadata> {
//     try {
//         const storeResponse = await getVirtualStoreById(params.storeId);
//         const store = storeResponse?.documents?.[0];
//         const storeName = store?.name || "Store";

//         const title = searchParams.search
//             ? `Search: ${searchParams.search} - ${storeName}`
//             : searchParams.category
//                 ? `${searchParams.category} - ${storeName}`
//                 : `Products - ${storeName}`;

//         const description = searchParams.search
//             ? `Search results for "${searchParams.search}" in ${storeName}`
//             : searchParams.category
//                 ? `Browse ${searchParams.category} products in ${storeName}`
//                 : `Discover amazing products from ${storeName}`;

//         return {
//             title,
//             description,
//             openGraph: {
//                 title,
//                 description,
//                 type: 'website',
//                 siteName: storeName
//             },
//             robots: {
//                 index: true,
//                 follow: true,
//             },
//         };
//     } catch (error) {
//         console.error('Error generating metadata:', error);
//         return {
//             title: "Products",
//             description: "Browse our product catalog",
//         };
//     }
// }

export default async function StoreProductsPage(
    props: {
        params: Promise<{ currentStoreId: string }>,
        searchParams: Promise<SearchParams>
    }
) {
    const searchParams = await props.searchParams;
    const { currentStoreId } = await props.params;

    return (
        <div className="min-h-screen bg-gray-50/30">
            <Suspense fallback={<StoreProductsPageSkeleton />}>
                <StoreProductsContent
                    storeId={currentStoreId}
                    searchParams={searchParams}
                />
            </Suspense>
        </div>
    )
}

async function StoreProductsContent({
    storeId,
    searchParams
}: {
    storeId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchParams: any;
}) {
    try {
        const store = await getVirtualStoreById(storeId);

        if (!store) {
            // notFound();
            <p>no store</p>
        }

        // const productTypesResponse = await getAllProductTypes(storeId);
        // const productTypes = productTypesResponse?.documents || [];

        return (
            <>
                <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-b">
                    <div className="container mx-auto py-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                {store?.storeLogoUrl ? (
                                    <Image
                                        src={store.storeLogoUrl}
                                        alt={store.storeName}
                                        width={100}
                                        height={100}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                ) : (
                                    <Store className="w-12 h-12 text-primary" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {store?.storeName}
                                </h1>
                                {store?.description && (
                                    <p className="text-lg text-muted-foreground mt-1">
                                        {store?.descriptiont}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                                {searchParams.search ? (
                                    <>
                                        Search results for{" "}
                                        <span className="text-primary">&ldquo;{searchParams.search}&quot;</span>
                                    </>
                                ) : searchParams.category ? (
                                    <>
                                        {searchParams.category}{" "}
                                        <span className="text-muted-foreground">Products</span>
                                    </>
                                ) : (
                                    "Our Product Catalog"
                                )}
                            </h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                {searchParams.search
                                    ? "Browse through our curated collection based on your search"
                                    : searchParams.category
                                        ? `Explore our wide range of ${searchParams.category.toLowerCase()} products`
                                        : "Discover our carefully curated selection of products"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto py-4">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-1 md:space-x-3">
                            <li className="flex items-center">
                                <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary">
                                    {store?.storeName}
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="mx-2 text-gray-400">/</span>
                                    <span className="text-sm font-medium text-gray-700">
                                        Products
                                    </span>
                                </div>
                            </li>
                            {searchParams.category && (
                                <li>
                                    <div className="flex items-center">
                                        <span className="mx-2 text-gray-400">/</span>
                                        <span className="text-sm font-medium text-primary">
                                            {searchParams?.category}
                                        </span>
                                    </div>
                                </li>
                            )}
                        </ol>
                    </nav>
                </div>

                {(store?.vitualProducts || store?.rating || store?.totalOrders) && (
                    <div className="container mx-auto pb-6">
                        <div className="flex justify-center">
                            <div className="flex items-center gap-8 text-sm text-muted-foreground">
                                {store?.totalProducts && (
                                    <div className="flex items-center gap-1">
                                        <Package className="h-4 w-4" />
                                        <span>{store?.totalProducts} Products</span>
                                    </div>
                                )}
                                {store?.rating && (
                                    <div className="flex items-center gap-1">
                                        <span>⭐</span>
                                        <span>{store?.rating} Rating</span>
                                    </div>
                                )}
                                {store?.totalOrders && (
                                    <div className="flex items-center gap-1">
                                        <span>🛍️</span>
                                        <span>{store?.totalOrders}+ Orders</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <ProductListWithFilters
                    storeId={storeId}
                    productType={searchParams.productType}
                    category={searchParams.category}
                    className="pb-12"
                />
            </>
        )
    } catch (error) {
        console.error('Error loading store products page:', error);
        return <StoreProductsErrorState error={error} storeId={storeId} />;
    }
}

function StoreProductsPageSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50/30">
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-b">
                <div className="container mx-auto py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                        <Skeleton className="h-8 w-64 mx-auto" />
                        <Skeleton className="h-4 w-96 mx-auto" />
                    </div>
                </div>
            </div>

            <div className="container mx-auto py-4">
                <div className="flex items-center space-x-1">
                    <Skeleton className="h-4 w-16" />
                    <span className="mx-2 text-gray-400">/</span>
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>

            <div className="container mx-auto py-6">
                <div className="flex gap-6">
                    <aside className="hidden lg:block w-80 flex-shrink-0">
                        <Card className="p-4">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-40 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-24" />
                                    <div className="space-y-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="flex items-center space-x-2">
                                                <Skeleton className="h-4 w-4" />
                                                <Skeleton className="h-4 w-20" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </aside>

                    <div className="flex-1 min-w-0">
                        <div className="space-y-6">
                            <Skeleton className="h-10 w-full" />
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-32" />
                                <div className="flex gap-3">
                                    <Skeleton className="h-9 w-48" />
                                    <div className="flex border rounded-md">
                                        <Skeleton className="h-9 w-9" />
                                        <Skeleton className="h-9 w-9" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <Card key={i} className="overflow-hidden">
                                        <Skeleton className="w-full h-48" />
                                        <div className="p-4 space-y-3">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                            <Skeleton className="h-5 w-16" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StoreProductsErrorState({
    error,
    storeId
}: {
    error: unknown;
    storeId: string;
}) {
    console.log(error)
    return (
        <div className="container mx-auto py-12">
            <Card className="p-12 text-center max-w-md mx-auto">
                <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Failed to Load Store Products
                        </h3>
                        <p className="text-muted-foreground mt-2">
                            We&apos;re having trouble loading this store&apos;s products. Please try again later.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Try Again
                        </button>
                        <a
                            href={`/store/${storeId}`}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Back to Store
                        </a>
                    </div>
                </div>
            </Card>
        </div>
    );
}