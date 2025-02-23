import { MAIN_DOMAIN } from "./env-config";

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || MAIN_DOMAIN.includes('localhost');


interface UrlOptions {
    subdomain: string;
    path?: string;
    protocol?: 'http' | 'https';
    includeWWW?: boolean;
}

interface DomainInfo {
    isSubdomain: boolean;
    isMainDomain: boolean;
    subdomain: string | null;
    hostname: string;
}

export const getStoreSubdomainUrl = ({
    subdomain,
    path = '',
    protocol = IS_DEVELOPMENT ? 'http' : 'https',
    includeWWW = false
}: UrlOptions): string => {
    // Clean the subdomain (remove special characters, convert to lowercase)
    const cleanSubdomain = subdomain.toLowerCase().trim()
        .replace(/[^a-zA-Z0-9-]/g, '');

    // Handle development environment (localhost)
    if (IS_DEVELOPMENT) {
        return `${protocol}://${cleanSubdomain}.${MAIN_DOMAIN}${path}`;
    }

    // Handle production environment
    const www = includeWWW ? 'www.' : '';
    return `${protocol}://${www}${cleanSubdomain}.${MAIN_DOMAIN}${path}`;
};

export const isValidStoreUrl = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        if (IS_DEVELOPMENT) {
            return hostname.endsWith(MAIN_DOMAIN) && hostname.split('.').length >= 2;
        }

        // Check if it's a valid subdomain of the main domain
        return (hostname.endsWith(MAIN_DOMAIN) &&
            hostname.split('.').length >= 3 &&
            !hostname.startsWith('www.www.'));
    } catch {
        return false;
    }
};

export const extractSubdomain = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const parts = hostname.split('.');

        if (IS_DEVELOPMENT) {
            return parts[0] || null;
        }

        // Handle www prefix in production
        if (hostname.startsWith('www.')) {
            return parts[1] || null;
        }

        return parts[0] || null;
    } catch {
        return null;
    }
};

export const checkDomain = (hostname: string): DomainInfo => {
    // Handle empty hostname
    if (!hostname) {
        return {
            isSubdomain: false,
            isMainDomain: false,
            subdomain: null,
            hostname: ''
        };
    }

    // Development environment (localhost)
    if (IS_DEVELOPMENT) {
        const parts = hostname.split('.');
        return {
            isSubdomain: parts.length > 1,
            isMainDomain: parts.length === 1 || hostname === MAIN_DOMAIN,
            subdomain: parts.length > 1 ? parts[0] : null,
            hostname
        };
    }

    // Production environment
    const isWWW = hostname.startsWith('www.');
    const domainWithoutWWW = isWWW ? hostname.slice(4) : hostname;
    const parts = domainWithoutWWW.split('.');

    return {
        isSubdomain: parts.length > 2 || (isWWW && parts.length > 1),
        isMainDomain: domainWithoutWWW === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`,
        subdomain: extractSubdomain(`http://${hostname}`),
        hostname
    };
};

export const isMainDomain = (hostname: string): boolean => {
    const { isMainDomain } = checkDomain(hostname);
    return isMainDomain;
};

export const isTenantSubdomain = (hostname: string): boolean => {
    const { isSubdomain } = checkDomain(hostname);
    return isSubdomain;
};
