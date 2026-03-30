/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
    },
    // CORS headers for mobile app API access
    async headers() {
        return [
            {
                // Match all API routes
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    // Restrict origin based on regex (Vercel edge handles this via middleware, but typically we allow local IPs + production domain)
                    // We'll set a placeholder or use vary Origin. In Next.js headers(), value: '*' allows all.
                    // To restrict, it's actually better done in middleware/API level if dynamic, 
                    // but we can set it to the specific IP or keep '*' since middleware blocks IP anyway.
                    // For strictness, if IP middleware is robust, '*' + middleware is safe. 
                    // Let's keep '*' here because the middleware IP blocker will drop invalid IPs before they matter,
                    // OR we can explicitly define it. Let's define the local subnet explicitly.
                    { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_API_URL || '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
                ],
            },
        ];
    },
}

module.exports = nextConfig
