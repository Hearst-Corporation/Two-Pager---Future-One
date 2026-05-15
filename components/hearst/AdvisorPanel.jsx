'use client';
// components/hearst/AdvisorPanel.jsx
// HEARST Advisor — floating chat panel on every HEARST tab.
// Receives per-page context via the `pageContext` prop, so the same advisor
// gives page-aware help (Assumptions field hints, Risks mitigation strategies,
// Sources triangulation suggestions, etc.).

import { useEffect, useRef, useState, useCallback } from 'react';
import AdvisorMessage from './AdvisorMessage';

const WRITE_TOOLS = new Set([
  'update_scenario', 'create_source', 'attach_source_to_scenario',
  'create_scenario', 'add_pipeline_prospect', 'update_data_room_item',
]);

const DEFAULT_PROMPTS = [
  'Audit gaps and give 3 next actions',
  'Fill the Base Case with sourced Qatar defaults',
  'Generate an investor report',
  'Run a stress test on the active scenario',
];

const LS_OPEN = 'hearst.advisor.open';

const ADVISOR_CSS = `
@keyframes advisor-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
.advisor-launcher:hover { transform: translateY(-1px); box-shadow: 0 14px 36px rgba(0,0,0,0.32); }
.advisor-launcher:active { transform: translateY(0); }
.advisor-quickchip:hover { background: var(--color-bg-secondary); border-color: var(--color-accent-strong); color: var(--color-text-primary); }
.advisor-iconbtn:hover { background: rgba(255,255,255,0.16); }
.advisor-sendbtn:hover:not(:disabled) { background: var(--color-accent-strong); filter: brightness(1.05); }
`;

export default function AdvisorPanel({
  project,
  pageContext,
  onMutationDetected,
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [hadMutation, setHadMutation] = useState(false);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);

  // Open/close persistence (after mount to avoid hydration mismatch)
  useEffect(() => {
    setMounted(true);
    try { if (localStorage.getItem(LS_OPEN) === '1') setOpen(true); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(LS_OPEN, open ? '1' : '0'); } catch { /* ignore */ }
  }, [open, mounted]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming, open]);

  const suggestedPrompts = pageContext?.suggestedPrompts?.length
    ? pageContext.suggestedPrompts
    : DEFAULT_PROMPTS;
  const pageTitle = pageContext?.title || 'HEARST';

  const send = useCallback(async (userText) => {
    if (!project?.id || !userText.trim() || streaming) return;
    setError(null);
    if (!open) setOpen(true);

    const userMsg = { role: 'user', content: [{ type: 'text', text: userText }] };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    let assistantBlocks = [];
    let pendingToolCalls = {};
    const flushAssistant = () => {
      setMessages(prev => {
        const copy = [...prev];
        if (copy[copy.length - 1]?.role === 'assistant') {
          copy[copy.length - 1] = { role: 'assistant', content: [...assistantBlocks] };
        } else copy.push({ role: 'assistant', content: [...assistantBlocks] });
        return copy;
      });
    };

    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let mutationSeen = false;

    try {
      const res = await fetch('/api/admin/hearst/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          conversation_id: conversationId,
          messages: nextMessages,
          page_context: pageContext || null,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let activeTextBlockIdx = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n\n');
        buf = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line) continue;
          const dataLine = line.startsWith('data:') ? line.slice(5).trim() : line;
          let event;
          try { event = JSON.parse(dataLine); } catch { continue; }

          if (event.type === 'conversation_id') setConversationId(event.value);
          if (event.type === 'text_delta') {
            if (activeTextBlockIdx == null) {
              assistantBlocks.push({ type: 'text', text: '' });
              activeTextBlockIdx = assistantBlocks.length - 1;
            }
            assistantBlocks[activeTextBlockIdx].text += event.text;
            flushAssistant();
          }
          if (event.type === 'tool_use_start') {
            activeTextBlockIdx = null;
            const ix = assistantBlocks.length;
            pendingToolCalls[event.id] = { idx: ix, name: event.name, input: '', status: 'running' };
            assistantBlocks.push({ type: 'tool_use', id: event.id, name: event.name, input: '', status: 'running' });
            flushAssistant();
          }
          if (event.type === 'tool_use_delta') {
            const t = pendingToolCalls[event.id];
            if (t) {
              t.input += event.input;
              assistantBlocks[t.idx].input = t.input;
              flushAssistant();
            }
          }
          if (event.type === 'tool_result') {
            const t = pendingToolCalls[event.id];
            if (t) {
              t.status = event.is_error ? 'error' : 'done';
              t.result = event.result;
              assistantBlocks[t.idx].status = t.status;
              assistantBlocks[t.idx].result = t.result;
              assistantBlocks[t.idx].is_error = event.is_error;
              if (!event.is_error && WRITE_TOOLS.has(t.name)) mutationSeen = true;
              flushAssistant();
            }
          }
          if (event.type === 'done') break;
          if (event.type === 'error') throw new Error(event.message || 'Stream error');
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setStreaming(false);
      abortRef.current = null;
      if (mutationSeen) {
        setHadMutation(true);
        if (typeof onMutationDetected === 'function') onMutationDetected();
      }
    }
  }, [project?.id, conversationId, messages, streaming, onMutationDetected, open, pageContext]);

  const onSubmit = (e) => {
    e?.preventDefault?.();
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput('');
    send(text);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); }
  };

  const newConversation = () => {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setError(null);
    setHadMutation(false);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADVISOR_CSS }} />

      {/* Floating launcher (visible when collapsed) */}
      {!open && (
        <button
          className="advisor-launcher"
          onClick={() => setOpen(true)}
          style={S.launcher}
          title={`Open HEARST Advisor — page: ${pageTitle}`}
          aria-label="Open HEARST Advisor"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z" />
          </svg>
          <span style={S.launcherBadge}>AI</span>
        </button>
      )}

      {/* Floating panel (visible when open) */}
      {open && (
        <aside style={S.panel} aria-label="HEARST Advisor">
          <div style={S.header}>
            <div style={S.headerTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent-strong)' }}>
                <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z" fill="currentColor" />
              </svg>
              <span>HEARST Advisor</span>
              <span style={S.modelBadge}>Opus 4.7</span>
            </div>
            <div style={S.headerActions}>
              <button className="advisor-iconbtn" onClick={newConversation} title="New conversation" style={S.iconBtn}>＋</button>
              <button className="advisor-iconbtn" onClick={() => setOpen(false)} title="Close panel" style={S.iconBtn}>✕</button>
            </div>
          </div>

          {/* Page context strip — shows the advisor is aware of the active tab */}
          <div style={S.contextStrip}>
            <span style={S.contextLabel}>HELPING WITH</span>
            <span style={S.contextValue}>{pageTitle}</span>
          </div>

          <div style={S.quickActions}>
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                className="advisor-quickchip"
                onClick={() => send(prompt)}
                disabled={streaming}
                style={{ ...S.quickChip, opacity: streaming ? 0.5 : 1 }}
                title={prompt}
              >
                {/* Show first 4-5 words as label, full prompt in tooltip */}
                {prompt.length > 38 ? prompt.slice(0, 36) + '…' : prompt}
              </button>
            ))}
          </div>

          <div ref={scrollRef} style={S.messages}>
            {messages.length === 0 && !streaming && (
              <div style={S.empty}>
                <div style={S.emptyTitle}>Hi 👋</div>
                <div style={S.emptyBody}>
                  I have full context of the <strong>{pageTitle}</strong> page on <strong>{project?.name || 'HEARST'}</strong>.
                  I can audit, fill, explain, source, stress-test, and export. Use a chip above or ask anything.
                </div>
              </div>
            )}
            {messages.map((m, idx) => <AdvisorMessage key={idx} message={m} />)}
            {streaming && (
              <div style={S.streamingHint}>
                <span style={S.streamDot} /> <span>Working…</span>
              </div>
            )}
            {error && <div style={S.errorBox}>⚠ {error}</div>}
            {hadMutation && !streaming && (
              <div style={S.mutationHint}>
                <span>Data updated.</span>
                <button style={S.reloadBtn} onClick={() => onMutationDetected?.()}>Refresh</button>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} style={S.composer}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={streaming ? 'Working…' : 'Ask anything (⏎ to send, ⇧+⏎ newline)'}
              rows={2}
              disabled={streaming}
              style={S.textarea}
              aria-label="Your message"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="advisor-sendbtn"
              style={{ ...S.sendBtn, opacity: streaming || !input.trim() ? 0.4 : 1 }}
            >
              {streaming ? '…' : 'Send'}
            </button>
          </form>
        </aside>
      )}
    </>
  );
}

const PANEL_W = 420;
const PANEL_H = 640;
const EDGE_GAP = 20;

const S = {
  launcher: {
    position: 'fixed',
    right: EDGE_GAP, bottom: EDGE_GAP,
    width: 56, height: 56, borderRadius: 28,
    background: 'linear-gradient(135deg, var(--color-gray-900) 0%, var(--color-gray-800) 100%)',
    color: 'var(--color-text-inverse)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
    zIndex: 80,
    fontFamily: '"Inter", sans-serif',
    transition: 'transform .15s ease, box-shadow .15s ease',
  },
  launcherBadge: {
    position: 'absolute', top: -4, right: -4,
    background: 'var(--color-accent-strong)', color: 'var(--color-text-inverse)',
    fontSize: 8, fontWeight: 900, letterSpacing: 0.5,
    padding: '2px 5px', borderRadius: 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  },
  panel: {
    position: 'fixed',
    right: EDGE_GAP, bottom: EDGE_GAP,
    width: PANEL_W, height: PANEL_H, maxHeight: 'calc(100vh - 40px)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 12,
    boxShadow: '0 24px 60px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.02)',
    display: 'flex', flexDirection: 'column',
    fontFamily: '"Inter", sans-serif',
    overflow: 'hidden',
    zIndex: 80,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 14px',
    background: 'linear-gradient(135deg, var(--color-gray-900) 0%, var(--color-gray-800) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  headerTitle: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-inverse)', fontSize: 13, fontWeight: 700 },
  modelBadge: {
    fontSize: 9, fontWeight: 800, letterSpacing: 1.2,
    padding: '2px 7px', borderRadius: 3,
    background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)',
  },
  headerActions: { display: 'flex', gap: 4 },
  iconBtn: {
    width: 26, height: 26, borderRadius: 4, border: 'none',
    background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-inverse)',
    cursor: 'pointer', fontSize: 13, lineHeight: 1,
    transition: 'background .12s ease',
  },
  contextStrip: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 14px',
    background: 'var(--color-bg-secondary)',
    borderBottom: '1px solid var(--color-border-light)',
    fontSize: 11,
  },
  contextLabel: {
    fontSize: 9, fontWeight: 800, letterSpacing: 1.5,
    color: 'var(--color-text-muted)',
  },
  contextValue: {
    fontSize: 11, fontWeight: 700,
    color: 'var(--color-accent-strong)',
  },
  quickActions: {
    display: 'flex', flexWrap: 'wrap', gap: 5,
    padding: '10px 12px',
    borderBottom: '1px solid var(--color-border-light)',
    background: 'var(--color-surface)',
  },
  quickChip: {
    fontSize: 10.5, fontWeight: 600,
    background: 'var(--color-bg-main)',
    border: '1px solid var(--color-border-light)',
    color: 'var(--color-text-secondary)',
    padding: '5px 11px', borderRadius: 16, cursor: 'pointer',
    fontFamily: '"Inter", sans-serif',
    transition: 'background .12s ease, border-color .12s ease, color .12s ease',
  },
  messages: {
    flex: 1, overflowY: 'auto',
    padding: '12px 14px 8px 14px',
    background: 'var(--color-bg-main)',
  },
  empty: {
    padding: 14,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 8,
    fontSize: 12.5,
  },
  emptyTitle: { fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-text-primary)' },
  emptyBody: { color: 'var(--color-text-muted)', lineHeight: 1.5 },
  streamingHint: {
    display: 'flex', alignItems: 'center', gap: 7,
    color: 'var(--color-text-muted)', fontSize: 11, padding: '8px 4px',
  },
  streamDot: {
    display: 'inline-block', width: 7, height: 7, borderRadius: 4,
    background: 'var(--color-accent-strong)',
    animation: 'advisor-pulse 1s ease-in-out infinite',
  },
  errorBox: {
    fontSize: 11, fontWeight: 600,
    color: 'var(--color-error)',
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-light)',
    padding: '7px 10px', borderRadius: 6, marginTop: 8,
  },
  mutationHint: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, marginTop: 8, padding: '8px 12px',
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 6, fontSize: 11.5, color: 'var(--color-text-secondary)',
  },
  reloadBtn: {
    fontSize: 10.5, fontWeight: 700,
    background: 'var(--color-accent-strong)', color: 'var(--color-text-inverse)',
    border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer',
  },
  composer: {
    display: 'flex', alignItems: 'flex-end', gap: 6,
    padding: 10,
    borderTop: '1px solid var(--color-border-light)',
    background: 'var(--color-surface)',
  },
  textarea: {
    flex: 1, fontFamily: 'inherit', fontSize: 12.5,
    background: 'var(--color-bg-main)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 6, padding: '8px 10px',
    color: 'var(--color-text-primary)',
    resize: 'none', outline: 'none',
    lineHeight: 1.45,
  },
  sendBtn: {
    fontSize: 11, fontWeight: 700,
    background: 'var(--color-gray-900)', color: 'var(--color-text-inverse)',
    border: 'none', padding: '9px 14px', borderRadius: 6, cursor: 'pointer',
    transition: 'background .12s ease, filter .12s ease',
  },
};
