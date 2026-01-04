/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // ✅ Fix 1: reactCompiler is now a top-level key (moved from experimental)
  reactCompiler: false, // Or true, if you want to enable it

  // Security: Remove X-Powered-By header
  poweredByHeader: false,

  // ✅ Fix 2: Remove the entire 'eslint' object from here.
  // eslint configuration now belongs in eslint.config.js

  // Security: Output standalone for better isolation
  output: 'standalone',

  // Security: Remove console in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // RSC Security: external packages
  serverExternalPackages: [
    '@prisma/client',
    'bcryptjs',
    '@prisma/adapter-pg',
    'nodemailer'
  ],

  // Security: Configure images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Headers configuration with security headers
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      }
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;