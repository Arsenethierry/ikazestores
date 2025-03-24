/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { parseSubdomain } from "./features/stores/store-domain-helper";
import { MAIN_DOMAIN } from "./lib/env-config";
import { getVirtualStoreByDomain } from "./lib/actions/vitual-store.action";
import { UserRole } from "./lib/constants";
import { getAuthState } from "./lib/user-label-permission";
import { getAllVirtualStoresByOwnerId } from "./lib/actions/vitual-store.action"; // Assuming this import path
import { checkDomain } from "./lib/domain-utils";

const PROTECTED_SUBDOMAINS = ["www", "admin", "api", "dashboard"];

const PROTECTED_ROUTES = {
    '/admin': {
        roles: [UserRole.SYS_ADMIN, UserRole.PHYSICAL_STORE_OWNER, UserRole.VIRTUAL_STORE_OWNER],
    },
    '/dashboard': {
        roles: [UserRole.VIRTUAL_STORE_OWNER],
    },
    // '/my-orders': {
    //     roles: [UserRole.BUYER, UserRole.PHYSICAL_STORE_OWNER, UserRole.SYS_ADMIN, UserRole.VIRTUAL_STORE_OWNER]
    // }
} as any;

const isProtectedRoute = (path: string) => {
    return Object.keys(PROTECTED_ROUTES).some(route =>
        path === route || path.startsWith(`${route}/`)
    );
}

const getRouteAuthConfig = (path: string) => {
    const route = Object.entries(PROTECTED_ROUTES).find(([route]) =>
        path === route || path.startsWith(`${route}`)
    );

    return route ? PROTECTED_ROUTES[route[0]] : null;
}

export async function middleware(request: NextRequest) {
    try {
        const hostname = request.headers.get("host");
        const path = request.nextUrl.pathname;
        const { searchParams } = request.nextUrl;
        const url = request.nextUrl.clone();


        if (!hostname) {
            throw new Error("No hostname found in request");
        }

        const { isSubdomain } = checkDomain(hostname);

        const { isLocalhost, subdomain } = parseSubdomain(hostname);
        const isProtected = isProtectedRoute(path);
        const authConfig = isProtected ? getRouteAuthConfig(path) : null;

        // Check if storeId already exists in query params
        if (!searchParams.has('storeId') && isSubdomain) {
            // Get auth state to access user info
            const auth = await getAuthState();

            if (auth.isAuthenticated && auth?.user) {
                // Get the user's stores
                const stores = await getAllVirtualStoresByOwnerId(auth?.user.$id);

                if (stores && stores.documents.length > 0) {
                    // Use the first store or default store
                    const defaultStoreId = stores.documents[0].$id;

                    // Append storeId to URL
                    url.searchParams.set('storeId', defaultStoreId);
                    return NextResponse.redirect(url);
                }
            }
        }

        // Check authentication for protected routes
        if (isProtected && authConfig) {
            const auth = await getAuthState();

            // Redirect to login if not authenticated
            if (!auth.isAuthenticated) {
                const signInUrl = new URL(`/sign-in?redirectUrl=${path}${searchParams.toString() ? '&' + searchParams.toString() : ''}`, request.url);
                return NextResponse.redirect(signInUrl);
            }

            // Check role authorization
            const hasRequiredRole = authConfig.roles.some((role: any) => {
                switch (role) {
                    case 'sysAdmin': return auth.isSystemAdmin;
                    case 'virtualStoreOwner': return auth.isVirtualStoreOwner;
                    case 'physicalStoreOwner': return auth.isPhysicalStoreOwner;
                    default: return false;
                }
            });

            if (!hasRequiredRole) {
                // Redirect to home page or unauthorized page
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        if (!subdomain || hostname === `www.${MAIN_DOMAIN}` || hostname === MAIN_DOMAIN) {
            return NextResponse.next();
        }

        if (PROTECTED_SUBDOMAINS.includes(subdomain)) {
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

        if (stores && stores.total > 0 && stores.documents[0]) {
            // Set storeId as query param instead of path param
            const rewrittenUrl = new URL(
                `/store/${subdomain}${request.nextUrl.pathname}?storeId=${stores.documents[0].$id}${searchParams.toString() ? '&' + searchParams.toString() : ''
                }`,
                request.url
            );
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