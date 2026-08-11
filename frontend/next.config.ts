import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  // Compress pages with gzip
  compress: true,

  // Optimize images: serve WebP automatically
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // Cache images 24h
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // HTTP cache headers for static assets and API proxy
  async headers() {
    return [
      {
        // Cache static files (images, fonts, icons) for 1 year
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache public images for 24h
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },

  // Rewrite /api/* → backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
