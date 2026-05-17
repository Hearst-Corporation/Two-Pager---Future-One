'use client';
import { useState, useEffect } from 'react';

const TEMPLATES = [
  { id: 'memo',        title: 'Investment Memo',   format: 'PDF',   pages: '12p', tags: 'Investor · LP · Deal',        route: '/api/admin/hearst/export/memo',        est: 8  },
  { id: 'term-sheet',  title: 'Term Sheet',         format: 'PDF',   pages: '4p',  tags: 'Legal · Deal · Operator',     route: '/api/admin/hearst/export/term-sheet',  est: 6  },
  { id: 'xlsx',        title: 'Financial Model',    format: 'Excel', pages: '4 tabs', tags: 'Finance · Model',          route: '/api/admin/hearst/export/xlsx',         est: 3  },
  { id: 'capex',       title: 'CAPEX Schedule',     format: 'Excel', pages: '2 tabs', tags: 'Construction · Cost',      route: '/api/admin/hearst/export/xlsx',         est: 3  },
  { id: 'lender-pack', title: 'Lender Package',     format: 'PDF',   pages: '18p', tags: 'Debt · Lender · Credit',      route: '/api/admin/hearst/export/memo',        est: 10 },
  { id: 'one-pager',   title: 'One-Pager Teaser',   format: 'PDF',   pages: '1p',  tags: 'Teaser · Quick',             route: '/api/admin/hearst/export/memo',        est: 4  },
];

const FMT_COLORS = {
  PDF:   { color: 'var(--cp-error)',   bg: 'var(--cp-error-bg)' },
  Excel: { color: 'var(--cp-success)', bg: 'var(--cp-success-bg)' },
};

export default function DocumentsPage() {
  const [project, setProject]               = useState(null);
  const [scenarios, setScenarios]           = useState([]);
  const [selectedScenarioId, setSelected]   = useState('');
  const [loading, setLoading]               = useState(true);
  const [states, setStates]                 = useState({}); // { [tplId]: 'idle'|'loading'|'ready'|'error' }
  const [dlUrls, setDlUrls]                 = useState({}); // { [tplId]: { url, name } }
  const [recent, setRecent]                 = useState(() => {
    try { return JSON.parse(localStorage.getItem('hearst_docs_recent') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const sRes = await fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`);
        const { scenarios: sc } = await sRes.json();
        setScenarios(sc || []);
        const base = sc?.find(s => s.scenario_type === 'base' || s.name?.toLowerCase().includes('base')) || sc?.[0];
        if (base) setSelected(base.id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function generate(tpl) {
    if (!project || !selectedScenarioId) return;
    setStates(p => ({ ...p, [tpl.id]: 'loading' }));
    try {
      const res = await fetch(tpl.route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: selectedScenarioId, project_id: project.id }),
      });
      if (!res.ok) throw new Error('Export failed (' + res.status + ')');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const cd = res.headers.get('content-disposition') || '';
      const m = cd.match(/filename="?([^"]+)"?/);
      const name = m ? m[1] : tpl.id + '-export';
      setDlUrls(p => ({ ...p, [tpl.id]: { url, name } }));
      setStates(p => ({ ...p, [tpl.id]: 'ready' }));
      const entry = { tplId: tpl.id, title: tpl.title, name, at: new Date().toISOString() };
      const next = [entry, ...recent].slice(0, 8);
      setRecent(next);
      try { localStorage.setItem('hearst_docs_recent', JSON.stringify(next)); } catch {}
    } catch (e) {
      setStates(p => ({ ...p, [tpl.id]: 'error:' + e.message }));
    }
  }

  function download(tplId) {
    const dl = dlUrls[tplId];
    if (!dl) return;
    const a = document.createElement('a');
    a.href = dl.url; a.download = dl.name; a.click();
  }

  if (loading) return <div style={S.loading}>Loading…</div>;

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.topBar}>
        <div style={S.pageTitle}>Documents</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={S.scLabel}>Scenario</label>
          <select value={selectedScenarioId} onChange={e => setSelected(e.target.value)} style={S.scSelect}>
            {scenarios.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Document</th>
            <th style={S.th}>Format</th>
            <th style={S.th}>Length</th>
            <th style={S.th}>Tags</th>
            <th style={S.th}>Est.</th>
            <th style={S.th}></th>
          </tr>
        </thead>
        <tbody>
          {TEMPLATES.map(tpl => {
            const state = states[tpl.id] || 'idle';
            const isLoading = state === 'loading';
            const isReady   = state === 'ready';
            const isError   = state.startsWith('error:');
            const fmt = FMT_COLORS[tpl.format] || {};
            return (
              <tr key={tpl.id} style={S.tr}>
                <td style={S.tdBold}>{tpl.title}</td>
                <td style={S.td}>
                  <span style={{ ...S.fmtBadge, color: fmt.color, background: fmt.bg }}>{tpl.format}</span>
                </td>
                <td style={S.td}>{tpl.pages}</td>
                <td style={{ ...S.td, color: 'var(--cp-text-muted)', fontSize: 11 }}>{tpl.tags}</td>
                <td style={S.td}>~{tpl.est}s</td>
                <td style={{ ...S.td, textAlign: 'right' }}>
                  {isError && <span style={S.errText}>{state.replace('error:', '')} — </span>}
                  {isLoading && <span style={S.loadingText}>Generating…</span>}
                  {!isLoading && !isReady && (
                    <button onClick={() => generate(tpl)} disabled={!selectedScenarioId} style={S.genBtn}>
                      Generate
                    </button>
                  )}
                  {isReady && (
                    <span style={{ display: 'inline-flex', gap: 6 }}>
                      <button onClick={() => download(tpl.id)} style={S.dlBtn}>Download</button>
                      <button onClick={() => setStates(p => ({ ...p, [tpl.id]: 'idle' }))} style={S.resetBtn}>↺</button>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Recently generated */}
      {recent.length > 0 && (
        <div style={S.recentSection}>
          <div style={S.sectionLabel}>Recently Generated</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Document</th>
                <th style={S.th}>Filename</th>
                <th style={S.th}>Generated</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i} style={S.tr}>
                  <td style={S.tdBold}>{r.title}</td>
                  <td style={S.td}>{r.name}</td>
                  <td style={S.td}>{new Date(r.at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--cp-text-primary)' },
  scLabel: { fontSize: 11, fontWeight: 600, color: 'var(--cp-text-muted)' },
  scSelect: { fontSize: 12, padding: '5px 8px', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 4, color: 'var(--cp-text-primary)', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, background: 'var(--cp-surface-2)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)' },
  tr: { borderBottom: '1px solid var(--cp-border)' },
  td: { padding: '10px 12px', color: 'var(--cp-text-muted)', verticalAlign: 'middle' },
  tdBold: { padding: '10px 12px', fontWeight: 700, color: 'var(--cp-text-primary)', verticalAlign: 'middle' },
  fmtBadge: { fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, letterSpacing: 0.4 },
  genBtn: { fontSize: 11, fontWeight: 700, padding: '5px 14px', background: 'var(--cp-surface-3)', color: 'var(--cp-text-primary)', border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'pointer' },
  dlBtn: { fontSize: 11, fontWeight: 700, padding: '5px 14px', background: 'var(--cp-success)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  resetBtn: { fontSize: 11, padding: '5px 8px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'pointer' },
  loadingText: { fontSize: 11, color: 'var(--cp-text-muted)', fontStyle: 'italic' },
  errText: { fontSize: 11, color: 'var(--cp-error)' },
  recentSection: { marginTop: 8 },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cp-text-muted)', textTransform: 'uppercase', marginBottom: 10 },
};
