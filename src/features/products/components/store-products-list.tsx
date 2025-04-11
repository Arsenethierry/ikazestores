import { DocumentType } from "@/lib/types";
import { getVirtualStoreProducts } from "../actions/virtual-products-actions";
import { VirtualProductCard } from "./product-cards/virtual-product-card";
import { Suspense } from "react";
import { ProductSekeleton } from "./products-list-sekeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

export const StoreProductsList = async ({ storeId }: { storeId: string }) => {
  const storeProducts = await getVirtualStoreProducts(storeId);

  return (
    <div className="relative px-2 sm:px-4 py-4 sm:py-6">
      <Carousel
        opts={{
          align: "start",
          slidesToScroll: "auto",
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-1 flex gap-2 sm:gap-4">
          {storeProducts.documents.map((product: DocumentType) => (
            <CarouselItem
              key={product.$id}
              className="basis-2/3 xs:basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-1"
            >
              <div className="h-full flex">
                <Suspense fallback={<ProductSekeleton />}>
                  <VirtualProductCard
                    product={product}
                    storeId={storeId}
                  />
                </Suspense>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="h-full" />
        <CarouselNext className="h-full" />
      </Carousel>
    </div>
  );
}