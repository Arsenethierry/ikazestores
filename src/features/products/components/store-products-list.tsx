import { VirtualProductCard } from "./product-cards/virtual-product-card";
import { Suspense } from "react";
import { ProductSekeleton } from "./products-list-sekeleton";
import { getVirtualStoreProducts } from "@/lib/actions/affiliate-product-actions";

export const StoreProductsList = async ({ storeId }: { storeId: string }) => {
  try {
    const storeProducts = await getVirtualStoreProducts(storeId, { 
      limit: 6,
      orderBy: "$createdAt",
      orderType: "desc"
    });

    // Check if we have products to display
    if (!storeProducts.documents || storeProducts.documents.length === 0) {
      return <></>;
    }

    return (
      <div className="flex flex-wrap gap-5 mt-5 justify-center md:justify-start">
        {storeProducts.documents.map((product) => (
          <Suspense key={product.$id} fallback={<ProductSekeleton />}>
            <VirtualProductCard
              product={product}
              storeId={storeId}
            />
          </Suspense>
        ))}
      </div>
    );
  } catch (error) {
    console.error("Error fetching store products:", error);
    return <></>;
  }
};