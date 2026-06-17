const { withSentryConfig } = require('@sentry/nextjs');
const sentryUploadsEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT,
);

// Fail-fast env validation at build / boot time.
// Skipped during `next lint` / type-only passes where the runtime env is absent.
if (process.env.SKIP_ENV_VALIDATION !== 'true') {
  try {
    const { validateEnv } = require('./lib/env-validation.js');
    validateEnv();
  } catch (err) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) throw err;
    console.warn('[next.config] env validation skipped:', err.message);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false,
  },

  experimental: {
    // @sparticuz/chromium ships a native binary — must not be bundled by Next.
    // Next 14 uses serverComponentsExternalPackages (renamed serverExternalPackages in Next 15).
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core', 'puppeteer'],
    // Force Next output tracing to include the chromium binary so Vercel deploys it.
    outputFileTracingIncludes: {
      '/api/admin/hearst/strategic-memos/[id]/pdf': [
        './node_modules/@sparticuz/chromium/**/*',
        './node_modules/puppeteer-core/**/*',
      ],
    },
  },

  async redirects() {
    return [
      { source: '/', destination: '/admin/hearst', permanent: false },
    ];
  },

  // Security headers — applied to all routes
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    // unsafe-eval is required by Next.js HMR in dev only.
    // unsafe-inline on script-src is removed in prod; style-src keeps it
    // because the app uses inline styles extensively (no CSS modules/Tailwind).
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
      : "script-src 'self'";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    // Origin (scheme + host) for connect-src, and wss:// variant for realtime.
    const supabaseHost = supabaseUrl;
    const supabaseWs  = supabaseUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
    const connectSrc = ["'self'", supabaseHost, supabaseWs, 'https://maps.googleapis.com', 'https://api.openai.com']
      .filter(Boolean)
      .join(' ');
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
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self'",
              `connect-src ${connectSrc}`,
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
      // Supabase storage host derived from env (no hardcoded subdomain).
      ...((process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^https?:\/\//, '')
        ? [
            {
              protocol: 'https',
              hostname: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^https?:\/\//, ''),
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
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
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: false,
  },
  sourcemaps: {
    disable: !sentryUploadsEnabled,
    deleteSourcemapsAfterUpload: sentryUploadsEnabled,
  },
});
