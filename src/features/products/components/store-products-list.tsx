import { DocumentType } from "@/lib/types";
import { getVirtualStoreProducts } from "../actions/virtual-products-actions";
import { VirtualProductCard } from "./product-cards/virtual-product-card";
import { Suspense } from "react";
import { ProductSekeleton } from "./products-list-sekeleton";

export const StoreProductsList = async ({ storeId }: { storeId: string }) => {
  const storeProducts = await getVirtualStoreProducts(storeId);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {storeProducts && storeProducts.documents.map((product: DocumentType) => (
        <div key={product.$id}>
          <Suspense fallback={<ProductSekeleton />}>
            <VirtualProductCard product={product} storeId={storeId} />
          </Suspense>
        </div>
      ))}
    </div>
  );
}
