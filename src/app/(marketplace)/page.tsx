import { Button } from "@/components/ui/button";
import { ProductListSkeleton } from "@/features/products/components/products-list-sekeleton";
import { StoreProductsList } from "@/features/products/components/store-products-list";
import { StoreCarousel } from "@/features/stores/components/store-carousel";
import { getAllVirtualStores } from "@/lib/actions/vitual-store.action";
import React, { Suspense } from "react";

export default async function Home() {
  try {
    const virtualStores = await getAllVirtualStores();
    if (!virtualStores || virtualStores.total === 0) {
      return (
        <div className="space-y-5 text-center">
          <StoreCarousel />
          <p className="text-gray-500">No stores available yet. Stay tuned!</p>
        </div>
      );
    }

    return (
      <div className="">
        <StoreCarousel />
        {virtualStores.documents.map((store) =>
          store.vitualProducts?.length > 0 ? (
            <div className="main-container" key={store.$id}>
              <div className="flex justify-between py-2 mb-1">
                <h1 className="text-xl font-bold capitalize">{store.storeName}</h1>
                <Button>Follow</Button>
              </div>
              <Suspense fallback={<ProductListSkeleton />}>
                <StoreProductsList storeId={store.$id} />
              </Suspense>
            </div>
          ) : null
        )}
      </div>
    )

  } catch (error) {
    console.error("Error fetching virtual stores:", error);
    return (
      <div className="space-y-5 text-center text-red-500">
        <StoreCarousel />
        <p>Something went wrong while fetching virtual stores. Please try again later.</p>
      </div>
    );
  }
}
