import { useQuery } from "@tanstack/react-query";
import { getVirtualProductById } from "./actions/virtual-products-actions";
import { getNearbyStoresOriginalProducts } from "./actions/original-products-actions";
import { getUserLocation } from "@/lib/geolocation";

export const useGetProductById = (productId: string) => {
    return useQuery({
        queryFn: () => getVirtualProductById(productId),
        queryKey: ['product', productId],
    });
};

export const useGetNearByOriginalProducts = () => {
    return useQuery({
        queryKey: ["nearByOriginalProducts"],
        queryFn: async () => {
            try {
                const location = await getUserLocation();
                if (!location) {
                    throw new Error("Failed to detect location. Please enable your location services.");
                }
                
                const RADIUS_OFFSET = 0.045;
                const southWest = {
                    lat: location.latitude - RADIUS_OFFSET,
                    lng: location.longitude - RADIUS_OFFSET,
                };
                const northEast = {
                    lat: location.latitude + RADIUS_OFFSET,
                    lng: location.longitude + RADIUS_OFFSET,
                };

                return getNearbyStoresOriginalProducts(southWest, northEast);
            } catch (error) {
                if (error instanceof Error) {
                    throw error;
                } else {
                    throw new Error("Failed to access location services. Please check browser permissions.");
                }
            }
        },
        retry: false,
    });
};