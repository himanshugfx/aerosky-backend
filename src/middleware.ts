import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { isAllowedIp } from "@/lib/networkGuard";

// 1. Wrap your NextAuth logic
const authMiddleware = withAuth(
    function middleware(req: NextRequestWithAuth) {
        // Auth Check - Skip for mobile auth routes and other public APIs
        const publicPaths = ["/api/mobile/auth", "/api/auth", "/unauthorized", "/login", "/register", "/forgot-password"];
        const isPublicPath = publicPaths.some(path => 
            req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
        );
        
        if (isPublicPath) {
            return NextResponse.next();
        }

        const token = req.nextauth?.token;
        const isAuth = !!token;
        const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

        if (isAdminPage && !isAuth) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }: { token: any, req: NextRequest }) => {
                const publicPaths = ["/api/mobile/auth", "/api/auth", "/unauthorized", "/login", "/register", "/forgot-password"];
                const isPublicPath = publicPaths.some(path => 
                    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
                );
                if (isPublicPath) return true;
                return !!token;
            },
        },
    }
);

// 2. Export a top-level middleware properly intercepting the request first
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
    // Top-Level IP Filtering Check
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = req.ip || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 'unknown';
    
    // Only redirect to unauthorized if they aren't already on the unauthorized page
    const isUnauthorizedPage = req.nextUrl.pathname === "/unauthorized" || req.nextUrl.pathname.startsWith("/unauthorized/");

    if (!isAllowedIp(req) && !isUnauthorizedPage) {
        if (req.nextUrl.pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "Access Denied: Your IP is not authorized.", ip: clientIp },
                { 
                    status: 403,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    }
                }
            );
        }
        // Redirect web pages to unauthorized
        const unauthorizedUrl = new URL(req.nextUrl.origin + "/unauthorized");
        unauthorizedUrl.searchParams.set("ip", clientIp);
        return NextResponse.redirect(unauthorizedUrl);
    }

    // 3. Delegate to the NextAuth middleware
    // We cast req as any here because NextAuth types expect NextRequestWithAuth which is tricky to instantiate directly
    return authMiddleware(req as any, event);
}

export const config = {
    // Applied to login, register, reset links, and unauthorized as well to guarantee global coverage
    matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*", "/login", "/register", "/unauthorized"],
};
