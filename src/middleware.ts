import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    try {
        const hostname = request.headers.get("host")!;

        const isLocalDevelopment = hostname.includes("localhost:3000");
        let subdomains: string[];
        let subdomain: string | undefined;

        if (isLocalDevelopment) {
            subdomains = hostname.split(".");
            subdomain = subdomains.length > 1 ? subdomains[0] : undefined;
        } else {
            subdomains = hostname.split(".").slice(0, -2);
            subdomain = subdomains[0]?.includes("www") ? subdomains[1] : subdomains[0];
        }

        // ✅ **Rewrite paths for subdomains (e.g., `sell.localhost:3000`)**
        if (subdomains.includes("mystore")) {
            return NextResponse.rewrite(new URL(`/mystore${request.nextUrl.pathname}`, request.url));
        }

        // ✅ **Multi-Tenancy Store Handling**
        if (
            (subdomains.length > 0 &&
                !(hostname === "www.ikazehub.com" || hostname === "ikazehub.com")) ||
            isLocalDevelopment
        ) {
            if (!hostname.includes(".vercel.app") || isLocalDevelopment) {
                if (!subdomain) {
                    return NextResponse.next();
                }

                try {
                    console.log(`Querying database for subdomain: ${subdomain}`);
                    const store = { total: 1 }; // Replace with actual store lookup

                    if (store && store.total > 0) {
                        const rewrittenPath = `/store/${subdomain}${request.nextUrl.pathname}`;
                        console.log(`Valid company found. Rewriting path: ${rewrittenPath}`);
                        return NextResponse.rewrite(new URL(rewrittenPath, request.url));
                    } else {
                        console.log(`No company found for subdomain: ${subdomain}`);
                        return new NextResponse(
                            JSON.stringify({ message: `Invalid subdomain(${subdomain}) or store not found` }),
                            { status: 404, headers: { "Content-Type": "application/json" } }
                        );
                    }
                } catch (error) {
                    console.error(`Error processing subdomain ${subdomain}:`, error);
                    return new NextResponse(
                        JSON.stringify({ message: "An error occurred while processing your request", error }),
                        { status: 500, headers: { "Content-Type": "application/json" } }
                    );
                }
            } else {
                return NextResponse.next();
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.error("Middleware error:", error);
        const url = request.nextUrl.clone();
        url.host = process.env.MAIN_DOMAIN!;
        url.pathname = "/error";
        return NextResponse.redirect(url);
    }
}

// ✅ **Apply middleware only to non-static and non-API routes**
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
