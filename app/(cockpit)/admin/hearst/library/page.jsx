'use client';

// /admin/hearst/library — Reports Library (Critical Deliverables P4).
// Institutional repository of every persisted strategic memo. List + filters +
// status + PDF export + link to the originating scenario's dossier.

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

const STATUS_OPTS = ['draft', 'reviewed', 'approved', 'archived'];

function fmtDate(s) { try { return new Date(s).toLocaleString(); } catch { return s; } }

export default function ReportsLibrary() {
  const [memos, setMemos] = useState(null);
  const [err, setErr] = useState(null);
  const [f, setF] = useState({ region: '', stakeholder: '', status: '', since: '' });

  const load = useCallback(async () => {
    setErr(null);
    const qs = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) qs.set(k, v); });
    try {
      const r = await fetch(`/api/admin/hearst/strategic-memos?${qs.toString()}`);
      const j = await r.json();
      if (!r.ok) { setErr(j.error || 'load failed'); setMemos([]); return; }
      setMemos(j.memos || []);
    } catch (e) { setErr(String(e)); setMemos([]); }
  }, [f]);

  useEffect(() => { load(); }, [load]);

  const regions = useMemo(() => [...new Set((memos || []).map(m => m.region).filter(Boolean))], [memos]);
  const stakeholders = useMemo(() => [...new Set((memos || []).map(m => m.stakeholder).filter(Boolean))], [memos]);

  async function setStatus(id, status) {
    await fetch(`/api/admin/hearst/strategic-memos/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div style={S.wrap}>
      <header style={S.head}>
        <h1 style={S.h1}>Reports Library</h1>
        <p style={S.sub}>Every generated strategic memo, retained · versioned · exportable. AI-assisted, indicative — human review required.</p>
      </header>

      <div style={S.filters}>
        <select style={S.sel} value={f.region} onChange={e => setF({ ...f, region: e.target.value })}>
          <option value="">All regions</option>{regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={S.sel} value={f.stakeholder} onChange={e => setF({ ...f, stakeholder: e.target.value })}>
          <option value="">All stakeholders</option>{stakeholders.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={S.sel} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
          <option value="">All statuses</option>{STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input style={S.sel} type="date" value={f.since} onChange={e => setF({ ...f, since: e.target.value })} aria-label="Since date" />
        <button style={S.btn} onClick={load}>Refresh</button>
      </div>

      {err && <div style={S.err}>Error: {err}</div>}
      {memos === null && <div style={S.empty}>Loading reports…</div>}
      {memos && memos.length === 0 && <div style={S.empty}>No reports yet. Generate a strategic memo from the Simulator — it will be retained here automatically.</div>}

      {memos && memos.length > 0 && (
        <table style={S.table}>
          <thead><tr>
            {['Title', 'Scenario', 'Date', 'Version', 'Provider', 'Confidence', 'Status', ''].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {memos.map(m => (
              <tr key={m.id} style={S.tr}>
                <td style={S.td}><Link href={`/admin/hearst/dossier?memo=${m.id}`} style={S.link}>{m.title}</Link></td>
                <td style={S.td}>{m.scenario_id
                  ? <Link href={`/admin/hearst/dossier?scenario=${m.scenario_id}`} style={S.link}>{m.scenario_id.slice(0, 8)}…</Link>
                  : <span style={S.muted}>—</span>}</td>
                <td style={S.td}>{fmtDate(m.created_at)}</td>
                <td style={S.td}>v{m.version}</td>
                <td style={S.td}>{m.provider_used || '—'}</td>
                <td style={S.td}><span style={S.conf}>{m.confidence_level || '—'}</span></td>
                <td style={S.td}>
                  <select style={S.statusSel} value={m.status} onChange={e => setStatus(m.id, e.target.value)}>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={S.td}><a style={S.pdf} href={`/api/admin/hearst/strategic-memos/${m.id}/pdf`} target="_blank" rel="noreferrer">PDF ↓</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const S = {
  wrap: { maxWidth: 1280, margin: '0 auto', padding: '32px 32px 96px' },
  head: { marginBottom: 20 },
  h1: { fontSize: 'var(--cp-font-2xl, 28px)', fontWeight: 700, color: 'var(--cp-text-primary)', margin: 0 },
  sub: { color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)', marginTop: 6 },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  sel: { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--cp-border)', background: 'var(--cp-surface-1)', color: 'var(--cp-text-body)', fontSize: 'var(--cp-font-sm)' },
  btn: { padding: '6px 14px', borderRadius: 8, border: '1px solid var(--cp-border-accent)', background: 'var(--cp-accent)', color: '#fff', cursor: 'pointer', fontSize: 'var(--cp-font-sm)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)' },
  th: { textAlign: 'left', padding: '8px 10px', color: 'var(--cp-text-muted)', borderBottom: '1px solid var(--cp-border)', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 },
  tr: { borderBottom: '1px solid var(--cp-border)' },
  td: { padding: '8px 10px', color: 'var(--cp-text-body)', verticalAlign: 'middle' },
  link: { color: 'var(--cp-accent)', textDecoration: 'none' },
  muted: { color: 'var(--cp-text-faint)' },
  conf: { fontWeight: 600 },
  statusSel: { padding: '3px 6px', borderRadius: 6, border: '1px solid var(--cp-border)', background: 'var(--cp-surface-1)', color: 'var(--cp-text-body)', fontSize: 12 },
  pdf: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 600 },
  err: { padding: 12, borderRadius: 8, background: 'var(--cp-error-bg, #3a1a1f)', color: 'var(--cp-text-body)', marginBottom: 12 },
  empty: { padding: 24, color: 'var(--cp-text-muted)', textAlign: 'center' },
};
