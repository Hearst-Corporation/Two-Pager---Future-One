'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * AdminReviewControls — fixed-position toggle + "Generate memo" launcher
 * portaled into the Cockpit shell. Lives at the top-right of the viewport
 * regardless of where it is mounted in the tree.
 *
 * Behaviour :
 *   - GET /api/admin/review-mode on mount to fetch current mode (gates render
 *     to admins only — 401/403 → render nothing).
 *   - Toggle Normal | Review → POST /api/admin/review-mode.
 *   - When mode='review' the "Generate memo" button is visible. Click :
 *       POST /api/admin/review-document?chatId=<current> (streaming text)
 *       → modal with the markdown content + Copy / Download .md actions.
 *   - chatId is read from `localStorage.cockpitChatId` (set by the shell's
 *     ChatKimi via its useChat hook). If no chat exists, the button stays
 *     disabled with a tooltip.
 */
export function AdminReviewControls() {
  const [mode, setMode] = useState(null);          // null = unknown, 'normal' | 'review'
  const [isAdmin, setIsAdmin] = useState(null);    // null = unknown, true | false
  const [generating, setGenerating] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // ── Fetch current mode + admin status ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/review-mode', { cache: 'no-store' });
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          setIsAdmin(false);
          return;
        }
        if (!res.ok) {
          setIsAdmin(false);
          return;
        }
        const data = await res.json();
        setIsAdmin(true);
        setMode(data.mode === 'review' ? 'review' : 'normal');
      } catch {
        setIsAdmin(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Toggle mode ──────────────────────────────────────────────────────
  const setModeRemote = useCallback(async (next) => {
    setError(null);
    try {
      const res = await fetch('/api/admin/review-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: next }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      setMode(next);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  // ── Generate the review memo ─────────────────────────────────────────
  // chatId is resolved server-side (findLatestReviewChatId) — the cockpit-shell
  // doesn't expose the active chatId to us, so we let the API auto-detect.
  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setModalContent('');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/admin/review-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setModalContent(acc);
      }
      acc += decoder.decode();
      setModalContent(acc);
      // After successful generation the server auto-resets to normal — sync UI.
      setMode('normal');
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || String(e));
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, []);

  const onCopy = useCallback(() => {
    if (modalContent && navigator.clipboard) {
      navigator.clipboard.writeText(modalContent).catch(() => {});
    }
  }, [modalContent]);

  const onDownload = useCallback(() => {
    if (!modalContent) return;
    const blob = new Blob([modalContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oracle-review-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [modalContent]);

  // Portal target — the cockpit-shell chat SETTINGS panel. We inject a NATIVE
  // settings section (same .ct-chat-settings-section classes) so Review mode
  // lives among the other settings (Clé API · Modèle · Affichage), never floating.
  const [settingsEl, setSettingsEl] = useState(null);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const find = () => setSettingsEl(document.querySelector('.ct-chat-settings') || null);
    find();
    const obs = new MutationObserver(find);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  if (isAdmin !== true || mode === null) return null;

  // ── Render ───────────────────────────────────────────────────────────
  // Native settings section injected into the chat settings panel.
  const reviewSection = (
    <section className="ct-chat-settings-section" data-oracle-review-controls>
      <div className="ct-chat-settings-label">Review mode</div>
      <div style={styles.seg} role="group" aria-label="Chat mode">
        <button
          type="button"
          onClick={() => setModeRemote('normal')}
          style={mode === 'normal' ? { ...styles.segBtn, ...styles.segBtnActive } : styles.segBtn}
        >
          Conversation
        </button>
        <button
          type="button"
          onClick={() => setModeRemote('review')}
          style={mode === 'review' ? { ...styles.segBtn, ...styles.segBtnActive } : styles.segBtn}
        >
          Review
        </button>
      </div>
      {mode === 'review' && (
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          style={generating ? { ...styles.generateBtn, ...styles.generateBtnDisabled } : styles.generateBtn}
          title={generating ? 'Generating…' : 'Generate the MD+JSON document'}
        >
          {generating ? 'Generating…' : 'Generate memo'}
        </button>
      )}
      <div className="ct-chat-settings-hint">Review mode generates an MD+JSON document from the current conversation.</div>
      {error && <div style={styles.error}>{error}</div>}
    </section>
  );

  return (
    <>
      {settingsEl && createPortal(reviewSection, settingsEl)}

      {modalContent !== null && (
        <div style={styles.modalOverlay} onClick={() => !generating && setModalContent(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <strong>Review document</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={styles.modalAction} onClick={onCopy}>Copy</button>
                <button type="button" style={styles.modalAction} onClick={onDownload}>Download .md</button>
                <button
                  type="button"
                  style={styles.modalAction}
                  onClick={() => {
                    if (generating && abortRef.current) abortRef.current.abort();
                    setModalContent(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <pre style={styles.modalBody}>{modalContent || '…'}</pre>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  // Segmented control rendered inside the native chat-settings section.
  seg: {
    display: 'flex',
    gap: 4,
    padding: 3,
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  segBtn: {
    flex: 1,
    appearance: 'none',
    background: 'transparent',
    color: 'var(--cp-text-muted, rgba(255,255,255,0.7))',
    border: 0,
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  segBtnActive: {
    background: 'var(--ct-accent, #be123c)',
    color: '#fff',
    boxShadow: '0 1px 4px color-mix(in srgb, var(--ct-accent, #be123c) 45%, transparent)',
  },
  generateBtn: {
    appearance: 'none',
    width: '100%',
    marginTop: 8,
    background: 'var(--ct-accent, #be123c)',
    color: '#fff',
    border: 0,
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 6px 18px color-mix(in srgb, var(--ct-accent, #be123c) 30%, transparent)',
  },
  generateBtnDisabled: {
    opacity: 0.6,
    cursor: 'wait',
  },
  error: {
    background: 'rgba(220, 38, 38, 0.95)',
    color: '#fff',
    fontSize: 11,
    padding: '6px 10px',
    borderRadius: 6,
    maxWidth: 280,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    width: 'min(900px, 100%)',
    maxHeight: '90vh',
    background: '#16141a',
    color: '#f4f4f5',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: 13,
  },
  modalAction: {
    appearance: 'none',
    background: 'rgba(255,255,255,0.08)',
    color: '#f4f4f5',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  modalBody: {
    margin: 0,
    padding: 16,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", monospace',
    fontSize: 12.5,
    lineHeight: 1.55,
    background: '#0f0d12',
  },
};
