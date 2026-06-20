import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSessionProfile } from './supabase-server';

/**
 * Server-side Supabase client (service_role).
 * Targets the `crm` schema by default. Never import this from a Client Component.
 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    db: { schema: 'crm' },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolve the current user's profile in API routes. Returns either:
 *   { profile } when authenticated and authorized for `requiredRole`
 *   NextResponse  (401 / 403) when unauthorized — return it directly
 *
 * Role hierarchy: admin > editor > viewer.
 */
export async function requireProfile(requiredRole = 'viewer') {
  const session = await getSessionProfile();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const order = { viewer: 0, editor: 1, admin: 2 };
  if (order[session.profile.role] < order[requiredRole]) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { profile: session.profile };
}

/**
 * Convenience helper for routes that mutate data: returns either
 * `{ profile, supa, actor }` or a `NextResponse` (401/403).
 *
 * Defaults to requiring `editor`, but pass 'viewer' for self-only
 * mutations (e.g. marking your own notifications as read).
 *
 * `actor` is just `profile.id` — pass it directly into insert/update payloads
 * so every mutation is attributable.
 */
export async function authedWrite(requiredRole = 'editor') {
  const r = await requireProfile(requiredRole);
  if (r instanceof NextResponse) return r;
  return { profile: r.profile, actor: r.profile.id, supa: getAdminClient() };
}
