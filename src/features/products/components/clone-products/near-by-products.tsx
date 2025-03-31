"use client";

import { CurrentUserType, DocumentType } from "@/lib/types";
import { useGetNearByProducts } from "../../products-queries";
import { Suspense } from "react";
import { ProductSekeleton } from "../products-list-sekeleton";
import { PhysicalProductCard } from "../product-cards/physical-product-card";

export const NearByProducts = ({
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

    const { data: products, isLoading, isFetching } = useGetNearByProducts();

    return (
        <div className="w-full">
            {isLoading || isFetching ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    <ProductSekeleton />
                    <ProductSekeleton />
                    <ProductSekeleton />
                    <ProductSekeleton />
                </div>
            ) : products && products.total === 0 ? (
                <div className="p-4 bg-gray-100 rounded-md">
                    <p>No products found in your area.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {products && products.documents.map((product: DocumentType) => (
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