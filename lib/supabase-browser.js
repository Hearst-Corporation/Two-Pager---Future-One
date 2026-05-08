'use client';

import { createBrowserClient } from '@supabase/ssr';

let _client = null;

/**
 * Lazy singleton Supabase client for client components.
 * Auto-binds to document cookies, used for sign-in / sign-out flows.
 */
export function getBrowserClient() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return _client;
}
