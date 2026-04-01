import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isAllowedIp } from "@/lib/networkGuard";

export default withAuth(
    function middleware(req) {
        // 1. IP Filtering Check
        // We will inline the IP extraction here so we can pass it to the unauthorized page
        const forwardedFor = req.headers.get("x-forwarded-for");
        const realIp = req.headers.get("x-real-ip");
        const clientIp = req.ip || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 'unknown';
        
        if (!isAllowedIp(req)) {
            // Check if it's an API request
            if (req.nextUrl.pathname.startsWith("/api")) {
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
            // For web pages, keep the beautiful redirect
            return NextResponse.redirect(new URL(`/unauthorized?ip=${encodeURIComponent(clientIp)}`, req.url));
        }

        // 2. Auth Check - Skip for mobile auth routes and other public APIs
        const publicPaths = ["/api/mobile/auth", "/api/auth"];
        const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path));
        
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
            authorized: ({ token, req }) => {
                const publicPaths = ["/api/mobile/auth", "/api/auth", "/unauthorized"];
                const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path));
                if (isPublicPath) return true;
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*"],
};
