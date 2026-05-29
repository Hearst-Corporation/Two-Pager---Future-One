'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SectionTabs from '@/components/hearst/SectionTabs';

// Only the Investment Memo has a working generator today: the per-memo PDF
// served from the Dossier (strategic-memos/[id]/pdf). The other templates have
// no server-side export route yet, so they are shown as "not available yet"
// rather than wired to missing endpoints (which would 404). No fake exports.
const TEMPLATES = [
  { id: 'memo',        title: 'Investment Memo',   format: 'PDF',   pages: '—',      tags: 'Investor · LP · Deal',    available: true  },
  { id: 'term-sheet',  title: 'Term Sheet',         format: 'PDF',   pages: '—',      tags: 'Legal · Deal · Operator', available: false },
  { id: 'xlsx',        title: 'Financial Model',    format: 'Excel', pages: '—',      tags: 'Finance · Model',         available: false },
  { id: 'capex',       title: 'CAPEX Schedule',     format: 'Excel', pages: '—',      tags: 'Construction · Cost',     available: false },
  { id: 'lender-pack', title: 'Lender Package',     format: 'PDF',   pages: '—',      tags: 'Debt · Lender · Credit',  available: false },
  { id: 'one-pager',   title: 'One-Pager Teaser',   format: 'PDF',   pages: '—',      tags: 'Teaser · Quick',          available: false },
];

// Format badges — neutral palette, differentiation by label only.
const FMT_COLORS = {
  PDF:   { color: 'var(--cp-text-body)',    bg: 'var(--cp-surface-2)' },
  Excel: { color: 'var(--cp-text-primary)', bg: 'var(--cp-surface-3)' },
};

export default function DocumentsPage() {
  const [project, setProject]               = useState(null);
  const [scenarios, setScenarios]           = useState([]);
  const [selectedScenarioId, setSelected]   = useState('');
  const [loading, setLoading]               = useState(true);

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

  if (loading) return <div style={S.loading}>Loading…</div>;

  return (
    <div style={S.wrap}>
      <SectionTabs section="library" />
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
            <th style={S.th}>Status</th>
            <th style={S.th}></th>
          </tr>
        </thead>
        <tbody>
          {TEMPLATES.map(tpl => {
            const fmt = FMT_COLORS[tpl.format] || {};
            return (
              <tr key={tpl.id} style={S.tr}>
                <td style={S.tdBold}>{tpl.title}</td>
                <td style={S.td}>
                  <span style={{ ...S.fmtBadge, color: fmt.color, background: fmt.bg }}>{tpl.format}</span>
                </td>
                <td style={S.td}>{tpl.pages}</td>
                <td style={{ ...S.td, color: 'var(--cp-text-muted)', fontSize: 11 }}>{tpl.tags}</td>
                <td style={{ ...S.td, color: 'var(--cp-text-muted)', fontSize: 11 }}>
                  {tpl.available ? 'PDF in Dossier' : 'Not available yet'}
                </td>
                <td style={{ ...S.td, textAlign: 'right' }}>
                  {tpl.available ? (
                    <Link
                      href={selectedScenarioId ? `/admin/hearst/dossier?scenario=${selectedScenarioId}` : '/admin/hearst/dossier'}
                      style={{ ...S.genBtn, textDecoration: 'none' }}
                      title="Open this scenario's strategic memo in the Dossier (PDF export available there)"
                    >
                      Open in Dossier →
                    </Link>
                  ) : (
                    <button disabled title="Server-side export for this template is not available yet" style={S.disabledBtn}>
                      Not available yet
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={S.note}>
        The Investment Memo opens in the Dossier, where the per-memo PDF export is available.
        Other document templates are not generated yet and are marked accordingly.
      </div>
    </div>
  );
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 20, lineHeight: '28px', fontWeight: 800, color: 'var(--cp-text-primary)' },
  scLabel: { fontSize: 11, fontWeight: 600, color: 'var(--cp-text-muted)' },
  scSelect: { fontSize: 12, padding: '5px 8px', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 4, color: 'var(--cp-text-primary)', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, background: 'var(--cp-surface-2)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)' },
  tr: { borderBottom: '1px solid var(--cp-border)' },
  td: { padding: '10px 12px', color: 'var(--cp-text-muted)', verticalAlign: 'middle' },
  tdBold: { padding: '10px 12px', fontWeight: 700, color: 'var(--cp-text-primary)', verticalAlign: 'middle' },
  fmtBadge: { fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: 0.4 },
  genBtn: { fontSize: 11, fontWeight: 700, padding: '5px 16px', background: 'var(--cp-surface-3)', color: 'var(--cp-text-primary)', border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'pointer' },
  disabledBtn: { fontSize: 11, fontWeight: 700, padding: '5px 16px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'not-allowed', opacity: 0.6 },
  note: { fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.5, maxWidth: 560 },
  dlBtn: { fontSize: 11, fontWeight: 700, padding: '5px 16px', background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', border: 'none', borderRadius: 4, cursor: 'pointer' },
  resetBtn: { fontSize: 11, padding: '5px 8px', background: 'transparent', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', borderRadius: 4, cursor: 'pointer' },
  loadingText: { fontSize: 11, color: 'var(--cp-text-muted)', fontStyle: 'italic' },
  errText: { fontSize: 11, color: 'var(--cp-error)' },
  recentSection: { marginTop: 8 },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cp-text-muted)', textTransform: 'uppercase', marginBottom: 10 },
};
