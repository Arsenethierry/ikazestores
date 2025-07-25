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