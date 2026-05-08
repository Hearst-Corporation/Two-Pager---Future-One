import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Sign-out endpoint. Sign-in happens client-side via supabase-js
 * (magic link or password). The legacy cookie gate has been replaced
 * by Supabase Auth — this route only clears the session.
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: () => undefined,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: '', ...options }),
      },
    },
  );
  await supa.auth.signOut();
  return res;
}
