import ProductCard from "@/features/products/components/product-card";
import { DocumentType } from "@/lib/types";
import { getVirtualStoreProducts } from "../actions/virtual-products-actions";

export const StoreProductsList = async ({ storeId }: { storeId: string }) => {
  const storeProducts = await getVirtualStoreProducts(storeId);

  return (
    <div className="">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {storeProducts && storeProducts.documents.map((product: DocumentType) => (
          <div key={product.$id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
