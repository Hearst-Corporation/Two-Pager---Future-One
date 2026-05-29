'use client';

// /admin/hearst/executive — ORACLE Executive Dashboard (Boardroom Experience).
// The institutional first-screen: everything a Sheikh / QIA / Equinix reviewer
// needs in 5 seconds. Reads existing APIs only (no engine, no new data).
//   Portfolio Overview · Active Projects · Recent Reports · Key Risks ·
//   Market Signals · Recommended Next Actions.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const fmtDate = (s) => { try { return new Date(s).toLocaleDateString(); } catch { return s; } };

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    // project first (scenarios list requires its id)
    let project = null;
    try { const pj = await fetch('/api/admin/hearst/project').then(r => r.json()); project = pj.project || pj; } catch {}
    const pid = project?.id;
    const [memos, scenarios, news] = await Promise.allSettled([
      fetch('/api/admin/hearst/strategic-memos?limit=100').then(r => r.json()),
      pid ? fetch(`/api/admin/hearst/scenarios?project_id=${pid}`).then(r => r.json()) : Promise.resolve({}),
      Promise.race([
        fetch('/api/admin/hearst/news').then(r => r.json()).catch(() => ({})),
        new Promise(res => setTimeout(() => res({}), 5000)),
      ]),
    ]);
    const ms = memos.status === 'fulfilled' ? (memos.value.memos || []) : [];
    let risks = [];
    if (ms[0]?.id) {
      try { const d = await fetch(`/api/admin/hearst/strategic-memos/${ms[0].id}`).then(r => r.json()); risks = d?.memo?.memo_json?.risks_constraints?.items || []; } catch {}
    }
    setData({
      memos: ms,
      scenarios: scenarios.status === 'fulfilled' ? (scenarios.value.scenarios || scenarios.value.rows || []) : [],
      project,
      signals: news.status === 'fulfilled' ? (news.value.news || news.value.signals || news.value.items || []) : [],
      risks,
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div style={S.empty}>Loading executive overview…</div>;
  const { memos, scenarios, project, signals, risks } = data;

  const regions = [...new Set(memos.map(m => m.region).filter(Boolean))];
  const approved = memos.filter(m => m.status === 'approved').length;
  const drafts = memos.filter(m => m.status === 'draft').length;
  const dataAsOf = memos.map(m => m.data_as_of).filter(Boolean).sort().pop();

  // Recommended next actions — computed from real state
  const actions = [];
  if (drafts > 0) actions.push({ t: `${drafts} report${drafts > 1 ? 's' : ''} in DRAFT`, d: 'Review and approve in the Dossier before the committee.', href: '/admin/hearst/dossier' });
  if (scenarios.length > memos.length) actions.push({ t: `${scenarios.length - memos.length} scenario(s) without a report`, d: 'Generate a strategic memo to complete the dossier.', href: '/admin/hearst/simulator' });
  if (dataAsOf) actions.push({ t: `Benchmark data as of ${dataAsOf}`, d: 'Re-source high-volatility inputs before an institutional presentation.', href: '/admin/hearst/sources' });
  actions.push({ t: 'Export board pack', d: 'Open the dossier and export PDFs for each scenario.', href: '/admin/hearst/dossier' });

  return (
    <div style={S.wrap}>
      <header style={S.head}>
        <h1 style={S.h1}>ORACLE Executive Dashboard</h1>
        <p style={S.sub}>{project?.name || 'HEARST Qatar AI & Data Center Hub'} · institutional infrastructure decision support · indicative</p>
      </header>

      {/* 1 — Portfolio Overview */}
      <div style={S.kpis}>
        <Kpi n={scenarios.length} l="Scenarios modelled" />
        <Kpi n={memos.length} l="Strategic reports" />
        <Kpi n={approved} l="Approved" />
        <Kpi n={regions.length} l="Regions" sub={regions.join(' · ').toUpperCase()} />
      </div>

      <div style={S.grid}>
        {/* 2 — Active Projects */}
        <Panel title="Active Projects">
          <div style={S.projRow}>
            <div>
              <div style={S.projName}>{project?.name || 'HEARST Qatar AI & Data Center Hub'}</div>
              <div style={S.projMeta}>{scenarios.length} scenarios · {memos.length} reports · {regions.length || 1} region(s)</div>
            </div>
            <Link href="/admin/hearst/dossier" style={S.go}>Open dossier →</Link>
          </div>
        </Panel>

        {/* 5 — Market Signals */}
        <Panel title="Market Signals">
          {signals.length === 0 && <div style={S.muted}>No live signals loaded.</div>}
          {signals.slice(0, 4).map((s, i) => (
            <div key={i} style={S.signal}>
              <span style={{ ...S.dot, background: sevColor(s.severity || s.impact) }} />
              <span style={S.signalText}>{s.title || s.headline || s.summary || s.metric_name || 'Signal'}</span>
            </div>
          ))}
        </Panel>

        {/* 3 — Recent Reports */}
        <Panel title="Recent Reports" wide>
          {memos.length === 0 && <div style={S.muted}>No reports yet.</div>}
          {memos.slice(0, 5).map(m => (
            <div key={m.id} style={S.report}>
              <Link href={`/admin/hearst/dossier?memo=${m.id}`} style={{ ...S.reportMain, flex: 1, minWidth: 0, textDecoration: 'none' }}>
                <span style={S.reportTitle}>{m.title}</span>
                <span style={S.reportMeta}>{m.region} · v{m.version} · {fmtDate(m.created_at)}</span>
              </Link>
              <span style={{ ...S.statusChip, ...statusStyle(m.status) }}>{m.status}</span>
              <a href={`/api/admin/hearst/strategic-memos/${m.id}/pdf`} target="_blank" rel="noreferrer" style={S.pdf}>PDF↓</a>
            </div>
          ))}
        </Panel>

        {/* 4 — Key Risks */}
        <Panel title="Key Risks">
          {risks.length === 0 && <div style={S.muted}>Generate a report to surface risks.</div>}
          {risks.slice(0, 5).map((r, i) => (
            <div key={i} style={S.risk}>
              <span style={{ ...S.riskSev, background: sevColor(r.severity) }}>{(r.severity || 'MED').slice(0, 1)}</span>
              <span style={S.riskText}>{r.label}</span>
            </div>
          ))}
        </Panel>

        {/* 6 — Recommended Next Actions — pairs with Key Risks in a symmetric 2-col row */}
        <Panel title="Recommended Next Actions">
          {actions.map((a, i) => (
            <Link key={i} href={a.href} style={S.action}>
              <span style={S.actionDot}>→</span>
              <span style={S.actionCol}><span style={S.actionT}>{a.t}</span><span style={S.actionD}>{a.d}</span></span>
            </Link>
          ))}
        </Panel>
      </div>
      <div style={S.disclaimer}>AI-assisted · indicative · human review required · data as of {dataAsOf || 'n/a'}.</div>
    </div>
  );
}

function Kpi({ n, l, sub }) { return <div style={S.kpi}><div style={S.kpiN}>{n}</div><div style={S.kpiL}>{l}</div>{sub && <div style={S.kpiSub}>{sub}</div>}</div>; }
function Panel({ title, children, wide }) { return <section style={{ ...S.panel, ...(wide ? S.panelWide : {}) }}><h2 style={S.h2}>{title}</h2>{children}</section>; }
function sevColor(s) { const v = (s || '').toString().toUpperCase(); return v.includes('HIGH') ? '#a23030' : v.includes('MED') ? '#b3661a' : v.includes('LOW') ? '#7a6a1f' : '#2f6f8f'; }
function statusStyle(s) { return s === 'approved' ? { background: '#1b7a4b', color: '#fff' } : s === 'reviewed' ? { background: '#2f6f8f', color: '#fff' } : { background: 'var(--cp-surface-2)', color: 'var(--cp-text-muted)' }; }

const S = {
  wrap: { maxWidth: 1280, margin: '0 auto', padding: '32px 32px 96px' },
  head: { marginBottom: 18 },
  h1: { fontSize: 30, fontWeight: 700, color: 'var(--cp-text-primary)', margin: 0, letterSpacing: '-0.01em' },
  sub: { color: 'var(--cp-text-muted)', fontSize: 13, marginTop: 6 },
  kpis: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  kpi: { flex: '1 1 160px', padding: '16px 18px', borderRadius: 12, background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border)' },
  kpiN: { fontSize: 32, fontWeight: 700, color: 'var(--cp-accent)' },
  kpiL: { fontSize: 11, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  kpiSub: { fontSize: 10, color: 'var(--cp-text-faint)', marginTop: 2 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 },
  panel: { padding: 16, borderRadius: 12, background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)' },
  panelWide: { gridColumn: '1 / -1' },
  h2: { fontSize: 13, color: 'var(--cp-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', borderBottom: '1px solid var(--cp-border)', paddingBottom: 6 },
  projRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  projName: { fontWeight: 600, color: 'var(--cp-text-body)' },
  projMeta: { fontSize: 12, color: 'var(--cp-text-muted)', marginTop: 2 },
  go: { color: 'var(--cp-accent)', textDecoration: 'none', fontSize: 13 },
  signal: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' },
  dot: { width: 8, height: 8, borderRadius: '50%', flex: '0 0 auto' },
  signalText: { fontSize: 13, color: 'var(--cp-text-body)' },
  report: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--cp-border)', textDecoration: 'none' },
  reportMain: { flex: 1, display: 'flex', flexDirection: 'column' },
  reportTitle: { color: 'var(--cp-text-body)', fontSize: 13, fontWeight: 500 },
  reportMeta: { color: 'var(--cp-text-muted)', fontSize: 11 },
  statusChip: { fontSize: 10, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase' },
  pdf: { color: 'var(--cp-accent)', textDecoration: 'none', fontSize: 12, fontWeight: 600 },
  risk: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' },
  riskSev: { width: 18, height: 18, borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' },
  riskText: { fontSize: 12.5, color: 'var(--cp-text-body)' },
  action: { display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--cp-border)', textDecoration: 'none', alignItems: 'baseline' },
  actionDot: { color: 'var(--cp-accent)', fontWeight: 700 },
  actionCol: { display: 'flex', flexDirection: 'column' },
  actionT: { color: 'var(--cp-text-body)', fontSize: 13, fontWeight: 600 },
  actionD: { color: 'var(--cp-text-muted)', fontSize: 12 },
  disclaimer: { marginTop: 18, fontSize: 11, color: 'var(--cp-text-faint)', fontStyle: 'italic' },
  empty: { padding: 40, textAlign: 'center', color: 'var(--cp-text-muted)' },
  muted: { color: 'var(--cp-text-faint)', fontSize: 12, fontStyle: 'italic' },
};
