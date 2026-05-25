const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hearst/cockpit-shell'],
  reactStrictMode: true,
  devIndicators: false,

  async redirects() {
    return [
      { source: '/', destination: '/admin/hearst', permanent: false },
    ];
  },

  // Security headers — applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Pas de X-Frame-Options : il bloque toute embed cross-origin sans
          // whitelist possible. Le CSP frame-ancestors plus bas suffit.
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self'",
              "connect-src 'self' https://zrvlmhuymhyrzonnihce.supabase.co wss://zrvlmhuymhyrzonnihce.supabase.co https://maps.googleapis.com",
              "frame-ancestors 'self' http://localhost:4200 http://localhost:4201 https://oracle.hearst.app",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Image optimization — allow external Supabase storage & Google Maps
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zrvlmhuymhyrzonnihce.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  // org/project/authToken pulled from env at build time if present
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Don't upload source maps unless we explicitly want to
  widenClientFileUpload: false,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
