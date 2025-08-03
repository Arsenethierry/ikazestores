"use client";

import { useEffect, useState } from "react";
import { CurrentUserType, OriginalProductTypes, ProductFilters } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin, Package } from "lucide-react";
import { ProductsFilters } from "./products-filters";
import { Button } from "@/components/ui/button";
import { PhysicalProductCard } from "../product-cards/physical-product-card";
import SpinningLoader from "@/components/spinning-loader";
import { useInfiniteOriginalProducts, useNearbyProducts } from "@/hooks/queries-and-mutations/use-original-products-queries";

const CloneProductsPage: React.FC<{ virtualStoreId: string, user: CurrentUserType }> = ({ virtualStoreId, user }) => {
    const [filters, setFilters] = useState<ProductFilters>({
        status: 'active',
        sortBy: 'name',
        sortOrder: 'asc'
    });
    const [nearbyFilters, setNearbyFilters] = useState<ProductFilters>({
        status: 'active',
        radiusKm: 50
    });
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    const {
        data: allProductsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingAll,
        error: allProductsError
    } = useInfiniteOriginalProducts(filters);

    const {
        data: nearbyProductsData,
        isLoading: isLoadingNearby,
        error: nearbyError
    } = useNearbyProducts(
        userLocation?.lat || 0,
        userLocation?.lng || 0,
        nearbyFilters.radiusKm || 50,
        nearbyFilters
    );

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, []);

    const allProducts = allProductsData?.pages.flatMap(page => page.products) || [];
    const nearbyProducts = nearbyProductsData?.products || [];

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Clone Products</h1>
                <p className="text-muted-foreground">Browse and import products from other stores into your virtual store.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        All Products
                    </TabsTrigger>
                    <TabsTrigger value="nearby" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Nearby Products
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6">
                    <ProductsFilters filters={filters} onFiltersChange={setFilters} />

                    {isLoadingAll ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : allProductsError ? (
                        <div className="text-center py-12">
                            <p className="text-destructive">Error loading products: {allProductsError.message}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {allProducts.map((product: OriginalProductTypes) => (
                                    <PhysicalProductCard
                                        key={product.$id}
                                        product={product}
                                        virtualStoreId={virtualStoreId}
                                        user={user}
                                        isSystemAdmin={false}
                                        isPhysicalStoreOwner={false}
                                        isVirtualStoreOwner={true}
                                    />
                                ))}
                            </div>

                            {allProducts.length === 0 && (
                                <div className="text-center py-12">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-lg font-medium">No products found</p>
                                    <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                                </div>
                            )}

                            {hasNextPage && (
                                <div className="flex justify-center">
                                    <Button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        variant="outline"
                                    >
                                        {isFetchingNextPage ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : null}
                                        Load More Products
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="nearby" className="space-y-6">
                    <ProductsFilters filters={nearbyFilters} onFiltersChange={setNearbyFilters} isNearbyView />

                    {!userLocation ? (
                        <div className="text-center py-12">
                            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium">Getting your location...</p>
                            <p className="text-muted-foreground">Please allow location access to see nearby products.</p>
                        </div>
                    ) : isLoadingNearby ? <SpinningLoader />
                        : nearbyError ? (
                            <div className="text-center py-12">
                                <p className="text-destructive">Error loading nearby products: {nearbyError.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {nearbyProducts && nearbyProducts.map((product: OriginalProductTypes) => (
                                        <PhysicalProductCard
                                            key={product.$id}
                                            product={product}
                                            virtualStoreId={virtualStoreId}
                                            user={user}
                                            isSystemAdmin={false}
                                            isPhysicalStoreOwner={false}
                                            isVirtualStoreOwner={true}
                                        />
                                    ))}
                                </div>

                                {nearbyProducts.length === 0 && (
                                    <div className="text-center py-12">
                                        <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-lg font-medium">No nearby products found</p>
                                        <p className="text-muted-foreground">Try increasing the search radius or adjusting your filters.</p>
                                    </div>
                                )}
                            </div>
                        )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default CloneProductsPage;