'use client';
/* ============================================================
   HEARST ADVISOR — CHAT CONTAINER
   ------------------------------------------------------------
   Chat container rendered inside the right rail.
   Streams responses from /api/admin/hearst/advisor.
   Wrappers (LocalPanel, LocalHeader, LocalComposer, LocalCard)
   are defined locally — do not import from @/components/layout.
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from 'react';

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

/* ── Local dot indicator (replaces OpenClaw StatusIndicator) ── */
function Dot({ variant = 'online', size = 8, pulse = false }) {
  const color =
    variant === 'active'  ? 'var(--cp-accent-strong)' :
    variant === 'online'  ? 'var(--cp-success)' :
    variant === 'away'    ? 'var(--cp-warning)' :
    variant === 'busy'    ? 'var(--cp-error)' :
                            'var(--cp-text-muted)';
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        animation: pulse ? 'cp-pulse 2s ease-in-out infinite' : 'none',
      }}
    />
  );
}

/* ── Local wrappers — cockpit glass ─────────────────────────── */

function LocalPanel({ header, children }) {
  return (
    <div style={SW.panel}>
      {header && <div style={SW.panelHeader}>{header}</div>}
      <div style={SW.panelBody}>{children}</div>
    </div>
  );
}

function LocalHeader({ title, subtitle, badge, actions }) {
  return (
    <div style={SW.header}>
      <div style={SW.headerLeft}>
        <div style={SW.headerTitle}>{title}</div>
        {subtitle && <div style={SW.headerSub}>{subtitle}</div>}
      </div>
      <div style={SW.headerRight}>
        {badge && <span style={SW.badge}>{badge}</span>}
        {actions}
      </div>
    </div>
  );
}

function LocalComposer({ children }) {
  return <div style={SW.composer}>{children}</div>;
}

function LocalCard({ children }) {
  return <div style={SW.localCard}>{children}</div>;
}

/* Wrapper styles */
const SW = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg)',
    overflow: 'hidden',
  },
  panelHeader: {
    flexShrink: 0,
    borderBottom: '1px solid var(--cp-border)',
    background: 'var(--cp-surface-1)',
  },
  panelBody: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 'var(--cp-space-3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-3)',
    padding: 'var(--cp-space-3) var(--cp-space-4)',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
  },
  headerTitle: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
    color: 'var(--cp-text-strong)',
  },
  headerSub: {
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
  },
  badge: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
    color: 'var(--cp-accent-strong)',
    background: 'var(--cp-accent-soft)',
    border: '1px solid var(--cp-border-accent)',
    borderRadius: 'var(--cp-radius-xs)',
    padding: '2px var(--cp-space-2)',
  },
  composer: {
    flexShrink: 0,
    borderTop: '1px solid var(--cp-border)',
    padding: 'var(--cp-space-3)',
    background: 'var(--cp-surface-1)',
  },
  localCard: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg)',
    padding: 'var(--cp-space-4)',
  },
};

/* ── Main component ─────────────────────────────────────────── */

export default function ChatContainer({
  project,
  pageContext,
  onMutationDetected,
}) {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [hadMutation, setHadMutation] = useState(false);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const suggestedPrompts = pageContext?.suggestedPrompts?.length
    ? pageContext.suggestedPrompts
    : DEFAULT_PROMPTS;
  const pageTitle = pageContext?.title || 'HEARST';

  const send = useCallback(async (userText) => {
    if (!project?.id || !userText.trim() || streaming) return;
    setError(null);

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
  }, [project?.id, conversationId, messages, streaming, onMutationDetected, pageContext]);

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
    <LocalPanel
      header={
        <LocalHeader
          title="HEARST Advisor"
          subtitle={`Helping with: ${pageTitle}`}
          badge="AI"
          actions={
            <button
              type="button"
              onClick={newConversation}
              className="cockpit-btn-glass"
              style={S.iconBtn}
              title="New conversation"
              aria-label="New conversation"
            >+</button>
          }
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Quick prompt chips */}
        <div style={S.chipsRow}>
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              disabled={streaming}
              style={{ ...S.chip, opacity: streaming ? 0.5 : 1 }}
              title={prompt}
            >
              {prompt.length > 38 ? prompt.slice(0, 36) + '...' : prompt}
            </button>
          ))}
        </div>

        {/* Messages area */}
        <div ref={scrollRef} style={S.messages}>
          {messages.length === 0 && !streaming && (
            <LocalCard>
              <div style={S.emptyTitle}>Hi</div>
              <div style={S.emptyBody}>
                I have full context of the <strong>{pageTitle}</strong> page on <strong>{project?.name || 'HEARST'}</strong>.
                I can audit, fill, explain, source, stress-test, and export. Use a chip above or ask anything.
              </div>
            </LocalCard>
          )}

          {messages.map((m, idx) => (
            <div key={idx} style={{ ...S.messageWrap, ...(m.role === 'user' ? S.messageUser : S.messageAssistant) }}>
              <div style={S.messageMeta}>
                <Dot variant={m.role === 'user' ? 'online' : 'active'} size={6} />
                <span style={S.messageRole}>{m.role === 'user' ? 'You' : 'Advisor'}</span>
              </div>
              <div style={S.messageContent}>
                {m.content?.map((block, bidx) => {
                  if (block.type === 'text') return <span key={bidx}>{block.text}</span>;
                  if (block.type === 'tool_use') return (
                    <div key={bidx} style={S.toolCard}>
                      <div style={S.toolName}>Tool: {block.name}</div>
                      <div style={S.toolStatus}>{block.status}</div>
                    </div>
                  );
                  return null;
                })}
              </div>
            </div>
          ))}

          {streaming && (
            <div style={S.streamingHint}>
              <Dot variant="active" size={7} pulse />
              <span style={{ color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)' }}>Working...</span>
            </div>
          )}

          {error && (
            <div style={S.errorBox}>⚠ {error}</div>
          )}

          {hadMutation && !streaming && (
            <div style={S.mutationHint}>
              <span>Data updated.</span>
              <button type="button" style={S.reloadBtn} onClick={() => onMutationDetected?.()} aria-label="Refresh data">Refresh</button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0 }} />

        {/* Composer */}
        <LocalComposer>
          <form onSubmit={onSubmit} style={S.composerForm}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={streaming ? 'Working...' : 'Ask anything (Enter to send, Shift+Enter newline)'}
              rows={2}
              disabled={streaming}
              style={S.textarea}
              aria-label="Your message"
            />
            <button
              type="submit"
              className="cockpit-btn-primary"
              disabled={streaming || !input.trim()}
              style={{ ...S.sendBtn, opacity: streaming || !input.trim() ? 0.4 : 1 }}
            >
              {streaming ? '...' : 'Send'}
            </button>
          </form>
        </LocalComposer>
      </div>
    </LocalPanel>
  );
}

const S = {
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 'var(--cp-radius-xs)',
    cursor: 'pointer',
    fontSize: 'var(--cp-font-md)',
    lineHeight: 1,
    transition: 'background var(--cp-dur-fast) var(--cp-ease)',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--cp-space-2)',
    marginBottom: 'var(--cp-space-3)',
    flexShrink: 0,
  },
  chip: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-semibold)',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    color: 'var(--cp-text-body)',
    padding: 'var(--cp-space-1) var(--cp-space-3)',
    borderRadius: 'var(--cp-radius-pill)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background var(--cp-dur-fast) var(--cp-ease), border-color var(--cp-dur-fast) var(--cp-ease), color var(--cp-dur-fast) var(--cp-ease)',
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    paddingBottom: 'var(--cp-space-3)',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  messageWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-3)',
    borderRadius: 'var(--cp-radius-md)',
  },
  messageUser: {
    background: 'var(--cp-surface-2)',
    borderLeft: '2px solid var(--cp-accent-strong)',
  },
  messageAssistant: {
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
  },
  messageMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
  },
  messageRole: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wider)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  messageContent: {
    fontSize: 'var(--cp-font-base)',
    lineHeight: 1.55,
    color: 'var(--cp-text-strong)',
    whiteSpace: 'pre-wrap',
  },
  toolCard: {
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    padding: 'var(--cp-space-3)',
    marginTop: 'var(--cp-space-2)',
  },
  toolName: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-accent)',
  },
  toolStatus: {
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  streamingHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-3)',
  },
  errorBox: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-error)',
    background: 'var(--cp-error-bg)',
    border: '1px solid var(--cp-error)',
    padding: 'var(--cp-space-3)',
    borderRadius: 'var(--cp-radius-md)',
  },
  mutationHint: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-3)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    fontSize: 'var(--cp-font-sm)',
    color: 'var(--cp-text-body)',
  },
  reloadBtn: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    background: 'var(--cp-accent-strong)',
    color: 'var(--cp-text-strong)',
    border: 'none',
    padding: 'var(--cp-space-1) var(--cp-space-3)',
    borderRadius: 'var(--cp-radius-xs)',
    cursor: 'pointer',
  },
  emptyTitle: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-bold)',
    marginBottom: 'var(--cp-space-2)',
    color: 'var(--cp-text-strong)',
  },
  emptyBody: {
    color: 'var(--cp-text-body)',
    lineHeight: 1.5,
    fontSize: 'var(--cp-font-base)',
  },
  composerForm: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 'var(--cp-space-2)',
  },
  textarea: {
    flex: 1,
    fontFamily: 'inherit',
    fontSize: 'var(--cp-font-base)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    color: 'var(--cp-text-strong)',
    resize: 'none',
    lineHeight: 1.45,
    minHeight: 40,
  },
  sendBtn: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    border: 'none',
    padding: 'var(--cp-space-2) var(--cp-space-4)',
    borderRadius: 'var(--cp-radius-md)',
    cursor: 'pointer',
    transition: 'opacity var(--cp-dur-fast) var(--cp-ease)',
    height: 40,
  },
};
