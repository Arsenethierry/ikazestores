// import { VirtualProductTypes } from "@/lib/types";
import { getVirtualStoreProducts } from "../actions/virtual-products-actions";
import { VirtualProductCard } from "./product-cards/virtual-product-card";
import { Suspense } from "react";
import { ProductSekeleton } from "./products-list-sekeleton";

export const StoreProductsList = async ({ storeId }: { storeId: string }) => {
  const storeProducts = await getVirtualStoreProducts({ virtualStoreId: storeId, limit: 6 });

  return (
    // <div className="grid grid-rows-2 grid-flow-col auto-cols-fr gap-2 overflow-x-auto">
    //   {storeProducts && Array.from({ length: 4 }).map((_, i) => (
    //     <Suspense key={i} fallback={<ProductSekeleton />}>
    //       <VirtualProductCard
    //         product={storeProducts.documents[0]}
    //         storeId={storeId}
    //       />
    //     </Suspense>
    //   ))}
    // </div>

    // <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto">
    //   {storeProducts && Array.from({ length: 20 }).map((_, i) => (
    //     <Suspense key={i} fallback={<ProductSekeleton />}>
    //       <div className="w-40 md:w-48 lg:w-56">
    //         <VirtualProductCard
    //           product={storeProducts.documents[0]}
    //           storeId={storeId}
    //         />
    //       </div>
    //     </Suspense>
    //   ))}
    // </div>

    <div className="flex flex-wrap gap-5 mt-5 justify-center md:justify-start">
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