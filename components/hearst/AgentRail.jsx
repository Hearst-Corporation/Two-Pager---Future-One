'use client';

// AgentRail — chat agent (Kimi K2.6) ancré à droite du cockpit Hearst.
// L'agent peut :
//   - naviguer entre les pages (router.push)
//   - modifier des params du simulator (CustomEvent → reducer)
//   - chercher dans la PUBLIC_SOURCES_LIBRARY (server-side tool)
//   - résumer les market signals (server-side tool)
//
// Architecture client/server :
//   client → POST /api/admin/hearst/agent/chat { messages, context }
//          ← { reply, actions[], tool_traces[] }
//   client exécute les actions : navigate / set_simulator_param

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export const SIMULATOR_PARAM_EVENT = 'hearst.simulator.set_param';

export default function AgentRail() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const dispatchActions = useCallback((actions) => {
    if (!Array.isArray(actions) || actions.length === 0) return;
    for (const a of actions) {
      if (a.type === 'navigate' && typeof a.path === 'string') {
        router.push(a.path);
      } else if (a.type === 'set_simulator_param') {
        window.dispatchEvent(new CustomEvent(SIMULATOR_PARAM_EVENT, { detail: { field: a.field, value: a.value, why: a.why } }));
      }
    }
  }, [router]);

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    const userMsg = { role: 'user', content: trimmed };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setSending(true);

    try {
      const r = await fetch('/api/admin/hearst/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory,
          context: { pathname },
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      const assistantMsg = {
        role: 'assistant',
        content: data.reply || '(no reply)',
        actions: data.actions || [],
        tool_traces: data.tool_traces || [],
      };
      setMessages(m => [...m, assistantMsg]);
      dispatchActions(data.actions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }, [messages, sending, pathname, dispatchActions]);

  function onSubmit(e) {
    e.preventDefault();
    send(input);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const suggestions = [
    'Va au simulateur',
    'Mets 100 MW',
    'Quel est le prix wholesale colo en moyenne ?',
    'Quoi de neuf côté GPU ?',
  ];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Hearst agent"
        style={S.bubble}
      >
        💬
      </button>
    );
  }

  return (
    <aside aria-label="Hearst agent" style={S.rail}>
      <header style={S.head}>
        <div style={S.title}>Agent</div>
        <button type="button" onClick={() => setOpen(false)} style={S.closeBtn} aria-label="Close agent">×</button>
      </header>

      <div ref={scrollRef} style={S.stream}>
        {messages.length === 0 && (
          <div style={S.empty}>
            <p style={S.emptyTitle}>Demande-moi.</p>
            <p style={S.emptyHint}>Je peux naviguer, modifier le simulateur, chercher dans les sources, résumer les news.</p>
            <div style={S.suggestList}>
              {suggestions.map(s => (
                <button key={s} type="button" onClick={() => send(s)} style={S.suggestBtn}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {sending && (
          <div style={{ ...S.bubbleMsg, ...S.bubbleAsst }}>
            <span style={S.typing}>…</span>
          </div>
        )}

        {error && <div style={S.errBlock}>Error: {error}</div>}
      </div>

      <form onSubmit={onSubmit} style={S.form}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Pose une question, donne un ordre…"
          rows={2}
          style={S.input}
        />
        <button type="submit" disabled={sending || !input.trim()} style={S.send}>
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </aside>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div style={{ ...S.bubbleMsg, ...(isUser ? S.bubbleUser : S.bubbleAsst) }}>
      <div style={S.bubbleBody}>{message.content}</div>
      {!isUser && message.actions?.length > 0 && (
        <div style={S.actionList}>
          {message.actions.map((a, i) => (
            <span key={i} style={S.actionChip}>
              {a.type === 'navigate' && `→ ${a.path}`}
              {a.type === 'set_simulator_param' && `${a.field} = ${typeof a.value === 'string' ? a.value : JSON.stringify(a.value)}`}
            </span>
          ))}
        </div>
      )}
      {!isUser && message.tool_traces?.length > 0 && (
        <div style={S.toolTraces}>
          {message.tool_traces.map((t, i) => (
            <span key={i} style={S.toolTrace}>{t.tool}</span>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  bubble: {
    position: 'fixed', right: 16, bottom: 16, zIndex: 50,
    width: 48, height: 48, borderRadius: '50%',
    background: 'var(--cp-accent)', color: 'var(--cp-text-strong)',
    border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    fontSize: 20, cursor: 'pointer',
  },

  rail: {
    position: 'fixed', right: 0, top: 80, bottom: 80,
    width: 'var(--cp-rail-right, 360px)', maxWidth: '90vw',
    zIndex: 30,
    display: 'flex', flexDirection: 'column',
    background: 'var(--cp-surface-1, var(--cp-surface-2))',
    borderLeft: '1px solid var(--cp-border)',
  },

  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--cp-border)',
  },
  title: { fontSize: 13, fontWeight: 800, color: 'var(--cp-text-primary)', letterSpacing: 0.5, textTransform: 'uppercase' },
  closeBtn: {
    width: 28, height: 28, borderRadius: 6,
    background: 'transparent', border: 'none', color: 'var(--cp-text-muted)',
    cursor: 'pointer', fontSize: 18, lineHeight: 1,
  },

  stream: {
    flex: 1, overflowY: 'auto',
    padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },

  empty: { display: 'flex', flexDirection: 'column', gap: 12 },
  emptyTitle: { fontSize: 14, fontWeight: 700, color: 'var(--cp-text-primary)', margin: 0 },
  emptyHint: { fontSize: 12, color: 'var(--cp-text-muted)', margin: 0, lineHeight: 1.5 },
  suggestList: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 },
  suggestBtn: {
    padding: '10px 12px', textAlign: 'left',
    background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)',
    borderRadius: 8, color: 'var(--cp-text-body)', fontSize: 12,
    cursor: 'pointer', font: 'inherit',
  },

  bubbleMsg: {
    padding: '10px 12px', borderRadius: 10,
    fontSize: 13, lineHeight: 1.5,
    maxWidth: '92%', display: 'flex', flexDirection: 'column', gap: 8,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    background: 'var(--cp-accent)', color: 'var(--cp-text-strong)',
  },
  bubbleAsst: {
    alignSelf: 'flex-start',
    background: 'var(--cp-surface-2)', color: 'var(--cp-text-body)',
    border: '1px solid var(--cp-border)',
  },
  bubbleBody: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  typing: { fontSize: 20, letterSpacing: 4, color: 'var(--cp-text-muted)' },

  actionList: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  actionChip: {
    fontSize: 10, fontWeight: 700, padding: '3px 8px',
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)',
    color: 'var(--cp-text-muted)', borderRadius: 999, letterSpacing: 0.3,
    fontFamily: 'ui-monospace, monospace',
  },
  toolTraces: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  toolTrace: {
    fontSize: 9, fontWeight: 700, padding: '2px 6px',
    background: 'transparent', border: '1px dashed var(--cp-border)',
    color: 'var(--cp-text-muted)', borderRadius: 4, letterSpacing: 0.3,
    fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase',
  },

  errBlock: {
    padding: '8px 12px', fontSize: 11,
    background: 'var(--cp-accent-soft)', color: 'var(--cp-accent)',
    border: '1px solid var(--cp-accent)', borderRadius: 8,
  },

  form: {
    display: 'flex', gap: 8, padding: 12,
    borderTop: '1px solid var(--cp-border)',
    background: 'var(--cp-surface-2)',
  },
  input: {
    flex: 1, resize: 'none',
    padding: '8px 12px', fontSize: 13, fontFamily: 'inherit',
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)',
    color: 'var(--cp-text-primary)', borderRadius: 8,
  },
  send: {
    padding: '0 16px', fontSize: 12, fontWeight: 800,
    background: 'var(--cp-accent)', color: 'var(--cp-text-strong)',
    border: 'none', borderRadius: 8, cursor: 'pointer', letterSpacing: 0.3,
  },
};
