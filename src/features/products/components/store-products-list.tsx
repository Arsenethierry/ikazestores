import { getVirtualStoreProducts } from "../../../lib/actions/virtual-products-actions";
import { VirtualProductCard } from "./product-cards/virtual-product-card";
import { Suspense } from "react";
import { ProductSekeleton } from "./products-list-sekeleton";

export const StoreProductsList = async ({ storeId }: { storeId: string }) => {

  const storeProducts = await getVirtualStoreProducts({ virtualStoreId: storeId, limit: 6, withStoreData: true });

  if (!storeProducts.success || !storeProducts.data) {
    return <></>
  }

  return (
    <div className="flex flex-wrap gap-5 mt-5 justify-center md:justify-start">
      {storeProducts && storeProducts.data.map((product) => (
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