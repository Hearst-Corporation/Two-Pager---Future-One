import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { safeNextPath } from '@/lib/url-helpers';

export { safeNextPath };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PUBLIC_ROUTES = new Set(['/admin/login', '/admin/auth/callback']);
const PUBLIC_API_ROUTES = new Set(['/api/admin/login']);

// ---------------------------------------------------------------------------
// Fail-closed guard: dev-autologin must NEVER be reachable in a deployed env.
//
// On Vercel preview deployments NODE_ENV is 'production', so the previous
// NODE_ENV-only gate is insufficient. If ADMIN_DEV_AUTOLOGIN_EMAIL is set
// alongside a Vercel production/preview signal, refuse to load the module so
// the deployment fails fast rather than silently exposing autologin.
// ---------------------------------------------------------------------------
const VERCEL_ENV = process.env.VERCEL_ENV;
const IS_VERCEL_DEPLOYED = VERCEL_ENV === 'production' || VERCEL_ENV === 'preview';
if (process.env.ADMIN_DEV_AUTOLOGIN_EMAIL && IS_VERCEL_DEPLOYED) {
  throw new Error(
    '[middleware] FATAL: ADMIN_DEV_AUTOLOGIN_EMAIL is set in a Vercel ' +
      `${VERCEL_ENV} environment. Dev autologin is forbidden outside local ` +
      'development. Remove this env var from the Vercel project settings.'
  );
}

// Dev-only autologin: only honored when we are NOT on a Vercel deployed env
// AND NODE_ENV=development AND ADMIN_DEV_AUTOLOGIN_EMAIL is set.
// supabase-server.js then loads the profile by email.
const DEV_AUTOLOGIN =
  !IS_VERCEL_DEPLOYED &&
  process.env.NODE_ENV === 'development' &&
  !!process.env.ADMIN_DEV_AUTOLOGIN_EMAIL;

// Cache-Control headers for auth redirects. Mitigates Next 14.2.35
// GHSA-3g8h-86w9-wvmq (middleware/proxy redirect cache poisoning).
function applyNoStore(response) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) return NextResponse.next();

  // Pass pathname to Server Components via request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  if (DEV_AUTOLOGIN) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.next();
    }
    if (pathname === '/admin/login') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return applyNoStore(NextResponse.redirect(url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  const supa = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options) => {
        res.cookies.set({ name, value, ...options });
      },
      remove: (name, options) => {
        res.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const { data: { user } } = await supa.auth.getUser();

  if (PUBLIC_ROUTES.has(pathname) || PUBLIC_API_ROUTES.has(pathname)) {
    // Already logged in? bounce to /admin (page routes only)
    if (user && pathname === '/admin/login') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return applyNoStore(NextResponse.redirect(url));
    }
    return res;
  }

  if (!user) {
    if (pathname.startsWith('/api/admin') && !PUBLIC_API_ROUTES.has(pathname)) {
      return applyNoStore(NextResponse.json({ error: 'unauthenticated' }, { status: 401 }));
    }
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', safeNextPath(pathname));
    return applyNoStore(NextResponse.redirect(url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
