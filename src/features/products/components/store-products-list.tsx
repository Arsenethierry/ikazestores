import { DocumentType } from "@/lib/types";
import { getVirtualStoreProducts } from "../actions/virtual-products-actions";
import { VirtualProductCard } from "./product-cards/virtual-product-card";
import { Suspense } from "react";
import { ProductSekeleton } from "./products-list-sekeleton";

export const StoreProductsList = async ({ storeId }: { storeId: string }) => {
  const storeProducts = await getVirtualStoreProducts(storeId);

  return (
    <div className="grid grid-rows-2 grid-flow-col auto-cols-fr gap-2 overflow-x-auto">
      {storeProducts && storeProducts.documents.map((product: DocumentType) => (
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