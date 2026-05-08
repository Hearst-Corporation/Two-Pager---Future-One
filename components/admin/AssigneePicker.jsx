'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar';

/**
 * Compact assignee picker. Shows the assignee's avatar and opens a popup
 * to pick another team member (or unassign).
 *
 *   <AssigneePicker
 *     valueId={task.assigned_to}
 *     onChange={(newId) => save(newId)}
 *     size={28}
 *   />
 *
 * Lazy-fetches /api/admin/team on first open and caches in module scope.
 */
let _teamCache = null;
let _teamPromise = null;

async function loadTeam() {
  if (_teamCache) return _teamCache;
  if (!_teamPromise) {
    _teamPromise = fetch('/api/admin/team')
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((j) => {
        _teamCache = (j.members || []).filter((m) => m.is_active);
        return _teamCache;
      })
      .catch(() => {
        _teamCache = [];
        return _teamCache;
      });
  }
  return _teamPromise;
}

export default function AssigneePicker({ valueId, onChange, size = 28, label = 'Assignee', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState(_teamCache || []);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open || _teamCache) return;
    loadTeam().then(setTeam);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const current = useMemo(
    () => team.find((m) => m.id === valueId) || null,
    [team, valueId],
  );
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return team;
    return team.filter((m) => `${m.full_name || ''} ${m.email || ''}`.toLowerCase().includes(q));
  }, [team, query]);

  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        title={current ? `${label}: ${current.full_name || current.email}` : `${label}: unassigned`}
        style={S.trigger}
      >
        <Avatar profile={current} size={size} />
      </button>

      {open && (
        <div style={S.popup}>
          <div style={S.head}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team…"
              style={S.search}
            />
          </div>
          <div style={S.list}>
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              style={S.row}
            >
              <Avatar profile={null} size={24} />
              <span style={S.rowName}>Unassigned</span>
              {valueId == null && <span style={S.check}>✓</span>}
            </button>
            {filtered.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => { onChange(m.id); setOpen(false); }}
                style={S.row}
              >
                <Avatar profile={m} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.rowName}>{m.full_name || m.email}</div>
                  <div style={S.rowEmail}>{m.email}</div>
                </div>
                {valueId === m.id && <span style={S.check}>✓</span>}
              </button>
            ))}
            {filtered.length === 0 && team.length > 0 && (
              <div style={S.empty}>No match.</div>
            )}
            {team.length === 0 && (
              <div style={S.empty}>Loading…</div>
            )}
          </div>
        </div>
      )}
    </span>
  );
}

const S = {
  trigger: {
    background: 'transparent',
    border: 0,
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
  },
  popup: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    width: 280,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-medium)',
    boxShadow: '0 12px 30px color-mix(in srgb, var(--color-gray-900) 18%, transparent)',
    zIndex: 100,
  },
  head: { padding: 8, borderBottom: '1px solid var(--color-border-light)' },
  search: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--color-border-medium)',
    background: 'var(--color-bg-main)',
    fontSize: 13,
    fontFamily: 'inherit',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  list: { maxHeight: 300, overflowY: 'auto' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 12px',
    border: 0,
    background: 'transparent',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  rowName: { fontSize: 13, fontWeight: 600 },
  rowEmail: { fontSize: 11, color: 'var(--color-text-muted)' },
  check: { color: 'var(--color-accent-strong)', fontWeight: 800 },
  empty: { padding: 14, fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' },
};
