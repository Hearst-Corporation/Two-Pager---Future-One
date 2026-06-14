import { createServerClient } from '@supabase/ssr';
import { createClient as createBareClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEV_AUTOLOGIN_EMAIL =
  process.env.NODE_ENV === 'development' ? process.env.ADMIN_DEV_AUTOLOGIN_EMAIL : null;

/**
 * Per-request Supabase client bound to the user's auth cookies.
 * Use in: server components, route handlers, middleware (with adapter).
 */
export function getServerClient() {
  const store = cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      get(name) {
        return store.get(name)?.value;
      },
      set(name, value, options) {
        try {
          store.set({ name, value, ...options });
        } catch {
          /* set() is unavailable in pure server components — ignored */
        }
      },
      remove(name, options) {
        try {
          store.set({ name, value: '', ...options });
        } catch {
          /* same as above */
        }
      },
    },
  });
}

/**
 * Returns { user, profile } for the current request, or null if unauthenticated
 * or unauthorized. Forces the `crm` schema for the profile lookup.
 */
export async function getSessionProfile() {
  if (DEV_AUTOLOGIN_EMAIL) {
    const admin = createBareClient(URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'crm' },
    });
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('email', DEV_AUTOLOGIN_EMAIL)
      .maybeSingle();
    if (!profile || !profile.is_active) return null;
    return { user: { id: profile.id, email: profile.email }, profile };
  }

  const supa = getServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supa
    .schema('crm')
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !profile.is_active) return null;
  return { user, profile };
}
