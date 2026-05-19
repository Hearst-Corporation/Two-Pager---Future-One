'use client';

import { useEffect } from 'react';
import { bridgeHubSession, onHubSessionChange } from '@hearst/hub-sdk';
import { getBrowserClient } from '@/lib/supabase-browser';

/**
 * Bridge la session Supabase depuis le hub Hearst.
 * À monter au top du layout authentifié (admin/hearst).
 */
export function HubSessionBridge() {
  useEffect(() => {
    const sb = getBrowserClient();
    void bridgeHubSession(sb);
    const unsubscribe = onHubSessionChange(async (session) => {
      if (!session) {
        await sb.auth.signOut();
        return;
      }
      await sb.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    });
    return () => unsubscribe();
  }, []);
  return null;
}
