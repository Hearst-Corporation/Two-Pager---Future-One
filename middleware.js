import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PUBLIC_ROUTES = new Set(['/admin/login', '/admin/auth/callback']);

// Dev-only autologin: when NODE_ENV=development AND ADMIN_DEV_AUTOLOGIN_EMAIL is set,
// the middleware skips Supabase auth. supabase-server.js then loads the profile by email.
const DEV_AUTOLOGIN =
  process.env.NODE_ENV === 'development' && !!process.env.ADMIN_DEV_AUTOLOGIN_EMAIL;

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  if (DEV_AUTOLOGIN) {
    if (pathname === '/admin/login') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const res = NextResponse.next();
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

  if (PUBLIC_ROUTES.has(pathname)) {
    // Already logged in? bounce to /admin
    if (user && pathname === '/admin/login') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return res;
  }

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
