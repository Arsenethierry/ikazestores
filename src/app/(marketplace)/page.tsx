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
import { Metadata } from "next";
import Link from "next/link";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: 'IkazeStores | Hybrid Commerce Platform Bridging Physical & Digital Stores',
  description: 'Transform retail spaces into digital revenue streams or launch virtual stores with zero inventory. Connect physical suppliers with digital entrepreneurs in real-time. Join 500+ vendors and 2.3k entrepreneurs.',
  keywords: [
    'hybrid commerce',
    'digital storefront',
    'virtual store',
    'dropshipping platform',
    'inventory-free business',
    'retail digitalization'
  ],
  openGraph: {
    type: 'website',
    url: 'https://ikazestores.com',
    title: 'IkazeStores | Unified Commerce Platform',
    description: 'Bridge physical retail and digital commerce with real-time inventory synchronization',
    siteName: 'IkazeStores',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'IkazeStores Platform Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IkazeStores | Hybrid Commerce Solution',
    description: 'Launch your inventory-free digital store or transform existing retail into digital revenue',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://ikazestores.com',
  },
}
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
      <div className="">
        <StoreCarousel />
        {virtualStores.documents.map((store) =>
          store.vitualProducts?.length > 0 ? (
            <div className={`main-container p-2`} key={store.$id}>
              <div className="flex justify-between p-2 mb-1 border-t-2 rounded-t-md bg-secondary items-center">
                <div className="flex gap-2">
                  <Avatar>
                    <AvatarImage src={store?.storeLogoIdUrl} alt="@shadcn" />
                    <AvatarFallback>{getStoreInitials(store.storeName)}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-xl font-bold capitalize">{store.storeName}</h1>
                </div>
                <div className="flex gap-2">
                  <Button>Subscribe</Button>
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
