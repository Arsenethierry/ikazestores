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
            const location = await getUserLocation();
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
        },
    });
};
