'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { setActiveChat } from '@hearst/cockpit-shell';
import { useSimulation } from '@/lib/hearst-simulation-context';
import {
  COCKPIT_CHAT_SEND_EVENT,
  buildChatDealPayload,
  injectChatMessageToShell,
  readScopedChatId,
  resolveChatScope,
  syncScopedChatToShell,
  writeScopedChatId,
} from '@/lib/cockpit-chat-payload';

/**
 * CockpitChatBridge — enrichit POST /api/cockpit-chat (voie A) et relaie les
 * prompts IC Advisor vers le chat CockpitShell sans hack form.submit.
 *
 * - chatId : localStorage scopé (scénario / live / page)
 * - deal   : advisorContext live (projection simulateur)
 * - oracle.pathname : page courante pour inferOracleContextFromPath
 */
export function CockpitChatBridge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { advisorContext } = useSimulation();
  const pathnameRef = useRef(pathname);
  const dealRef = useRef(null);
  const scopeRef = useRef(null);

  pathnameRef.current = pathname;
  dealRef.current = buildChatDealPayload(advisorContext);

  const memoId = searchParams?.get('memo') ?? null;
  const chatScope = useMemo(
    () => resolveChatScope(advisorContext, pathname, memoId),
    [advisorContext, pathname, memoId],
  );

  useEffect(() => {
    syncScopedChatToShell(chatScope, setActiveChat);
    scopeRef.current = chatScope;
  }, [chatScope]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalFetch = window.fetch;

    window.fetch = async (input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input?.url ?? '';

      const method = (
        init?.method ?? (input instanceof Request ? input.method : 'GET')
      ).toUpperCase();

      const isCockpitChat =
        /\/api\/cockpit-chat(?:\?|$)/.test(url) && method === 'POST';

      let nextInit = init;
      if (isCockpitChat && init?.body && typeof init.body === 'string') {
        try {
          const body = JSON.parse(init.body);
          const scope = scopeRef.current;
          const scopedId = scope ? readScopedChatId(scope) : null;
          if (scopedId) body.chatId = scopedId;
          else delete body.chatId;

          const deal = dealRef.current;
          if (deal && !body.deal) body.deal = deal;

          const path = pathnameRef.current;
          if (path) {
            body.oracle = { ...(body.oracle ?? {}), pathname: path };
          }

          nextInit = { ...init, body: JSON.stringify(body) };
        } catch {
          /* pass through */
        }
      }

      const response = await originalFetch(input, nextInit);

      if (isCockpitChat) {
        try {
          const id = response.headers.get('x-chat-id');
          const scope = scopeRef.current;
          if (id && scope) {
            writeScopedChatId(scope, id);
            setActiveChat(id);
          }
        } catch {
          /* opaque */
        }
      }

      return response;
    };

    const onSend = (e) => {
      const message = e.detail?.message;
      if (!message) return;
      injectChatMessageToShell(message);
    };
    window.addEventListener(COCKPIT_CHAT_SEND_EVENT, onSend);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener(COCKPIT_CHAT_SEND_EVENT, onSend);
    };
  }, []);

  return null;
}
