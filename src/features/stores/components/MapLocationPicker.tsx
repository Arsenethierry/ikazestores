"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { toast } from "sonner";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapLocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationChange: (lat: number, lng: number, address?: string) => void;
}

function LocationMarker({
    onLocationChange,
    position
}: {
    position: [number, number] | null,
    onLocationChange: (lat: number, lng: number, address?: string) => void
}) {
    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;

            // Reverse geocoding to get address
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
                );
                const data = await response.json();

                if (data && data.display_name) {
                    onLocationChange(lat, lng, data.display_name);
                    toast.success("Location updated!");
                } else {
                    onLocationChange(lat, lng);
                    toast.success("Location updated!");
                }
            } catch (error) {
                console.error("Error getting address:", error);
                onLocationChange(lat, lng);
                toast.success("Location updated!");
            }
        }
    });

    return position === null ? null : (
        <Marker position={position} />
    )
}

export default function MapLocationPicker({
    onLocationChange,
    initialLat,
    initialLng
}: MapLocationPickerProps) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (initialLat && initialLng) {
            const newPosition: [number, number] = [initialLat, initialLng];
            setPosition(newPosition);
            setMapCenter(newPosition);
        } else {
            setMapCenter([-1.9441, 30.0619])
        }
    }, [initialLat, initialLng]);

    const handleLocationChange = (lat: number, lng: number, address?: string) => {
        const newPosition: [number, number] = [lat, lng];
        setPosition(newPosition);
        onLocationChange(lat, lng, address);
    };

    if (!isClient) {
        return <div className="h-96 w-full bg-gray-100 rounded-md flex items-center justify-center">Loading map...</div>;
    }

    return (
        <div className="h-96 w-full">
            <MapContainer
                center={mapCenter}
                zoom={initialLat && initialLng ? 15 : 13}
                style={{ height: "100%", width: "100%" }}
                className="rounded-md"
                key={`${mapCenter[0]}-${mapCenter[1]}`} // Force re-render when center changes
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                    subdomains={['a', 'b', 'c']}
                />
                <LocationMarker
                    position={position}
                    onLocationChange={handleLocationChange}
                />
            </MapContainer>
        </div>
    )
}