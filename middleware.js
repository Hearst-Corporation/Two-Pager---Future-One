import { NextResponse } from 'next/server';

const COOKIE = 'admin_gate';

export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const expected = process.env.ADMIN_PASSWORD || '';

  // Dev autologin: skip gate AND drop the cookie so client-side fetches stay authed
  const devBypass =
    process.env.NODE_ENV !== 'production' && process.env.ADMIN_DEV_AUTOLOGIN === '1';
  if (devBypass) {
    const res = NextResponse.next();
    if (req.cookies.get(COOKIE)?.value !== expected) {
      res.cookies.set(COOKIE, expected, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  }

  // Allow the login page itself
  if (pathname === '/admin/login') return NextResponse.next();

  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie && cookie === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'],
};
