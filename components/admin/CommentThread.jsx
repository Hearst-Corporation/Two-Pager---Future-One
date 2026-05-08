'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar';

/**
 * Comment thread for an entity (operator / partner / initiative / task).
 * Uses /api/admin/comments and /api/admin/team for the @mention autocomplete.
 *
 * Mentions are stored as profile UUIDs in the DB; in the textarea they appear
 * as `@<full_name>` and the lookup is rebuilt from the team list at submit.
 */
export default function CommentThread({ parentKind, parentId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [team, setTeam] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cs, t] = await Promise.all([
        fetch(`/api/admin/comments?parent_kind=${parentKind}&parent_id=${parentId}`).then((r) => r.json()).catch(() => ({ comments: [] })),
        fetch('/api/admin/team').then((r) => r.json()).catch(() => ({ members: [] })),
      ]);
      if (cancelled) return;
      setComments(cs.comments || []);
      setTeam((t.members || []).filter((m) => m.is_active));
      setBusy(false);
    })();
    return () => { cancelled = true; };
  }, [parentKind, parentId]);

  async function refresh() {
    const r = await fetch(`/api/admin/comments?parent_kind=${parentKind}&parent_id=${parentId}`);
    const j = await r.json();
    setComments(j.comments || []);
  }

  async function handleNew(body, mentions, parent_thread = null) {
    setErr('');
    const res = await fetch('/api/admin/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_kind: parentKind, parent_id: parentId, body, mentions, parent_thread }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || 'Could not post comment');
      return false;
    }
    await refresh();
    return true;
  }

  async function handleEdit(id, body) {
    const res = await fetch('/api/admin/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, body }),
    });
    if (res.ok) refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this comment?')) return;
    const res = await fetch('/api/admin/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) refresh();
  }

  // Group threads: top-level + replies
  const threads = useMemo(() => {
    const top = comments.filter((c) => !c.parent_thread);
    const repliesByParent = {};
    for (const c of comments) {
      if (c.parent_thread) {
        (repliesByParent[c.parent_thread] = repliesByParent[c.parent_thread] || []).push(c);
      }
    }
    return top.map((t) => ({ ...t, replies: repliesByParent[t.id] || [] }));
  }, [comments]);

  return (
    <div style={S.wrap}>
      {err && <div style={S.err}>{err}</div>}
      <Composer team={team} currentUser={currentUser} onSubmit={handleNew} placeholder="Write a comment… @mention to notify someone." />

      {busy && <div style={S.muted}>Loading comments…</div>}
      {!busy && threads.length === 0 && (
        <div style={S.empty}>No comments yet — start the conversation.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
        {threads.map((t) => (
          <CommentItem
            key={t.id}
            comment={t}
            replies={t.replies}
            team={team}
            currentUser={currentUser}
            onReply={(body, mentions) => handleNew(body, mentions, t.id)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

function CommentItem({ comment, replies = [], team, currentUser, onReply, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [showReply, setShowReply] = useState(false);
  const canEdit = currentUser && (comment.author_id === currentUser.id || currentUser.role === 'admin');

  async function saveEdit() {
    if (!draft.trim()) return;
    await onEdit(comment.id, draft);
    setEditing(false);
  }

  return (
    <div style={S.item}>
      <Avatar profile={comment.author} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.itemHead}>
          <span style={S.itemAuthor}>{comment.author?.full_name || comment.author?.email || 'Unknown'}</span>
          <span style={S.itemWhen}>
            {new Date(comment.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {comment.edited_at && <span style={{ color: 'var(--color-text-muted)' }}> · edited</span>}
          </span>
        </div>

        {!editing && <div style={S.body}>{renderBody(comment.body, team)}</div>}
        {editing && (
          <div style={{ marginTop: 6 }}>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} style={S.textarea} rows={3} />
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={saveEdit} style={S.btnPrimary}>SAVE</button>
              <button onClick={() => { setEditing(false); setDraft(comment.body); }} style={S.btnSecondary}>CANCEL</button>
            </div>
          </div>
        )}

        <div style={S.itemActions}>
          <button onClick={() => setShowReply((v) => !v)} style={S.actionBtn}>{showReply ? 'Cancel' : 'Reply'}</button>
          {canEdit && !editing && <button onClick={() => setEditing(true)} style={S.actionBtn}>Edit</button>}
          {canEdit && <button onClick={() => onDelete(comment.id)} style={S.actionDanger}>Delete</button>}
        </div>

        {showReply && (
          <div style={{ marginTop: 10 }}>
            <Composer
              team={team}
              currentUser={currentUser}
              compact
              placeholder={`Reply to ${comment.author?.full_name || 'this comment'}…`}
              onSubmit={async (body, mentions) => {
                const ok = await onReply(body, mentions);
                if (ok) setShowReply(false);
                return ok;
              }}
            />
          </div>
        )}

        {replies.length > 0 && (
          <div style={S.replyList}>
            {replies.map((r) => (
              <div key={r.id} style={S.replyItem}>
                <Avatar profile={r.author} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.itemHead}>
                    <span style={{ ...S.itemAuthor, fontSize: 13 }}>{r.author?.full_name || r.author?.email || 'Unknown'}</span>
                    <span style={S.itemWhen}>{new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ ...S.body, fontSize: 13 }}>{renderBody(r.body, team)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Composer({ team, currentUser, onSubmit, placeholder, compact }) {
  const ref = useRef(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  // @mention autocomplete state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerIndex, setPickerIndex] = useState(0);

  const candidates = useMemo(() => {
    const q = pickerQuery.toLowerCase();
    return team
      .filter((m) => m.id !== currentUser?.id)
      .filter((m) => {
        const hay = `${m.full_name || ''} ${m.email || ''}`.toLowerCase();
        return q === '' ? true : hay.includes(q);
      })
      .slice(0, 6);
  }, [team, pickerQuery, currentUser]);

  function onChange(e) {
    const v = e.target.value;
    setDraft(v);

    // Detect "@xxx" right before the cursor
    const cursor = e.target.selectionStart;
    const upto = v.slice(0, cursor);
    const match = upto.match(/(^|\s)@([\w._-]*)$/);
    if (match) {
      setPickerQuery(match[2] || '');
      setPickerOpen(true);
      setPickerIndex(0);
    } else {
      setPickerOpen(false);
      setPickerQuery('');
    }
  }

  function applyMention(profile) {
    const ta = ref.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const upto = draft.slice(0, cursor);
    const after = draft.slice(cursor);
    const replaced = upto.replace(/(^|\s)@([\w._-]*)$/, (_, p1) => `${p1}@${profile.full_name || profile.email} `);
    const newValue = replaced + after;
    setDraft(newValue);
    setPickerOpen(false);
    setPickerQuery('');
    requestAnimationFrame(() => {
      ta.focus();
      const newCursor = replaced.length;
      ta.setSelectionRange(newCursor, newCursor);
    });
  }

  function onKeyDown(e) {
    if (pickerOpen && candidates.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setPickerIndex((i) => (i + 1) % candidates.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setPickerIndex((i) => (i - 1 + candidates.length) % candidates.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyMention(candidates[pickerIndex]);
        return;
      }
      if (e.key === 'Escape') { setPickerOpen(false); return; }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  function extractMentions(text) {
    const ids = new Set();
    for (const m of team) {
      const tag = `@${m.full_name || m.email}`;
      if (m.id === currentUser?.id) continue;
      if (text.includes(tag)) ids.add(m.id);
    }
    return Array.from(ids);
  }

  async function submit() {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    const mentions = extractMentions(body);
    const ok = await onSubmit(body, mentions);
    setBusy(false);
    if (ok) setDraft('');
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={S.composer}>
        <Avatar profile={currentUser} size={compact ? 28 : 32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            ref={ref}
            value={draft}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder || 'Write a comment…'}
            rows={compact ? 2 : 3}
            style={S.textarea}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={S.hint}>⌘ + Enter to post · type @ to mention</span>
            <button type="button" onClick={submit} disabled={busy || !draft.trim()} style={S.btnPrimary}>
              {busy ? '…' : 'POST'}
            </button>
          </div>
        </div>
      </div>

      {pickerOpen && candidates.length > 0 && (
        <div style={S.picker}>
          {candidates.map((c, i) => (
            <div
              key={c.id}
              onMouseDown={(e) => { e.preventDefault(); applyMention(c); }}
              onMouseEnter={() => setPickerIndex(i)}
              style={{ ...S.pickerRow, background: i === pickerIndex ? 'color-mix(in srgb, var(--color-text-primary) 6%, transparent)' : 'transparent' }}
            >
              <Avatar profile={c} size={24} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{c.full_name || c.email}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{c.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Render `@Name` substrings as styled chips. We highlight any token that
 * matches a current team member's display name or email.
 */
function renderBody(text, team) {
  if (!text) return null;
  const tags = team.map((m) => `@${m.full_name || m.email}`).filter(Boolean);
  // Build a regex that matches any known mention literally
  const escaped = tags.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return text;
  const re = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(re);
  return parts.map((p, i) => {
    if (tags.includes(p)) {
      return <span key={i} style={{ color: 'var(--color-accent-strong)', fontWeight: 700, background: 'color-mix(in srgb, var(--color-accent-strong) 10%, transparent)', padding: '0 4px', borderRadius: 2 }}>{p}</span>;
    }
    return <span key={i}>{p}</span>;
  });
}

const S = {
  wrap: {},
  err: { color: 'var(--color-accent-strong)', fontSize: 12, fontWeight: 600, marginBottom: 10 },
  muted: { fontSize: 12, color: 'var(--color-text-muted)' },
  empty: { padding: 18, fontSize: 13, color: 'var(--color-text-muted)', border: '1px dashed var(--color-border-medium)', textAlign: 'center', marginTop: 10 },

  composer: { display: 'flex', gap: 12, padding: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', alignItems: 'flex-start' },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border-medium)',
    background: 'var(--color-bg-main)',
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    lineHeight: 1.55,
  },
  hint: { fontSize: 11, color: 'var(--color-text-muted)' },
  btnPrimary: {
    padding: '8px 14px',
    border: 0,
    background: 'var(--color-accent-strong)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    padding: '8px 12px',
    border: '1px solid var(--color-border-medium)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  /* Picker */
  picker: {
    position: 'absolute',
    bottom: 'calc(100% + 4px)',
    left: 56,
    right: 24,
    maxHeight: 240,
    overflowY: 'auto',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-medium)',
    boxShadow: '0 12px 32px color-mix(in srgb, var(--color-gray-900) 16%, transparent)',
    zIndex: 30,
  },
  pickerRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', cursor: 'pointer' },

  /* Item */
  item: { display: 'flex', gap: 12, padding: '14px 4px', borderTop: '1px solid var(--color-border-light)' },
  itemHead: { display: 'flex', alignItems: 'baseline', gap: 8 },
  itemAuthor: { fontSize: 14, fontWeight: 700 },
  itemWhen: { fontSize: 11, color: 'var(--color-text-muted)' },
  body: { marginTop: 6, fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  itemActions: { display: 'flex', gap: 12, marginTop: 8 },
  actionBtn: { background: 'transparent', border: 0, padding: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'inherit' },
  actionDanger: { background: 'transparent', border: 0, padding: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-accent-strong)', cursor: 'pointer', fontFamily: 'inherit' },

  /* Replies */
  replyList: { borderLeft: '2px solid var(--color-border-light)', marginTop: 12, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 10 },
  replyItem: { display: 'flex', gap: 10, paddingTop: 4 },
};
