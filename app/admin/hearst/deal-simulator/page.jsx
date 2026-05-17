'use client';
import { useState, useEffect, useMemo } from 'react';
import { projectAllArchetypes } from '@/lib/hearst-deal-structures';
import { MISSING_LABEL } from '@/lib/hearst-constants';

function fmtM(v) { if (v == null) return MISSING_LABEL; return '$' + (v / 1e6).toFixed(0) + 'M'; }
function fmtPct(v) { if (v == null) return MISSING_LABEL; return (v * 100).toFixed(1) + '%'; }
function fmtX(v) { if (v == null) return MISSING_LABEL; return v.toFixed(2) + 'x'; }
function fmtYr(v) { if (v == null) return MISSING_LABEL; return v.toFixed(1) + ' yr'; }

const DIMS = [
  { key: 'brand',       label: 'Brand HEARST' },
  { key: 'bankability', label: 'Bankability' },
  { key: 'speed',       label: 'Speed to MW' },
  { key: 'control',     label: 'Control' },
  { key: 'margin',      label: 'Margin' },
  { key: 'exit',        label: 'Exit liquidity' },
];

function ScoreBar({ value }) {
  return (
    <div style={S.scoreBar}>
      {[1, 2, 3, 4, 5].map(n => (
        <div
          key={n}
          style={{
            ...S.scoreDot,
            background: n <= value ? 'var(--cp-accent-strong)' : 'var(--cp-border)',
          }}
        />
      ))}
    </div>
  );
}

export default function DealSimulatorPage() {
  const [, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState('powered_shell');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load project');
        const { project: proj } = await pRes.json();
        setProject(proj);

        const sRes = await fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`);
        const { scenarios: sc } = await sRes.json();
        setScenarios(sc || []);
        const base = sc?.find(s => s.scenario_type === 'base') || sc?.[0];
        setActiveId(base?.id || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeScenario = scenarios.find(s => s.id === activeId);

  const results = useMemo(() => {
    if (!activeScenario) return [];
    return projectAllArchetypes(activeScenario);
  }, [activeScenario]);

  const selectedResult = results.find(r => r.archetype.id === selected) || results[0];

  if (loading) return <div style={S.loading}>Loading deal simulator…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.topBar}>
        <div>
          <div style={S.pageTitle}>Deal Structure Simulator</div>
          <div style={S.subtitle}>
            Compare HEARST-side economics across the 5 archetypes. Calculations apply each
            structure's factors on top of the active scenario inputs.
          </div>
        </div>
        <div style={S.scenarioSwitch}>
          {scenarios.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              style={{ ...S.scBtn, ...(activeId === s.id ? S.scBtnActive : {}) }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Non-persistence warning */}
      <div style={S.warnBanner}>
        <span style={S.warnIcon}>ⓘ</span>
        <span style={S.warnText}>
          <strong>Illustrative only.</strong> Selecting an archetype here does NOT modify your saved Assumptions or Financial projections.
          To materialize a structure, edit the scenario inputs directly in Assumptions.
        </span>
      </div>

      {/* Reco banner */}
      <div style={S.recoBanner}>
        <span style={S.recoTag}>RECOMMENDED FOR QATAR HUB</span>
        <span style={S.recoText}>
          <strong>Powered Shell + NNN Lease</strong> — HEARST keeps 100% of the building and brand;
          Equinix (or NTT) signs a 15-20 yr triple-net lease. Closest comp:
          Meta × Blue Owl Hyperion, $27B, Oct 2025.
        </span>
      </div>

      {/* Archetype cards grid */}
      <div style={S.grid}>
        {results.map(({ archetype: a, projection: p, score }) => {
          const isSelected = selected === a.id;
          return (
            <div
              key={a.id}
              onClick={() => setSelected(a.id)}
              style={{
                ...S.card,
                ...(a.recommended ? S.cardReco : {}),
                ...(isSelected ? S.cardActive : {}),
              }}
            >
              <div style={S.cardHead}>
                <span style={S.cardCode}>{a.code}</span>
                <span style={S.cardScore}>{score}/100</span>
                {a.recommended && <span style={S.recoChip}>RECO</span>}
              </div>
              <div style={S.cardLabel}>{a.label}</div>
              <div style={S.cardShort}>{a.short}</div>
              <div style={S.cardRole}>{a.operator_role}</div>

              <div style={S.cardKpis}>
                <div style={S.kpiRow}>
                  <span style={S.kpiLabel}>HEARST CAPEX</span>
                  <span style={S.kpiVal}>{fmtM(p.total_capex)}</span>
                </div>
                <div style={S.kpiRow}>
                  <span style={S.kpiLabel}>IRR</span>
                  <span style={{ ...S.kpiVal, color: p.irr != null && p.irr > 0.15 ? 'var(--cp-success)' : p.irr != null && p.irr > 0.08 ? 'var(--cp-warning)' : 'var(--cp-text-primary)' }}>
                    {fmtPct(p.irr)}
                  </span>
                </div>
                <div style={S.kpiRow}>
                  <span style={S.kpiLabel}>MOIC</span>
                  <span style={S.kpiVal}>{fmtX(p.moic)}</span>
                </div>
                <div style={S.kpiRow}>
                  <span style={S.kpiLabel}>Payback</span>
                  <span style={S.kpiVal}>{fmtYr(p.payback_years)}</span>
                </div>
              </div>

              <div style={S.scoreGrid}>
                {DIMS.map(d => (
                  <div key={d.key} style={S.scoreLine}>
                    <span style={S.scoreLabel}>{d.label}</span>
                    <ScoreBar value={a.scores?.[d.key] || 0} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel for selected archetype */}
      {selectedResult && (
        <div style={S.detailWrap}>
          <div style={S.detailTitle}>
            <span style={{ marginRight: 8, fontSize: 14, color: 'var(--cp-text-muted)' }}>
              Archetype {selectedResult.archetype.code}
            </span>
            {selectedResult.archetype.label}
          </div>
          <div style={S.detailDesc}>{selectedResult.archetype.description}</div>

          <div style={S.detailCols}>
            <div style={S.detailCol}>
              <div style={S.detailColTitle}>3 deal terms à négocier hard</div>
              <ol style={S.termList}>
                {selectedResult.archetype.deal_terms.map((t, i) => (
                  <li key={i} style={S.termItem}>{t}</li>
                ))}
              </ol>
            </div>
            <div style={S.detailCol}>
              <div style={S.detailColTitle}>Comparable réel</div>
              <div style={S.compBox}>{selectedResult.archetype.real_comp}</div>

              <div style={{ ...S.detailColTitle, marginTop: 18 }}>Projection détaillée</div>
              <div style={S.miniGrid}>
                <div style={S.miniRow}><span>Total CAPEX HEARST</span><strong>{fmtM(selectedResult.projection.total_capex)}</strong></div>
                <div style={S.miniRow}><span>Stab. Revenue HEARST</span><strong>{fmtM(selectedResult.projection.stabilized_revenue)}</strong></div>
                <div style={S.miniRow}><span>Stab. EBITDA HEARST</span><strong>{fmtM(selectedResult.projection.stabilized_ebitda)}</strong></div>
                <div style={S.miniRow}><span>NPV (10yr)</span><strong>{fmtM(selectedResult.projection.npv)}</strong></div>
                <div style={S.miniRow}><span>Terminal Value</span><strong>{fmtM(selectedResult.projection.terminal_value)}</strong></div>
                <div style={S.miniRow}><span>DSCR (Stab.)</span><strong>{fmtX(selectedResult.projection.dscr_stabilized)}</strong></div>
              </div>

              {selectedResult.projection.missing_inputs?.length > 0 && (
                <div style={S.missingBox}>
                  <strong>Missing inputs:</strong> {selectedResult.projection.missing_inputs.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Methodology footer */}
      <div style={S.methodBox}>
        <div style={S.methodTitle}>Methodology</div>
        <div style={S.methodText}>
          Each archetype applies multiplicative factors on top of the active scenario's CAPEX, revenue, and OPEX inputs.
          Powered Shell zeros out the MEP + cooling CAPEX components (tenant pays) and scales rent down to NNN levels (~33% of full-ops revenue).
          Branded JV scales everything by 0.51 (HEARST equity share). Manage-Only and White-Label keep 100% but add a 12% / 20% operator fee
          as additional OPEX. Sale-Leaseback is shown as a reference exit, not a long-term position. Composite score = mean of brand,
          bankability, speed, control, margin, exit (each rated 1-5). Strategic dimensions weight equally — IRR alone is misleading
          because Powered Shell trades absolute return for capital efficiency, brand retention, and bankability.
        </div>
      </div>
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-surface-1)', borderRadius: 6 },

  topBar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 16, flexWrap: 'wrap' },
  pageTitle: { fontSize: 18, fontWeight: 800, color: 'var(--cp-text-primary)', marginBottom: 4 },
  subtitle: { fontSize: 12, color: 'var(--cp-text-muted)', maxWidth: 640, lineHeight: 1.5 },
  scenarioSwitch: { display: 'flex', gap: 6, flexShrink: 0 },
  scBtn: {
    fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20,
    border: '1px solid var(--cp-border)', background: 'transparent',
    color: 'var(--cp-text-muted)', cursor: 'pointer',
  },
  scBtnActive: { background: 'var(--cp-text-primary)', color: 'var(--cp-bg-deep)', borderColor: 'var(--cp-text-primary)' },

  warnBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border-strong)',
    borderLeft: '3px solid var(--cp-warning)',
    padding: '10px 14px', borderRadius: 6, marginBottom: 12,
    fontSize: 12, color: 'var(--cp-text-primary)',
  },
  warnIcon: {
    fontSize: 14, fontWeight: 800,
    color: 'var(--cp-warning)',
    flexShrink: 0,
  },
  warnText: { fontSize: 12, color: 'var(--cp-text-primary)', lineHeight: 1.5 },

  recoBanner: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--cp-surface-2)',
    borderLeft: '3px solid var(--cp-accent-strong)',
    border: '1px solid var(--cp-border)',
    padding: '12px 16px', borderRadius: 6, marginBottom: 20,
  },
  recoTag: {
    fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
    color: 'var(--cp-accent-strong)',
    background: 'var(--cp-surface-0)',
    padding: '3px 8px', borderRadius: 4, flexShrink: 0,
  },
  recoText: { fontSize: 12, color: 'var(--cp-text-primary)', lineHeight: 1.5 },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12, marginBottom: 24,
  },
  card: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 8, padding: 16, cursor: 'pointer',
    transition: 'border-color .12s, transform .12s',
    display: 'flex', flexDirection: 'column', minHeight: 380,
  },
  cardReco: { borderColor: 'var(--cp-accent-strong)', borderWidth: 2 },
  cardActive: { boxShadow: '0 0 0 2px var(--cp-accent-strong)', transform: 'translateY(-1px)' },

  cardHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardCode: {
    fontSize: 12, fontWeight: 900, color: 'var(--cp-bg-deep)',
    background: 'var(--cp-text-primary)', padding: '3px 9px', borderRadius: 4,
  },
  cardScore: { fontSize: 12, fontWeight: 800, color: 'var(--cp-text-muted)' },
  recoChip: {
    fontSize: 9, fontWeight: 800, letterSpacing: 1,
    background: 'var(--cp-accent-strong)', color: 'var(--cp-text-strong)',
    padding: '2px 7px', borderRadius: 3, marginLeft: 'auto',
  },
  cardLabel: { fontSize: 14, fontWeight: 800, color: 'var(--cp-text-primary)', marginBottom: 2 },
  cardShort: { fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 6 },
  cardRole: {
    fontSize: 10, fontWeight: 700, color: 'var(--cp-text-body)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },

  cardKpis: {
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6, padding: '8px 10px', marginBottom: 12,
  },
  kpiRow: { display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 11 },
  kpiLabel: { color: 'var(--cp-text-muted)' },
  kpiVal: { fontWeight: 700, color: 'var(--cp-text-primary)' },

  scoreGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  scoreLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: 10, color: 'var(--cp-text-muted)' },
  scoreBar: { display: 'flex', gap: 3 },
  scoreDot: { width: 10, height: 4, borderRadius: 2 },

  detailWrap: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 8, padding: 20, marginBottom: 24,
  },
  detailTitle: { fontSize: 16, fontWeight: 800, color: 'var(--cp-text-primary)', marginBottom: 6 },
  detailDesc: { fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.6, marginBottom: 16 },
  detailCols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  detailCol: { minWidth: 0 },
  detailColTitle: {
    fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
    color: 'var(--cp-text-muted)', marginBottom: 8,
  },
  termList: { paddingLeft: 18, margin: 0 },
  termItem: { fontSize: 12, color: 'var(--cp-text-primary)', lineHeight: 1.6, marginBottom: 6 },
  compBox: {
    fontSize: 12, color: 'var(--cp-text-primary)', lineHeight: 1.5,
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)',
    borderRadius: 6, padding: '8px 12px', fontStyle: 'italic',
  },
  miniGrid: {
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)',
    borderRadius: 6, padding: '8px 12px',
  },
  miniRow: {
    display: 'flex', justifyContent: 'space-between', padding: '3px 0',
    borderBottom: '1px solid var(--cp-border)', fontSize: 11, color: 'var(--cp-text-muted)',
  },
  missingBox: {
    background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border-strong)',
    color: 'var(--cp-warning)', padding: '8px 12px', borderRadius: 6, fontSize: 11, marginTop: 10,
  },

  methodBox: {
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6, padding: '12px 16px',
  },
  methodTitle: {
    fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
    color: 'var(--cp-text-muted)', marginBottom: 6,
  },
  methodText: { fontSize: 11, color: 'var(--cp-text-body)', lineHeight: 1.6 },
};
