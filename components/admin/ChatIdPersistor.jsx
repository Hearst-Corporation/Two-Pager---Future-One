'use client';

import { useEffect } from 'react';

const LS_KEY = 'oracle:active-chat-id';

/**
 * ChatIdPersistor — wraps window.fetch to persist the cockpit chat id across
 * page reloads. The @hearst/cockpit-shell package holds the active chatId in
 * a plain in-memory module variable (see activeChatStore in dist/index.js),
 * so a page reload resets it to null and every "first call" spawns a brand
 * new chat — losing continuity.
 *
 * This effect monkey-patches fetch in two directions:
 *   - on POST /api/cockpit-chat without a chatId, it injects the saved
 *     chatId from localStorage so the server reuses the existing chat;
 *   - on every /api/cockpit-chat response, it reads the `x-chat-id` header
 *     and writes the current chatId back to localStorage.
 *
 * Net effect: the first message after a reload is sent into the previously
 * active chat. The shell still shows its WELCOME bubble until the first
 * exchange completes (it can't re-render initial state without a setter
 * exposed by the package), but the message + assistant reply land in the
 * correct conversation and history continues from there.
 */
export function ChatIdPersistor() {
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

      // Match POST /api/cockpit-chat exactly — not /api/cockpit-chats (list).
      const isCockpitChat =
        /\/api\/cockpit-chat(?:\?|$)/.test(url) &&
        (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase() ===
          'POST';

      let nextInit = init;
      if (isCockpitChat) {
        const saved = window.localStorage.getItem(LS_KEY);
        if (saved && init?.body && typeof init.body === 'string') {
          try {
            const body = JSON.parse(init.body);
            if (!body.chatId) {
              body.chatId = saved;
              nextInit = { ...init, body: JSON.stringify(body) };
            }
          } catch {
            /* not JSON — pass through */
          }
        }
      }

      const response = await originalFetch(input, nextInit);

      if (isCockpitChat) {
        try {
          const id = response.headers.get('x-chat-id');
          if (id) window.localStorage.setItem(LS_KEY, id);
        } catch {
          /* opaque response — ignore */
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}

export default ChatIdPersistor;
