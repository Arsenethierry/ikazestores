import { NextRequest, NextResponse } from "next/server";
import { parseSubdomain } from "./features/stores/store-domain-helper";
import { MAIN_DOMAIN } from "./lib/env-config";
import { getVirtualStoreByDomain } from "./lib/actions/vitual-store.action";

const PROTECTED_SUBDOMAINS = ["www", "admin", "api", "dashboard"];

export async function middleware(request: NextRequest) {
    try {
        const hostname = request.headers.get("host");

        if (!hostname) {
            throw new Error("No hostname found in request");
        }

        const { isLocalhost, subdomain } = parseSubdomain(hostname);

        if(!subdomain || hostname === `www.${MAIN_DOMAIN}` || hostname === MAIN_DOMAIN) {
            return NextResponse.next();
        }

        if(PROTECTED_SUBDOMAINS.includes(subdomain)) {
            return new NextResponse(
                JSON.stringify({ message: "This subdomain is reserved" }),
                { status: 403, headers: { "Content-Type": "application/json" } }  
            )
        }

        // Skip verification for development on Vercel
        if (!isLocalhost && hostname.includes(".vercel.app")) {
            return NextResponse.next();
        }

        const stores = await getVirtualStoreByDomain(subdomain);

        if(stores && stores.total > 0 && stores.documents[0]) {
            const rewrittenUrl = new URL(`/store/${subdomain}${request.nextUrl.pathname}`, request.url);
            return NextResponse.rewrite(rewrittenUrl);
        }
        // Store not found
        return NextResponse.rewrite(new URL("/store-not-found", request.url));

    } catch (error) {
        console.error("Middleware error:", error);
        
        // Redirect to error page on main domain
        const errorUrl = new URL("/error", `${MAIN_DOMAIN}`);
        return NextResponse.redirect(errorUrl);
    }
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
