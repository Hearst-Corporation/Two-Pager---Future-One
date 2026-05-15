'use client';
/* ============================================================
   OPENCLAW · CHAT CONTAINER
   ------------------------------------------------------------
   The central chat interface. Wraps the existing AdvisorPanel
   into the stable ChatPanel layout.
   This component NEVER unmounts when navigation changes.
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from 'react';
import ChatPanel, { ChatHeader, ChatComposer } from '@/components/layout/ChatPanel';
import PanelCard from '@/components/layout/PanelCard';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { TEXT, SP, T, W, LS, ACCENT, CARD } from '@/lib/design-system/tokens';

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
    <ChatPanel
      header={
        <ChatHeader
          title="HEARST Advisor"
          subtitle={`Helping with: ${pageTitle}`}
          badge="AI"
          actions={
            <>
              <button onClick={newConversation} style={S.iconBtn} title="New conversation">+</button>
            </>
          }
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Quick prompt chips */}
      <div style={S.chipsRow}>
        {suggestedPrompts.map((prompt, i) => (
          <button
            key={i}
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
          <PanelCard>
            <div style={S.emptyTitle}>Hi</div>
            <div style={S.emptyBody}>
              I have full context of the <strong>{pageTitle}</strong> page on <strong>{project?.name || 'HEARST'}</strong>.
              I can audit, fill, explain, source, stress-test, and export. Use a chip above or ask anything.
            </div>
          </PanelCard>
        )}

        {messages.map((m, idx) => (
          <div key={idx} style={{ ...S.messageWrap, ...(m.role === 'user' ? S.messageUser : S.messageAssistant) }}>
            <div style={S.messageMeta}>
              <StatusIndicator variant={m.role === 'user' ? 'online' : 'active'} size={6} />
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
            <StatusIndicator variant="active" size={7} pulse />
            <span style={{ color: TEXT.muted, fontSize: T.small }}>Working...</span>
          </div>
        )}

        {error && (
          <div style={S.errorBox}>⚠ {error}</div>
        )}

        {hadMutation && !streaming && (
          <div style={S.mutationHint}>
            <span>Data updated.</span>
            <button style={S.reloadBtn} onClick={() => onMutationDetected?.()}>Refresh</button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0 }} />

      {/* Composer */}
      <ChatComposer>
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
            disabled={streaming || !input.trim()}
            style={{ ...S.sendBtn, opacity: streaming || !input.trim() ? 0.4 : 1 }}
          >
            {streaming ? '...' : 'Send'}
          </button>
        </form>
      </ChatComposer>
    </div>
    </ChatPanel>
  );
}

const S = {
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    border: 'none',
    background: 'rgba(255,255,255,0.06)',
    color: TEXT.primary,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    transition: 'background 0.12s ease',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${SP[2]}px`,
    marginBottom: `${SP[4]}px`,
    flexShrink: 0,
  },
  chip: {
    fontSize: T.small,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${CARD.border}`,
    color: TEXT.secondary,
    padding: `${SP[2]}px ${SP[3]}px`,
    borderRadius: 16,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.12s ease, border-color 0.12s ease, color 0.12s ease',
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${SP[4]}px`,
    paddingBottom: `${SP[4]}px`,
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  messageWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${SP[2]}px`,
    padding: `${SP[3]}px`,
    borderRadius: CARD.radiusSm,
  },
  messageUser: {
    background: 'rgba(0,183,255,0.06)',
    borderLeft: `2px solid ${ACCENT.main}`,
  },
  messageAssistant: {
    background: CARD.bg,
    border: `1px solid ${CARD.border}`,
  },
  messageMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: `${SP[2]}px`,
  },
  messageRole: {
    fontSize: T.mini,
    fontWeight: W.black,
    letterSpacing: LS.caps,
    color: TEXT.muted,
    textTransform: 'uppercase',
  },
  messageContent: {
    fontSize: T.body,
    lineHeight: 1.55,
    color: TEXT.primary,
    whiteSpace: 'pre-wrap',
  },
  toolCard: {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${CARD.border}`,
    borderRadius: CARD.radiusSm,
    padding: `${SP[3]}px`,
    marginTop: `${SP[2]}px`,
  },
  toolName: {
    fontSize: T.caption,
    fontWeight: W.bold,
    color: ACCENT.strong,
  },
  toolStatus: {
    fontSize: T.micro,
    color: TEXT.muted,
    textTransform: 'uppercase',
  },
  streamingHint: {
    display: 'flex',
    alignItems: 'center',
    gap: `${SP[2]}px`,
    padding: `${SP[3]}px`,
  },
  errorBox: {
    fontSize: T.caption,
    fontWeight: 600,
    color: '#ef4444',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.20)',
    padding: `${SP[3]}px`,
    borderRadius: CARD.radiusSm,
  },
  mutationHint: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${SP[2]}px`,
    padding: `${SP[3]}px`,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${CARD.border}`,
    borderRadius: CARD.radiusSm,
    fontSize: T.small,
    color: TEXT.secondary,
  },
  reloadBtn: {
    fontSize: T.caption,
    fontWeight: W.bold,
    background: ACCENT.main,
    color: TEXT.inverse,
    border: 'none',
    padding: `${SP[1]}px ${SP[3]}px`,
    borderRadius: 4,
    cursor: 'pointer',
  },
  emptyTitle: {
    fontSize: T.h4,
    fontWeight: W.bold,
    marginBottom: `${SP[2]}px`,
    color: TEXT.primary,
  },
  emptyBody: {
    color: TEXT.secondary,
    lineHeight: 1.5,
    fontSize: T.body,
  },
  composerForm: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: `${SP[2]}px`,
  },
  textarea: {
    flex: 1,
    fontFamily: 'inherit',
    fontSize: T.body,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${CARD.border}`,
    borderRadius: CARD.radiusSm,
    padding: `${SP[2]}px ${SP[3]}px`,
    color: TEXT.primary,
    resize: 'none',
    outline: 'none',
    lineHeight: 1.45,
    minHeight: 40,
  },
  sendBtn: {
    fontSize: T.small,
    fontWeight: W.bold,
    background: ACCENT.main,
    color: TEXT.inverse,
    border: 'none',
    padding: `${SP[2]}px ${SP[4]}px`,
    borderRadius: CARD.radiusSm,
    cursor: 'pointer',
    transition: 'opacity 0.12s ease',
    height: 40,
  },
};
