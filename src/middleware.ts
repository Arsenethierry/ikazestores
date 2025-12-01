import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "./lib/constants";
import { getAuthState } from "./lib/user-permission";
import {
  parseSubdomain,
} from "./features/stores/store-domain-helper";
import { getVirtualStoreByDomain } from "./lib/actions/virtual-store.action";

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "ikazestores.com";
const PROTECTED_SUBDOMAINS = ["www", "admin", "api", "app"];

const TEMPLATE_ROUTES: Record<string, string> = {
  "template-modern-01": "modern",
  "template-classic-01": "classic",
  // Add more as you create them:
  // 'template-bold-01': 'bold',
};

const DEFAULT_TEMPLATE = "modern";

const storeCache = new Map<string, { store: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function getStoreBySubdomain(subdomain: string) {
  const cached = storeCache.get(subdomain);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.store;
  }

  try {
    const { getVirtualStoreByDomain } = await import(
      "./lib/actions/virtual-store.action"
    );
    const store = await getVirtualStoreByDomain(subdomain);

    if (store) {
      storeCache.set(subdomain, { store, timestamp: Date.now() });
    }

    return store;
  } catch (error) {
    console.error("[Middleware] Error fetching store:", error);
    return null;
  }
}

const PROTECTED_ROUTES: Record<string, any> = {
  "/admin": {
    roles: [
      UserRole.SYS_ADMIN,
      UserRole.PHYSICAL_STORE_OWNER,
      UserRole.VIRTUAL_STORE_OWNER,
    ],
    requiresSystemAdmin: false,
  },
  "/admin/stores": {
    roles: [
      UserRole.SYS_ADMIN,
      UserRole.PHYSICAL_STORE_OWNER,
      UserRole.VIRTUAL_STORE_OWNER,
    ],
    requiresSystemAdmin: false,
  },
};

function getRouteAuthConfig(path: string) {
  const exactMatch = PROTECTED_ROUTES[path];
  if (exactMatch) return exactMatch;

  const route = Object.entries(PROTECTED_ROUTES).find(([route]) =>
    path.startsWith(`${route}/`)
  );

  if (route) {
    const config = PROTECTED_ROUTES[route[0]];
    if (requiresSystemAdminOnly(path)) {
      return {
        ...config,
        roles: [UserRole.SYS_ADMIN],
        requiresSystemAdmin: true,
      };
    }
    return config;
  }

  return null;
}

function requiresSystemAdminOnly(path: string): boolean {
  if (path.startsWith("/admin/")) {
    if (path.startsWith("/admin/stores")) {
      return false;
    }
    return true;
  }
  return false;
}

function getTemplateRoute(templateId?: string | null): string {
  if (!templateId) return DEFAULT_TEMPLATE;
  return TEMPLATE_ROUTES[templateId] || DEFAULT_TEMPLATE;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname, searchParams } = request.nextUrl;

  try {
    const isProtectedRoute =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/sell");

    if (isProtectedRoute) {
      const authConfig = getRouteAuthConfig(pathname);

      if (authConfig) {
        const auth = await getAuthState();

        if (!auth.isAuthenticated) {
          const signInUrl = new URL(
            `/sign-in?redirectUrl=${pathname}${
              searchParams.toString() ? "&" + searchParams.toString() : ""
            }`,
            request.url
          );
          return NextResponse.redirect(signInUrl);
        }

        if (
          authConfig.requiresSystemAdmin ||
          requiresSystemAdminOnly(pathname)
        ) {
          if (!auth.isSystemAdmin) {
            return NextResponse.redirect(new URL("/admin", request.url));
          }
        } else {
          const hasRequiredRole = authConfig.roles.some((role: any) => {
            switch (role) {
              case UserRole.SYS_ADMIN:
                return auth.isSystemAdmin;
              case UserRole.VIRTUAL_STORE_OWNER:
                return auth.isVirtualStoreOwner;
              case UserRole.PHYSICAL_STORE_OWNER:
                return auth.isPhysicalStoreOwner;
              default:
                return false;
            }
          });

          if (!hasRequiredRole) {
            return NextResponse.redirect(new URL("/", request.url));
          }
        }
      }
    }

    const subdomain = parseSubdomain(hostname);

    if (
      !subdomain ||
      hostname === MAIN_DOMAIN ||
      hostname === `www.${MAIN_DOMAIN}`
    ) {
      return NextResponse.next();
    }

    if (PROTECTED_SUBDOMAINS.includes(subdomain)) {
      return new NextResponse(
        JSON.stringify({ message: "This subdomain is reserved" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (hostname.includes(".vercel.app") && !hostname.includes("localhost")) {
      return NextResponse.next();
    }

    const store = await getVirtualStoreByDomain(subdomain)

    if (!store) {
      console.log(`[Middleware] Store not found: ${subdomain}`);
      return NextResponse.rewrite(new URL("/store-not-found", request.url));
    }

    const templateRoute = getTemplateRoute(store.templateId);

    console.log(`[Middleware] 🏪 ${subdomain} → ${store.storeName}`);
    console.log(
      `[Middleware] 🎨 Template: ${
        store.templateId || "default"
      } → /${templateRoute}`
    );

    const rewriteUrl = new URL(
      `/store/${store.$id}/${templateRoute}${pathname}`,
      request.url
    );

    searchParams.forEach((value, key) => {
      rewriteUrl.searchParams.set(key, value);
    });

    rewriteUrl.searchParams.set("storeId", store.$id);

    console.log(`[Middleware] ↪️  Rewriting to: ${rewriteUrl.pathname}`);

    return NextResponse.rewrite(rewriteUrl);
  } catch (error) {
    console.error("[Middleware] Error:", error);

    if (hostname !== MAIN_DOMAIN && !hostname.includes("localhost")) {
      return NextResponse.redirect(new URL("/", `https://${MAIN_DOMAIN}`));
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)",
  ],
};
