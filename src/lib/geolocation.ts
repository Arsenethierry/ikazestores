"use client";

export const getUserLocation = (): Promise<{ latitude: number, longitude: number } | null> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser."));
            return null;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
                return null;
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    });
};