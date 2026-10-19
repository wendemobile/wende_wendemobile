/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: "standalone", // Removed for Vercel deployment

    // Allow all hosts for Tailscale and local development
    // This is safe because we're using Tailscale's secure network

    // Increase timeouts for slow networks
    staticPageGenerationTimeout: 120,

    // Performance optimizations for low bandwidth
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@tanstack/react-query',
            'framer-motion',
        ],
        serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    },

    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Optimize images for low bandwidth
    images: {
        unoptimized: process.env.NODE_ENV === "development",
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
        deviceSizes: [320, 420, 640, 768, 1024], // Smaller device sizes
        imageSizes: [16, 32, 48, 64, 96], // Smaller image sizes
        // Allow images from Tailscale hosts and LAN (HTTP and HTTPS)
        remotePatterns: [
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'https', hostname: 'localhost' },
            { protocol: 'http', hostname: '127.0.0.1' },
            { protocol: 'https', hostname: '127.0.0.1' },
            { protocol: 'http', hostname: '100.100.168.94' },
            { protocol: 'https', hostname: '100.75.169.101' },
            { protocol: 'http', hostname: 'tomgeneraltrading' },
            { protocol: 'https', hostname: 'tomg' },
            { protocol: 'http', hostname: '*.ts.net' },
            { protocol: 'https', hostname: '*.ts.net' },
            { protocol: 'http', hostname: 'tomgeneraltrading.tail572bbf.ts.net' },
            { protocol: 'https', hostname: 'tomgeneraltrading.tail572bbf.ts.net' },
            // Supabase storage domains
            { protocol: 'https', hostname: '**.supabase.co' },
            { protocol: 'https', hostname: '**.supabase.in' },
            { protocol: 'http', hostname: '**.supabase.co' },
            { protocol: 'http', hostname: '**.supabase.in' },
            // LAN IP ranges
            { protocol: 'http', hostname: '192.168.*.*' },
            { protocol: 'http', hostname: '10.*.*.*' },
            { protocol: 'http', hostname: '172.16.*.*' },
        ],
    },

    // Compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },

    // Enable compression
    compress: true,

    // Reduce JavaScript bundle size
    productionBrowserSourceMaps: false,

    // Faster page navigation with prefetching
    onDemandEntries: {
        maxInactiveAge: 60 * 1000,
        pagesBufferLength: 5,
    },

    // Headers for caching and CORS for Tailscale
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                // Image API routes - cache for better performance
                source: '/api/items/:id/image',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                ],
            },
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate' },
                    // Allow requests from Tailscale network
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
                ],
            },
        ];
    },
};

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
});

export default withPWA(nextConfig);
