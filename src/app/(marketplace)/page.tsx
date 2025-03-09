import { getAllVirtualProducts } from "@/features/products/actions/virtual-products-actions";
import ProductCard from "@/features/products/components/product-card";
import { StoreCarousel } from "@/features/stores/components/store-carousel";

export default async function Home() {
  const virtualProducts = await getAllVirtualProducts();

  console.log(virtualProducts)

  return (
    <div className="space-y-5">
      <StoreCarousel />
      <div className="main-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* {virtualProducts && virtualProducts.documents.map((product, index) => (
          <ProductCard product={product?.originalProduct} key={index} />
        ))} */}
      </div>
    </div>
  );
}
