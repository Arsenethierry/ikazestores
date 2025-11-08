import { MAIN_DOMAIN } from "@/lib/env-config";
import { unstable_cache } from "next/cache";

export function parseSubdomain(hostname: string) {
  const isLocalhost = hostname.includes("localhost");
  const parts = hostname.split(".");

  if (isLocalhost) {
    return parts.length > 1 ? parts[0] : null;
  }

  const subdomain = parts.slice(0, -2)[0];
  return subdomain === "www" ? parts.slice(0, -2)[1] || null : subdomain;
}

export function getStoreUrls(store: any) {
  const isProduction = process.env.NODE_ENV === "production";
  const protocol = isProduction ? "https" : "http";

  if (process.env.NODE_ENV === "development") {
    return {
      baseUrl: `${protocol}://localhost:3000`,
      storeUrl: `${protocol}://${store.subDomain}.localhost:3000`,
    };
  }

  const mainDomain = MAIN_DOMAIN || process.env.NEXT_PUBLIC_MAIN_DOMAIN;
  return {
    baseUrl: `${protocol}://${mainDomain}`,
    storeUrl: `${protocol}://${store.subDomain}.${mainDomain}`,
  };
}
