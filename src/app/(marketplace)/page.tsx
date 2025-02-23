import ProductCard from "@/features/products/components/product-card";
import { StoreCarousel } from "@/features/stores/components/store-carousel";
import { getAllVirtualStores } from "@/lib/actions/vitual-store.action";

export default async function Home() {
  const virtualStores = await getAllVirtualStores();
  return (
    <div className="space-y-5">
      <StoreCarousel />
      <div className="main-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8,9,10].map((product, index) => (
          <ProductCard key={index} />
        ))}
      </div>
    </div>
  );
}
