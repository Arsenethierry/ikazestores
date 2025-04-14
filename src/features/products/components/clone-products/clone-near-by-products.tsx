"use client";

import { CurrentUserType, OriginalProductTypes } from "@/lib/types";
import { Suspense } from "react";
import { ProductSekeleton } from "../products-list-sekeleton";
import { PhysicalProductCard } from "../product-cards/physical-product-card";
import { AlertCircle } from "lucide-react";
import { useGetNearByOriginalProducts } from "../../products-queries";

export const CloneNearByProducts = ({
    storeId,
    user,
    isSystemAdmin,
    isPhysicalStoreOwner,
    isVirtualStoreOwner
}: {
    storeId: string,
    isVirtualStoreOwner: boolean,
    isPhysicalStoreOwner: boolean,
    isSystemAdmin: boolean,
    user: CurrentUserType
}) => {
    const { data: products, isLoading, isFetching, error } = useGetNearByOriginalProducts();

    const isLocationError = error &&
        (error.message.includes("location") ||
            error.message.includes("permission") ||
            error.message.includes("denied") ||
            error.message.includes("position unavailable"));

    return (
        <div className="w-full max-w-7xl">
            {isLoading || isFetching ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    <ProductSekeleton />
                    <ProductSekeleton />
                    <ProductSekeleton />
                    <ProductSekeleton />
                </div>
            ) : isLocationError ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm max-w-5xl">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="text-amber-500" size={20} />
                        <h3 className="font-medium">Location Services Disabled</h3>
                    </div>
                    <p className="text-gray-700 mb-4">
                        We can&lsquo;t show nearby products because location access is disabled.
                        Please enable location services in your browser settings to see products near you.
                    </p>
                    <div className="mt-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            ) : error ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="text-red-500" size={20} />
                        <h3 className="font-medium">Error Loading Nearby Products</h3>
                    </div>
                    <p className="text-gray-700">
                        Something went wrong while loading nearby products. Please try again later.
                    </p>
                </div>
            ) : products && products.total === 0 ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                    <p className="text-gray-700">No products found in your area.</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-4">
                    {products && products.documents.map((product: OriginalProductTypes) => (
                        <div key={product.$id}>
                            <Suspense fallback={<ProductSekeleton />}>
                                <PhysicalProductCard
                                    product={product}
                                    storeId={storeId}
                                    user={user}
                                    isSystemAdmin={isSystemAdmin}
                                    isPhysicalStoreOwner={isPhysicalStoreOwner}
                                    isVirtualStoreOwner={isVirtualStoreOwner}
                                />
                            </Suspense>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}