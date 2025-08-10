import { NextRequest, NextResponse } from "next/server";
import { parseSubdomain } from "./features/stores/store-domain-helper";
import { MAIN_DOMAIN } from "./lib/env-config";
import { getVirtualStoreByDomain } from "./lib/actions/virtual-store.action";
import { UserRole } from "./lib/constants";
import { getAuthState } from "./lib/user-permission";

const PROTECTED_SUBDOMAINS = ["www", "admin", "api", "dashboard"];

const PROTECTED_ROUTES = {
    '/admin': {
        roles: [UserRole.SYS_ADMIN, UserRole.PHYSICAL_STORE_OWNER, UserRole.VIRTUAL_STORE_OWNER],
        requiresSystemAdmin: false,
    },
    '/admin/stores': {
        roles: [UserRole.SYS_ADMIN, UserRole.PHYSICAL_STORE_OWNER, UserRole.VIRTUAL_STORE_OWNER],
        requiresSystemAdmin: false,
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

const requiresSystemAdminOnly = (path: string): boolean => {
    if (path.startsWith("/admin/")) {
        if (path.startsWith('/admin/stores')) {
            return false;
        }

        return true;
    }

    return false;
}

const getRouteAuthConfig = (path: string) => {
    const exactMatch = PROTECTED_ROUTES[path];
    if (exactMatch) {
        return exactMatch;
    }

    const route = Object.entries(PROTECTED_ROUTES).find(([route]) =>
        path.startsWith(`${route}/`)
    );

    if (route) {
        const config = PROTECTED_ROUTES[route[0]];

        if (requiresSystemAdminOnly(path)) {
            return {
                ...config,
                roles: [UserRole.SYS_ADMIN],
                requiresSystemAdmin: true
            };
        }

        return config;
    }

    return null;
}

export async function middleware(request: NextRequest) {
    try {
        const hostname = request.headers.get("host");
        const path = request.nextUrl.pathname;
        const { searchParams } = request.nextUrl;

        if (!hostname) {
            throw new Error("No hostname found in request");
        }

        const { isLocalhost, subdomain } = parseSubdomain(hostname);
        const isProtected = isProtectedRoute(path);
        const authConfig = isProtected ? getRouteAuthConfig(path) : null;

        if (isProtected && authConfig) {
            const auth = await getAuthState();

            if (!auth.isAuthenticated) {
                const signInUrl = new URL(`/sign-in?redirectUrl=${path}${searchParams.toString() ? '&' + searchParams.toString() : ''}`, request.url);
                return NextResponse.redirect(signInUrl);
            }

            if (authConfig.requiresSystemAdmin || requiresSystemAdminOnly(path)) {
                if (!auth.isSystemAdmin) {
                    return NextResponse.redirect(new URL('/admin', request.url));
                }
            } else {
                const hasRequiredRole = authConfig.roles.some((role: any) => {
                    switch (role) {
                        case UserRole.SYS_ADMIN: return auth.isSystemAdmin;
                        case UserRole.VIRTUAL_STORE_OWNER: return auth.isVirtualStoreOwner;
                        case UserRole.PHYSICAL_STORE_OWNER: return auth.isPhysicalStoreOwner;
                        default: return false;
                    }
                });

                if (!hasRequiredRole) {
                    return NextResponse.redirect(new URL('/', request.url));
                }
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

        const store = await getVirtualStoreByDomain(subdomain);
        if (store) {
            // Set storeId as query param instead of path param
            const rewrittenUrl = new URL(
                `/store/${store.$id}${request.nextUrl.pathname}?storeId=${store.$id}${searchParams.toString() ? '&' + searchParams.toString() : ''
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