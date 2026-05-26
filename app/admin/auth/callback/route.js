import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { safeNextPath } from '@/lib/url-helpers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));
  const error = url.searchParams.get('error');
  const errorCode = url.searchParams.get('error_code');

  // Supabase renvoie les erreurs OTP/magic-link dans les query params
  if (error) {
    const loginUrl = url.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('next', next);
    loginUrl.searchParams.set('auth_error', errorCode || error);
    return NextResponse.redirect(loginUrl);
  }

  const target = url.clone();
  target.pathname = next;
  target.search = '';

  const res = NextResponse.redirect(target);

  if (code) {
    const supa = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: '', ...options }),
      },
    });
    await supa.auth.exchangeCodeForSession(code);
  }

  return res;
}
