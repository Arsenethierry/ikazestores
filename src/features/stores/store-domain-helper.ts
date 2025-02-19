import { getVirtualStoreByDomain } from "@/lib/actions/vitual-store.action";

interface SubdomainInfo {
    subdomain: string | null;
    isLocalhost: boolean;
    mainDomain: string;
}

export const parseSubdomain = (hostname: string): SubdomainInfo => {
    const isLocalhost = hostname.includes('localhost');
    const parts = hostname.split(".");

    if (isLocalhost) {
        return {
            subdomain: parts.length > 1 ? parts[0] : null,
            isLocalhost: true,
            mainDomain: hostname
        };
    };

    const mainDomain = parts.slice(-2).join(".");
    let subdomain = parts.slice(0, -2)[0] as string | null;

    if (subdomain === "www") {
        subdomain = parts.slice(0, -2)[1] || null;
    }

    return {
        subdomain,
        isLocalhost: false,
        mainDomain
    };
}

export const validateStore = async (subdomain: string) => {
    try {
        const stores = await getVirtualStoreByDomain(subdomain);
        return stores.total > 0 ? stores.documents[0] : null;
    } catch (error) {
        console.error(`Error validating store for subdomain ${subdomain}:`, error);
        return null;
    }
}