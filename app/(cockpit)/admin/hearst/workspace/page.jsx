'use client';

// /admin/hearst/workspace — Saved work only. Two lists:
//   • Saved Scenarios  (GET /scenarios?project_id) → Open in Simulator · Delete
//   • Reports / Memos  (GET /strategic-memos)       → Open Dossier · Open PDF
// No admin / CRM / users / teams / settings / analytics. Read-mostly.
// Sober Cockpit DS — tokens only, no badges/colour-soup.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const fmtDate = (s) => { try { return new Date(s).toLocaleDateString(); } catch { return s; } };

export default function WorkspacePage() {
  const [scenarios, setScenarios] = useState(null);
  const [memos, setMemos] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      let pid = null;
      try { const pj = await fetch('/api/admin/hearst/project').then(r => r.json()); pid = (pj.project || pj)?.id || null; } catch {}
      const [sc, mc] = await Promise.allSettled([
        pid ? fetch(`/api/admin/hearst/scenarios?project_id=${pid}`).then(r => r.json()) : Promise.resolve({ scenarios: [] }),
        fetch('/api/admin/hearst/strategic-memos?limit=100').then(r => r.json()),
      ]);
      setScenarios(sc.status === 'fulfilled' ? (sc.value.scenarios || sc.value.rows || []) : []);
      setMemos(mc.status === 'fulfilled' ? (mc.value.memos || []) : []);
    } catch (e) { setErr(String(e)); setScenarios([]); setMemos([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteScenario(id, name) {
    if (!window.confirm(`Delete scenario "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/hearst/scenarios/${id}`, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error || `Delete failed (${r.status})`); }
      else await load();
    } catch (e) { setErr(String(e)); } finally { setBusy(null); }
  }

  return (
    <div style={S.wrap}>
      <header style={S.head}>
        <h1 style={S.h1}>Workspace</h1>
        <p style={S.sub}>Your saved work — scenarios and reports. Reopen a scenario in the Simulator or open its report.</p>
      </header>

      {err && <div style={S.err}>Error: {err}</div>}

      {/* ── Saved Scenarios ── */}
      <section style={S.section}>
        <div style={S.headingWrap}><h2 style={S.heading}>Saved scenarios</h2><span style={S.hint}>{scenarios?.length ?? '—'} saved</span></div>
        {scenarios === null && <div style={S.empty}>Loading scenarios…</div>}
        {scenarios && scenarios.length === 0 && <div style={S.empty}>No saved scenarios yet. Build one in the Simulator and click "Save this plan".</div>}
        {scenarios && scenarios.length > 0 && (
          <table style={S.table}>
            <thead><tr>{['Name', 'Type', 'Created', 'Status', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {scenarios.map(s => (
                <tr key={s.id} style={S.tr}>
                  <td style={{ ...S.td, color: 'var(--cp-text-primary)', fontWeight: 'var(--cp-weight-semibold)' }}>{s.name}</td>
                  <td style={S.td}>{s.scenario_type || '—'}</td>
                  <td style={S.td}>{fmtDate(s.created_at)}</td>
                  <td style={S.td}><span style={S.statusText}>{s.is_active ? 'Active' : 'Saved'}</span></td>
                  <td style={{ ...S.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/hearst/simulator?scenario=${s.id}`} style={S.action}>Open in Simulator →</Link>
                    <button type="button" disabled={busy === s.id} onClick={() => deleteScenario(s.id, s.name)} style={S.del}>{busy === s.id ? '…' : 'Delete'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Reports / Memos ── */}
      <section style={S.section}>
        <div style={S.headingWrap}><h2 style={S.heading}>Reports / memos</h2><span style={S.hint}>{memos?.length ?? '—'} reports</span></div>
        {memos === null && <div style={S.empty}>Loading reports…</div>}
        {memos && memos.length === 0 && <div style={S.empty}>No reports yet. Generate a strategic memo from the Simulator.</div>}
        {memos && memos.length > 0 && (
          <table style={S.table}>
            <thead><tr>{['Title', 'Created', 'Status', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {memos.map(m => (
                <tr key={m.id} style={S.tr}>
                  <td style={{ ...S.td, color: 'var(--cp-text-primary)', fontWeight: 'var(--cp-weight-semibold)' }}>{m.title}</td>
                  <td style={S.td}>{fmtDate(m.created_at)}</td>
                  <td style={S.td}><span style={S.statusText}>{m.status}</span></td>
                  <td style={{ ...S.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/hearst/dossier?memo=${m.id}`} style={S.action}>Open Dossier →</Link>
                    <a href={`/api/admin/hearst/strategic-memos/${m.id}/pdf`} target="_blank" rel="noreferrer" style={S.actionMuted}>PDF ↓</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const S = {
  wrap: { maxWidth: 1280, margin: '0 auto', padding: 'var(--cp-space-6) clamp(var(--cp-space-3), 4vw, var(--cp-space-8)) var(--cp-scroll-clear)' },
  head: { marginBottom: 'var(--cp-space-5)' },
  h1: { fontSize: 'var(--cp-font-xl)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)', margin: 0 },
  sub: { color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)', marginTop: 'var(--cp-space-1)' },
  section: { marginBottom: 'var(--cp-space-8)' },
  headingWrap: { display: 'flex', alignItems: 'baseline', gap: 'var(--cp-space-2)', marginBottom: 'var(--cp-space-3)', borderBottom: '1px solid var(--cp-border)', paddingBottom: 'var(--cp-space-2)' },
  heading: { fontSize: 'var(--cp-font-base)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)', margin: 0 },
  hint: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-faint)', fontStyle: 'italic' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)' },
  th: { textAlign: 'left', padding: 'var(--cp-space-2) var(--cp-space-3)', color: 'var(--cp-text-muted)', borderBottom: '1px solid var(--cp-border)', fontWeight: 'var(--cp-weight-semibold)', textTransform: 'uppercase', fontSize: 'var(--cp-font-xs)', letterSpacing: 'var(--cp-tracking-wide)' },
  tr: { borderBottom: '1px solid var(--cp-border)' },
  td: { padding: 'var(--cp-space-2) var(--cp-space-3)', color: 'var(--cp-text-body)', verticalAlign: 'middle' },
  statusText: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', textTransform: 'capitalize' },
  action: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 'var(--cp-weight-semibold)', fontSize: 'var(--cp-font-sm)', marginLeft: 'var(--cp-space-3)' },
  actionMuted: { color: 'var(--cp-text-muted)', textDecoration: 'none', fontWeight: 'var(--cp-weight-semibold)', fontSize: 'var(--cp-font-sm)', marginLeft: 'var(--cp-space-3)' },
  del: { marginLeft: 'var(--cp-space-3)', background: 'transparent', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-sm)', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-xs)', fontWeight: 'var(--cp-weight-semibold)', padding: 'var(--cp-space-1) var(--cp-space-3)', cursor: 'pointer' },
  err: { padding: 'var(--cp-space-3)', borderRadius: 'var(--cp-radius-sm)', background: 'var(--cp-error-bg)', color: 'var(--cp-error)', border: '1px solid var(--cp-border)', marginBottom: 'var(--cp-space-4)' },
  empty: { padding: 'var(--cp-space-8)', color: 'var(--cp-text-muted)', textAlign: 'center', fontSize: 'var(--cp-font-md)' },
};
