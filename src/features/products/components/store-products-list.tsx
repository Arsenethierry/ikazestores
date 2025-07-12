import { getVirtualStoreProducts } from "../actions/virtual-products-actions";
import { VirtualProductCard } from "./product-cards/virtual-product-card";
import { Suspense } from "react";
import { ProductSekeleton } from "./products-list-sekeleton";

export const StoreProductsList = async ({ storeId }: { storeId: string }) => {
  const storeProducts = await getVirtualStoreProducts({ virtualStoreId: storeId, limit: 6, withStoreData: true });

  return (
    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
      {storeProducts && storeProducts.documents.map((product) => (
        <Suspense key={product.$id} fallback={<ProductSekeleton />}>
          <VirtualProductCard
            product={product}
            storeId={storeId}
          />
        </Suspense>
      ))}
    </div>
  );
}