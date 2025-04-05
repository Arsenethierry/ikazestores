import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProductListSkeleton } from "@/features/products/components/products-list-sekeleton";
import { StoreProductsList } from "@/features/products/components/store-products-list";
import { StoreCarousel } from "@/features/stores/components/store-carousel";
import { getAllVirtualStores } from "@/lib/actions/vitual-store.action";
import { getStoreSubdomainUrl } from "@/lib/domain-utils";
import { getStoreInitials } from "@/lib/utils";
import { Ellipsis, Navigation } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

export default async function Home() {
  try {
    const virtualStores = await getAllVirtualStores();

    if (!virtualStores || virtualStores.total === 0) {
      return (
        <div className="space-y-5 text-center">
          <StoreCarousel />
          <p className="text-gray-500">No stores available yet. Stay tuned!</p>
        </div>
      );
    }

    return (
      <div>
        <StoreCarousel />
        {virtualStores.documents.map((store) =>
          store.vitualProducts?.length > 0 ? (
            <div className={`md:main-container md:px-5 max-w-[1540px] mx-auto py-3 px-1`} key={store.$id}>
              <div className="flex justify-between mb-1 border-t-2 rounded-t-md bg-secondary items-center">
                <div className="flex gap-2">
                  <Avatar>
                    <AvatarImage src={store?.storeLogoIdUrl} alt="@shadcn" />
                    <AvatarFallback>{getStoreInitials(store.storeName)}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-xl font-bold capitalize truncate">{store.storeName}</h1>
                </div>
                <div className="flex gap-2">
                  <Button className="hidden md:block">Subscribe</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="outline" aria-label="Select theme">
                        <Ellipsis size={16} aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-32">
                      <DropdownMenuItem>
                        <Link href={getStoreSubdomainUrl({ subdomain: store.subDomain })} target="_blank" className="inline-flex">
                          <Navigation size={16} className="opacity-60" aria-hidden="true" />
                          <span className="font-bold">Visit store</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Suspense fallback={<ProductListSkeleton />}>
                <StoreProductsList storeId={store.$id} />
              </Suspense>
            </div>
          ) : null
        )}
      </div>
    )

  } catch (error) {
    console.error("Error fetching virtual stores:", error);
    return (
      <div className="space-y-5 text-center text-red-500">
        <StoreCarousel />
        <p>Something went wrong while fetching virtual stores. Please try again later.</p>
      </div>
    );
  }
}
