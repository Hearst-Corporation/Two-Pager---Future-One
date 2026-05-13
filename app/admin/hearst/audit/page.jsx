'use client';
import { useState, useEffect } from 'react';

const ENTITY_COLORS = {
  scenario:  { color: '#2563EB', bg: '#DBEAFE' },
  source:    { color: '#059669', bg: '#D1FAE5' },
  contract:  { color: '#0891B2', bg: '#CFFAFE' },
  data_room: { color: '#7C3AED', bg: '#EDE9FE' },
  pipeline:  { color: '#D97706', bg: '#FFFBEB' },
  project:   { color: '#6B7280', bg: '#F3F4F6' },
};

const ACTION_LABELS = {
  add_source:    { label: 'Source Added',      icon: '📎' },
  update_field:  { label: 'Field Updated',     icon: '✏' },
  add_contract:  { label: 'Contract Added',    icon: '📑' },
  create:        { label: 'Created',           icon: '✚' },
  delete:        { label: 'Deleted',           icon: '✕' },
  update:        { label: 'Updated',           icon: '↩' },
  status_change: { label: 'Status Changed',    icon: '⇄' },
};

function timeAgo(dt) {
  if (!dt) return '';
  const diff = (Date.now() - new Date(dt).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return new Date(dt).toLocaleDateString();
}

export default function AuditPage() {
  const [project, setProject] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load');
        const { project: proj } = await pRes.json();
        setProject(proj);
        await loadEntries(proj.id, limit, typeFilter);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function loadEntries(pid, lim, et) {
    const params = new URLSearchParams({ project_id: pid || project?.id, limit: lim });
    if (et) params.set('entity_type', et);
    const res = await fetch('/api/admin/hearst/audit?' + params);
    const { entries: e } = await res.json();
    setEntries(e || []);
  }

  async function applyFilter(et) {
    setTypeFilter(et);
    if (project) await loadEntries(project.id, limit, et);
  }

  async function loadMore() {
    const newLimit = limit + 100;
    setLimit(newLimit);
    if (project) await loadEntries(project.id, newLimit, typeFilter);
  }

  if (loading) return <div style={S.loading}>Loading audit trail…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const entityTypes = [...new Set(entries.map(e => e.entity_type).filter(Boolean))];

  return (
    <div style={S.wrap}>
      <div style={S.topBar}>
        <div style={S.pageTitle}>Audit Trail</div>
        <div style={S.count}>{entries.length} entries</div>
      </div>

      {/* Filters */}
      <div style={S.filters}>
        <button onClick={() => applyFilter('')} style={{ ...S.filterBtn, background: !typeFilter ? 'var(--color-text-primary)' : 'transparent', color: !typeFilter ? 'var(--color-bg-main)' : 'var(--color-text-muted)' }}>
          All
        </button>
        {entityTypes.map(et => {
          const meta = ENTITY_COLORS[et] || ENTITY_COLORS.project;
          return (
            <button
              key={et}
              onClick={() => applyFilter(et)}
              style={{ ...S.filterBtn, background: typeFilter === et ? meta.bg : 'transparent', color: typeFilter === et ? meta.color : 'var(--color-text-muted)', borderColor: meta.color }}
            >
              {et}
            </button>
          );
        })}
      </div>

      {/* Audit log */}
      {entries.length === 0 ? (
        <div style={S.empty}>No audit entries yet. Changes made to scenarios, sources, and contracts will appear here.</div>
      ) : (
        <div style={S.timeline}>
          {entries.map((entry, i) => {
            const entityMeta = ENTITY_COLORS[entry.entity_type] || ENTITY_COLORS.project;
            const actionMeta = ACTION_LABELS[entry.action] || { label: entry.action, icon: '·' };
            return (
              <div key={entry.id} style={S.entry}>
                {/* Timeline dot */}
                <div style={S.dotCol}>
                  <div style={{ ...S.dot, background: entityMeta.color }} />
                  {i < entries.length - 1 && <div style={S.line} />}
                </div>

                {/* Content */}
                <div style={S.entryContent}>
                  <div style={S.entryHeader}>
                    <span style={S.actionIcon}>{actionMeta.icon}</span>
                    <span style={S.actionLabel}>{actionMeta.label}</span>
                    <span style={{ ...S.entityBadge, background: entityMeta.bg, color: entityMeta.color }}>
                      {entry.entity_type}
                    </span>
                    <span style={S.time}>{timeAgo(entry.created_at)}</span>
                  </div>

                  <div style={S.entryBody}>
                    {entry.field_name && (
                      <span style={S.field}>
                        {entry.field_name}
                        {entry.old_value != null && (
                          <><span style={S.oldVal}> {String(entry.old_value).substring(0, 40)}</span>
                          <span style={S.arrow}> → </span></>
                        )}
                        {entry.new_value != null && (
                          <span style={S.newVal}>{String(entry.new_value).substring(0, 60)}</span>
                        )}
                      </span>
                    )}
                    {entry.notes && <span style={S.notes}>{entry.notes}</span>}
                  </div>

                  <div style={S.entryMeta}>
                    <span style={S.actor}>{entry.actor_id ? 'User: ' + entry.actor_id.substring(0, 8) + '…' : 'System'}</span>
                    {entry.created_at && <span style={S.timestamp}>{new Date(entry.created_at).toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {entries.length >= limit && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={loadMore} style={S.loadMore}>Load 100 more</button>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
  error: { padding: 24, color: '#DC2626', fontSize: 13, background: '#FEF2F2', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)' },
  count: { fontSize: 12, color: 'var(--color-text-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', padding: '3px 10px', borderRadius: 20 },
  filters: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 },
  filterBtn: { fontSize: 10, fontWeight: 700, padding: '4px 12px', border: '1px solid var(--color-border-light)', borderRadius: 20, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5, transition: 'all .15s' },
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)', fontSize: 13, background: 'var(--color-surface)', borderRadius: 8 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  entry: { display: 'flex', gap: 16, paddingBottom: 0 },
  dotCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4 },
  line: { width: 2, flex: 1, background: 'var(--color-border-light)', minHeight: 20 },
  entryContent: { flex: 1, paddingBottom: 16, borderBottom: '1px solid var(--color-border-light)', marginBottom: 0 },
  entryHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  actionIcon: { fontSize: 13 },
  actionLabel: { fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' },
  entityBadge: { fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  time: { fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto' },
  entryBody: { fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, display: 'flex', gap: 8, flexWrap: 'wrap' },
  field: { display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' },
  oldVal: { color: '#DC2626', textDecoration: 'line-through', fontSize: 11 },
  arrow: { color: 'var(--color-text-muted)' },
  newVal: { color: '#059669', fontWeight: 600, fontSize: 11 },
  notes: { fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' },
  entryMeta: { display: 'flex', gap: 16, fontSize: 10, color: 'var(--color-text-muted)' },
  actor: { fontFamily: 'monospace' },
  timestamp: {},
  loadMore: { fontSize: 12, padding: '8px 20px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-muted)' },
};
