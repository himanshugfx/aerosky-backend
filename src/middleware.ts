import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isAllowedIp } from "@/lib/networkGuard";

export default withAuth(
    function middleware(req) {
        // 1. IP Filtering Check
        if (!isAllowedIp(req)) {
            return new NextResponse(
                JSON.stringify({ error: "Access Denied: You must be connected to the authorized WiFi network." }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
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
