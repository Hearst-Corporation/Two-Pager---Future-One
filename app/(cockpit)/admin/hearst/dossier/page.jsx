'use client';

// /admin/hearst/dossier — Project Dossier (Critical Deliverables P8).
// One page that answers "show me everything for this project": all scenarios,
// all report versions, all exports, on a timeline. Reuses existing API routes.

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function fmtDate(s) { try { return new Date(s).toLocaleString(); } catch { return s; } }

function DossierInner() {
  const sp = useSearchParams();
  const focusScenario = sp.get('scenario');
  const focusMemo = sp.get('memo');

  const [memos, setMemos] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [project, setProject] = useState(null);

  const load = useCallback(async () => {
    const [mRes, sRes, pRes] = await Promise.allSettled([
      fetch('/api/admin/hearst/strategic-memos').then(r => r.json()),
      fetch('/api/admin/hearst/scenarios').then(r => r.json()),
      fetch('/api/admin/hearst/project').then(r => r.json()),
    ]);
    setMemos(mRes.status === 'fulfilled' ? (mRes.value.memos || []) : []);
    setScenarios(sRes.status === 'fulfilled' ? (sRes.value.scenarios || sRes.value.rows || sRes.value || []) : []);
    setProject(pRes.status === 'fulfilled' ? (pRes.value.project || pRes.value) : null);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (memos === null) return <div style={S.empty}>Loading dossier…</div>;

  // Group reports by scenario_id
  const byScenario = {};
  for (const m of memos) { (byScenario[m.scenario_id || 'unlinked'] ||= []).push(m); }
  const scenarioList = Array.isArray(scenarios) ? scenarios : [];
  const scenarioName = (id) => scenarioList.find(s => s.id === id)?.name
    || scenarioList.find(s => s.id === id)?.title || (id ? id.slice(0, 8) + '…' : 'Unlinked');

  // Order scenario groups; focused scenario first
  let groupIds = Object.keys(byScenario);
  if (focusScenario) groupIds = groupIds.sort((a, b) => (a === focusScenario ? -1 : b === focusScenario ? 1 : 0));

  return (
    <div style={S.wrap}>
      <header style={S.head}>
        <h1 style={S.h1}>Project Dossier{project?.name ? ` · ${project.name}` : ''}</h1>
        <p style={S.sub}>{scenarioList.length} scenarios · {memos.length} report versions. Everything for this project on one page.</p>
      </header>

      <div style={S.statRow}>
        <div style={S.stat}><div style={S.statN}>{scenarioList.length}</div><div style={S.statL}>Scenarios</div></div>
        <div style={S.stat}><div style={S.statN}>{memos.length}</div><div style={S.statL}>Reports</div></div>
        <div style={S.stat}><div style={S.statN}>{memos.length}</div><div style={S.statL}>Exports (PDF)</div></div>
        <div style={S.stat}><div style={S.statN}>{memos.filter(m => m.status === 'approved').length}</div><div style={S.statL}>Approved</div></div>
      </div>

      {groupIds.length === 0 && <div style={S.empty}>No reports yet for this project.</div>}

      {groupIds.map(sid => {
        const reports = byScenario[sid].sort((a, b) => (b.version || 0) - (a.version || 0));
        const focused = sid === focusScenario;
        return (
          <section key={sid} style={{ ...S.scenario, ...(focused ? S.scenarioFocus : {}) }}>
            <h2 style={S.h2}>Scenario · {scenarioName(sid)} <span style={S.count}>{reports.length} report{reports.length > 1 ? 's' : ''}</span></h2>
            <table style={S.table}>
              <thead><tr>{['Version', 'Title', 'Date', 'Provider', 'Confidence', 'Data as of', 'Status', 'Export'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {reports.map(m => (
                  <tr key={m.id} style={{ ...S.tr, ...(m.id === focusMemo ? S.rowFocus : {}) }}>
                    <td style={S.td}><b>v{m.version}</b></td>
                    <td style={S.td}>{m.title}</td>
                    <td style={S.td}>{fmtDate(m.created_at)}</td>
                    <td style={S.td}>{m.provider_used || '—'}</td>
                    <td style={S.td}>{m.confidence_level || '—'}</td>
                    <td style={S.td}>{m.data_as_of || '—'}</td>
                    <td style={S.td}>{m.status}</td>
                    <td style={S.td}><a style={S.pdf} href={`/api/admin/hearst/strategic-memos/${m.id}/pdf`} target="_blank" rel="noreferrer">PDF ↓</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

export default function DossierPage() {
  return <Suspense fallback={<div style={S.empty}>Loading…</div>}><DossierInner /></Suspense>;
}

const S = {
  wrap: { maxWidth: 1280, margin: '0 auto', padding: '32px 32px 96px' },
  head: { marginBottom: 16 },
  h1: { fontSize: 'var(--cp-font-2xl, 28px)', fontWeight: 700, color: 'var(--cp-text-primary)', margin: 0 },
  sub: { color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)', marginTop: 6 },
  statRow: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  stat: { padding: '12px 18px', borderRadius: 10, background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border)', minWidth: 110 },
  statN: { fontSize: 24, fontWeight: 700, color: 'var(--cp-text-primary)' },
  statL: { fontSize: 11, color: 'var(--cp-text-muted)', textTransform: 'uppercase' },
  scenario: { marginBottom: 24, padding: 16, borderRadius: 12, background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)' },
  scenarioFocus: { borderColor: 'var(--cp-border-accent)' },
  h2: { fontSize: 'var(--cp-font-lg, 18px)', color: 'var(--cp-text-primary)', margin: '0 0 12px' },
  count: { fontSize: 12, color: 'var(--cp-text-muted)', fontWeight: 400, marginLeft: 8 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)' },
  th: { textAlign: 'left', padding: '6px 8px', color: 'var(--cp-text-muted)', borderBottom: '1px solid var(--cp-border)', fontSize: 11, textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid var(--cp-border)' },
  rowFocus: { background: 'var(--cp-surface-2)' },
  td: { padding: '6px 8px', color: 'var(--cp-text-body)' },
  pdf: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 600 },
  empty: { padding: 24, color: 'var(--cp-text-muted)', textAlign: 'center' },
};
