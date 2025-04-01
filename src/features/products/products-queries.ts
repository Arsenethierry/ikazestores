import { useQuery } from "@tanstack/react-query";
import { getVirtualProductById } from "./actions/virtual-products-actions";
import { getNearbyStoresProducts } from "./actions/original-products-actions";
import { getUserLocation } from "@/lib/geolocation";

export const useGetProductById = (productId: string) => {
    return useQuery({
        queryFn: () => getVirtualProductById(productId),
        queryKey: ['product', productId],
    });
};

export const useGetNearByProducts = () => {
    return useQuery({
        queryKey: ["nearByProducts"],
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

                return getNearbyStoresProducts(southWest, northEast);
            } catch (error) {
                // Forward the error with more context if needed
                if (error instanceof Error) {
                    throw error;
                } else {
                    throw new Error("Failed to access location services. Please check browser permissions.");
                }
            }
        },
        retry: false, // Don't retry on geolocation errors as they require user intervention
    });
};