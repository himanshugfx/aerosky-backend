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
            // Rewrite rather than redirect so URL stays the same, or redirect if preferred.
            // Let's redirect to /unauthorized with the IP in query param for debugging
            return NextResponse.redirect(new URL(`/unauthorized?ip=${encodeURIComponent(clientIp)}`, req.url));
        }

        // 2. Auth Check
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

        if (isAdminPage && !isAuth) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*"],
};
