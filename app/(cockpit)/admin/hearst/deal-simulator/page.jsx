'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEAL_ARCHETYPES, applyArchetype, projectArchetype, SCENARIO_WRITABLE_KEYS } from '@/lib/hearst-deal-structures';
import { MISSING_LABEL } from '@/lib/hearst-constants';

// ─── S2.4: scenario type color mapping (tokens only) ───────────────────────
const SCENARIO_TYPE_STYLES = {
  base:     { color: 'var(--cp-status-cool)',     bg: 'var(--cp-status-cool-bg)' },
  downside: { color: 'var(--cp-status-negative)', bg: 'var(--cp-status-negative-bg)' },
  upside:   { color: 'var(--cp-status-positive)', bg: 'var(--cp-status-positive-bg)' },
};

// ─── S2.1: diff table metrics definition ────────────────────────────────────
const DIFF_METRICS = [
  { key: 'total_capex',          label: 'CAPEX HEARST',      fmt: fmtM,   saleDash: false, higherIsBetter: false },
  { key: 'stabilized_revenue',   label: 'Stab. Revenue',     fmt: fmtM,   saleDash: true,  higherIsBetter: true  },
  { key: 'stabilized_ebitda',    label: 'Stab. EBITDA',      fmt: fmtM,   saleDash: true,  higherIsBetter: true  },
  { key: 'irr',                  label: 'IRR',                fmt: fmtPct, saleDash: false, higherIsBetter: true  },
  { key: 'moic',                 label: 'MOIC',               fmt: fmtX,   saleDash: false, higherIsBetter: true  },
  { key: 'payback_years',        label: 'Payback',            fmt: fmtYr,  saleDash: false, higherIsBetter: false },
  { key: 'dscr_stabilized',      label: 'DSCR',               fmt: fmtX,   saleDash: true,  higherIsBetter: true  },
  { key: '_score',               label: 'Score composite',   fmt: (v) => v != null ? String(Math.round(v)) + '/100' : MISSING_LABEL, saleDash: false, higherIsBetter: true },
];

// ─── Business thresholds — intentionally numeric (metric seuils) ────────────
const IRR_GREEN = 0.15;
const IRR_YELLOW = 0.08;
const DIFF_THRESHOLD = 0.10; // ±10% relative delta for coloured dots
const NAME_MAX = 200;        // max chars for materialised scenario name

// ─── em-dash for unavailable cells ──────────────────────────────────────────
const EM_DASH = '—';

function fmtM(v)   { if (v == null) return MISSING_LABEL; return '$' + (v / 1e6).toFixed(0) + 'M'; }
function fmtPct(v) { if (v == null) return MISSING_LABEL; return (v * 100).toFixed(1) + '%'; }
function fmtX(v)   { if (v == null) return MISSING_LABEL; return v.toFixed(2) + 'x'; }
function fmtYr(v)  { if (v == null) return MISSING_LABEL; return v.toFixed(1) + ' yr'; }

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

// ─── S2.1: Diff table component ─────────────────────────────────────────────
function DiffTable({ results }) {
  if (!results || results.length === 0) return null;

  // Base = highest score (first after sort) or archetype with recommended: true
  const baseResult = results.find(r => r.archetype.recommended) || results[0];
  const baseProj = { ...baseResult.projection, _score: baseResult.score };

  function getDotColor(metric, current, base) {
    if (base == null || base === 0 || current == null) return null;
    const delta = (current - base) / Math.abs(base);
    if (Math.abs(delta) < DIFF_THRESHOLD) return null;
    const isPositive = metric.higherIsBetter ? delta > 0 : delta < 0;
    return isPositive ? 'var(--cp-status-positive)' : 'var(--cp-status-negative)';
  }

  return (
    <div style={S.diffWrap}>
      <div style={S.diffTitle}>Archetype comparison</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={S.diffTable}>
          <thead>
            <tr>
              <th style={{ ...S.diffTh, textAlign: 'left' }}>Metric</th>
              {results.map(({ archetype: a }) => (
                <th key={a.id} style={S.diffTh}>
                  <span style={S.diffArchCode}>{a.code}</span>
                  <span style={S.diffArchLabel}>{a.label.split(' ')[0]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIFF_METRICS.map(m => (
              <tr key={m.key}>
                <td style={{ ...S.diffTd, ...S.diffMetricLabel }}>{m.label}</td>
                {results.map(({ archetype: a, projection: p, score }) => {
                  const isSale = a.compute_as === 'one_time_sale';
                  if (m.saleDash && isSale) {
                    return <td key={a.id} style={{ ...S.diffTd, textAlign: 'center', color: 'var(--cp-text-faint)' }}>{EM_DASH}</td>;
                  }
                  const proj = { ...p, _score: score };
                  const val = proj[m.key];
                  const baseVal = baseProj[m.key];
                  const dotColor = getDotColor(m, val, baseVal); // m carries higherIsBetter
                  return (
                    <td key={a.id} style={{ ...S.diffTd, textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--cp-space-1)' }}>
                        {dotColor && (
                          <span style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: 'var(--cp-radius-pill)',
                            background: dotColor,
                            flexShrink: 0,
                          }} />
                        )}
                        {m.fmt(val)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DealSimulatorPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState('powered_shell');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectId, setProjectId] = useState(null);

  // S3.2 — operator fee overrides (mapping archetype.id → pct value, e.g. 12 for 12%)
  const [operatorFeeOverrides, setOperatorFeeOverrides] = useState({});

  // S2.2 state
  const [materializing, setMaterializing] = useState(false);
  const [materializeError, setMaterializeError] = useState(null);
  const [materializeSuccess, setMaterializeSuccess] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load project');
        const { project: proj } = await pRes.json();
        setProjectId(proj.id);

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

  // S3.2 — merge operator fee override into archetype before projecting
  function getEffectiveArchetype(archetype, overrides) {
    return { ...archetype, operator_fee_pct: overrides[archetype.id] ?? archetype.operator_fee_pct };
  }

  const results = useMemo(() => {
    if (!activeScenario) return [];
    return DEAL_ARCHETYPES
      .map(a => projectArchetype(activeScenario, getEffectiveArchetype(a, operatorFeeOverrides)))
      .sort((a, b) => {
        if (a.archetype.recommended && !b.archetype.recommended) return -1;
        if (!a.archetype.recommended && b.archetype.recommended) return 1;
        return b.score - a.score;
      });
  }, [activeScenario, operatorFeeOverrides]);

  const selectedResult = results.find(r => r.archetype.id === selected) || results[0];

  // ─── S2.2: Materialize handler ────────────────────────────────────────────
  async function handleMaterialize() {
    if (!selectedResult || !activeScenario || !projectId) return;
    const archetype = selectedResult.archetype;

    // Guard: sale-leaseback not supported
    if (archetype.compute_as === 'one_time_sale') {
      setMaterializeError(
        'Sale-Leaseback uses a one-time gain model — materializing not supported in this wave.'
      );
      return;
    }

    setMaterializing(true);
    setMaterializeError(null);
    setMaterializeSuccess(null);

    try {
      const effectiveArchetype = getEffectiveArchetype(archetype, operatorFeeOverrides);
      const modifiedScenario = applyArchetype(activeScenario, effectiveArchetype);
      const writableFields = Object.fromEntries(
        SCENARIO_WRITABLE_KEYS
          .filter(k => modifiedScenario[k] !== undefined)
          .map(k => [k, modifiedScenario[k]])
      );
      const rawName = `${activeScenario.name} × ${archetype.label}`;
      const safeName = rawName.length > NAME_MAX
        ? rawName.slice(0, NAME_MAX - 1).trimEnd() + '…'
        : rawName;
      const body = {
        project_id: projectId,
        name: safeName,
        scenario_type: 'base',
        ...writableFields,
      };

      const res = await fetch('/api/admin/hearst/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(`${res.status} — ${data.error || 'Unknown error'}`);
      }

      const { scenario: newScenario } = await res.json();
      setMaterializeSuccess(`Scenario created — opening Assumptions…`);
      setTimeout(() => {
        router.push(`/admin/hearst/assumptions?scenario_id=${newScenario.id}`);
      }, 900);
    } catch (e) {
      setMaterializeError(e.message);
    } finally {
      setMaterializing(false);
    }
  }

  // ─── S2.3: Export memo handler ────────────────────────────────────────────
  function handleExportMemo() {
    if (!selectedResult || !activeScenario) return;
    const { archetype: selArch, projection } = selectedResult;
    const recoArch = DEAL_ARCHETYPES.find(a => a.recommended) || results[0]?.archetype;
    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');

    const tableRows = DIFF_METRICS.map(m => {
      const cells = results.map(({ archetype: a, projection: p, score }) => {
        const isSale = a.compute_as === 'one_time_sale';
        if (m.saleDash && isSale) return EM_DASH;
        const val = { ...p, _score: score }[m.key];
        return m.fmt(val);
      });
      return `| ${m.label} | ${cells.join(' | ')} |`;
    });

    const archHeaders = results.map(r => `${r.archetype.code} — ${r.archetype.label.split(' ')[0]}`).join(' | ');
    const sepRow = results.map(() => '---').join(' | ');

    const md = `# Deal Structure Memo — ${activeScenario.name}
_Generated ${today.toISOString()}_

## Recommended archetype
**${recoArch?.label ?? MISSING_LABEL}** (${recoArch?.code ?? ''})
${recoArch?.description ?? ''}

Closest comp: ${recoArch?.real_comp ?? MISSING_LABEL}

## Comparison table
| Metric | ${archHeaders} |
| --- | ${sepRow} |
${tableRows.join('\n')}

## Deal terms — ${selArch.label}
${(selArch.deal_terms ?? []).map((t, i) => `${i + 1}. ${t}`).join('\n')}

## Missing inputs
${projection.missing_inputs?.join(', ') || 'None'}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal-memo-${activeScenario.name.toLowerCase().replace(/\s+/g, '-')}-${yyyymmdd}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div style={S.loading}>Loading deal simulator…</div>;
  if (error)   return <div style={S.error}>Error: {error}</div>;

  if (scenarios.length === 0) {
    return (
      <div style={S.emptyState}>
        <div style={S.pageTitle}>Aucun scénario disponible</div>
        <div style={S.subtitle}>Crée d&apos;abord un scénario base dans Assumptions avant de simuler une structure deal.</div>
        <Link href="/admin/hearst/assumptions" style={S.emptyCta}>Aller aux Assumptions →</Link>
      </div>
    );
  }

  const recoArchetype = DEAL_ARCHETYPES.find(a => a.recommended);

  return (
    <div>
      {/* Header */}
      <div style={S.topBar}>
        <div>
          <div style={S.pageTitle}>Deal Structure Simulator</div>
          <div style={S.subtitle}>
            Compare HEARST-side economics across the 5 archetypes. Calculations apply each
            structure&apos;s factors on top of the active scenario inputs.
          </div>
        </div>

        {/* S2.4: Scenario switch with type dot */}
        <div style={S.scenarioSwitch}>
          {scenarios.map(s => {
            const typeStyle = SCENARIO_TYPE_STYLES[s.scenario_type] || SCENARIO_TYPE_STYLES.base;
            const isActive = activeId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                style={{ ...S.scBtn, ...(isActive ? S.scBtnActive : {}) }}
              >
                <span style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: 'var(--cp-radius-pill)',
                  background: typeStyle.color,
                  flexShrink: 0,
                  marginRight: 'var(--cp-space-1)',
                  verticalAlign: 'middle',
                }} />
                {s.name}
              </button>
            );
          })}
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
      {recoArchetype && (
        <div style={S.recoBanner}>
          <span style={S.recoTag}>RECOMMENDED FOR QATAR HUB</span>
          <span style={S.recoText}>
            <strong>{recoArchetype.label}</strong> — {recoArchetype.short}. Closest comp: {recoArchetype.real_comp.split('—')[0].trim()}.
          </span>
        </div>
      )}

      {/* Archetype cards grid */}
      <div style={S.grid}>
        {results.map(({ archetype: a, projection: p, score }) => {
          const isSelected = selected === a.id;
          const isSaleLeaseback = a.compute_as === 'one_time_sale';
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={isSelected}
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
                {isSaleLeaseback && <span style={S.exitChip}>EXIT</span>}
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
                  <span style={{ ...S.kpiVal, color: p.irr != null && p.irr > IRR_GREEN ? 'var(--cp-success)' : p.irr != null && p.irr > IRR_YELLOW ? 'var(--cp-warning)' : 'var(--cp-text-primary)' }}>
                    {fmtPct(p.irr)}
                  </span>
                </div>
                {isSaleLeaseback ? (
                  <>
                    <div style={S.kpiRow}>
                      <span style={S.kpiLabel}>Exit cash</span>
                      <span style={S.kpiVal}>{fmtM(p.terminal_value)}</span>
                    </div>
                    <div style={S.kpiRow}>
                      <span style={S.kpiLabel}>Exit year</span>
                      <span style={S.kpiVal}>{p.payback_years != null ? p.payback_years + ' yr' : MISSING_LABEL}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={S.kpiRow}>
                      <span style={S.kpiLabel}>MOIC</span>
                      <span style={S.kpiVal}>{fmtX(p.moic)}</span>
                    </div>
                    <div style={S.kpiRow}>
                      <span style={S.kpiLabel}>Payback</span>
                      <span style={S.kpiVal}>{fmtYr(p.payback_years)}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={S.scoreGrid}>
                {DIMS.map(d => (
                  <div key={d.key} style={S.scoreLine}>
                    <span style={S.scoreLabel}>{d.label}</span>
                    <ScoreBar value={a.scores?.[d.key] || 0} />
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* S2.1: Diff table */}
      <DiffTable results={results} />

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
                {selectedResult.projection.sale_mode ? (
                  <>
                    <div style={S.miniRow}><span>Sale proceeds (exit yr)</span><strong>{fmtM(selectedResult.projection.terminal_value)}</strong></div>
                    <div style={S.miniRow}><span>Exit yield assumed</span><strong>{(selectedResult.archetype.sale_yield_target * 100).toFixed(1) + '%'}</strong></div>
                  </>
                ) : (
                  <>
                    <div style={S.miniRow}><span>Stab. Revenue HEARST</span><strong>{fmtM(selectedResult.projection.stabilized_revenue)}</strong></div>
                    <div style={S.miniRow}><span>Stab. EBITDA HEARST</span><strong>{fmtM(selectedResult.projection.stabilized_ebitda)}</strong></div>
                    <div style={S.miniRow}><span>DSCR (Stab.)</span><strong>{fmtX(selectedResult.projection.dscr_stabilized)}</strong></div>
                  </>
                )}
                <div style={S.miniRow}><span>NPV (10yr)</span><strong>{fmtM(selectedResult.projection.npv)}</strong></div>
                <div style={S.miniRow}><span>Terminal Value</span><strong>{fmtM(selectedResult.projection.terminal_value)}</strong></div>
              </div>

              {/* S3.2 — Operator fee slider (only for archetypes with an operator fee) */}
              {selectedResult.archetype.operator_fee_pct > 0 && (
                <div style={S.sliderWrap}>
                  <label style={S.sliderLabel}>
                    Operator fee:{' '}
                    <strong style={{ color: 'var(--cp-accent-strong)' }}>
                      {(operatorFeeOverrides[selectedResult.archetype.id] ?? selectedResult.archetype.operator_fee_pct).toFixed(1)}%
                    </strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="0.5"
                    value={operatorFeeOverrides[selectedResult.archetype.id] ?? selectedResult.archetype.operator_fee_pct}
                    onChange={e =>
                      setOperatorFeeOverrides(prev => ({
                        ...prev,
                        [selectedResult.archetype.id]: parseFloat(e.target.value),
                      }))
                    }
                    style={S.sliderInput}
                  />
                  <div style={S.sliderTicks}>
                    <span>5%</span>
                    <span>30%</span>
                  </div>
                </div>
              )}

              {/* S2.5: Missing inputs as deep-links */}
              {selectedResult.projection.missing_inputs?.length > 0 && (
                <div style={S.missingBox}>
                  <strong>Missing inputs:</strong>{' '}
                  {selectedResult.projection.missing_inputs.map((field, i) => (
                    <span key={field}>
                      {i > 0 && <span style={{ color: 'var(--cp-text-muted)' }}>, </span>}
                      <Link
                        href={`/admin/hearst/assumptions?focus=${field}`}
                        style={S.missingLink}
                      >
                        {field}
                      </Link>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* S2.2 + S2.3: CTA row */}
          <div style={S.ctaRow}>
            <button
              style={{
                ...S.btnPrimary,
                ...((materializing || selectedResult?.archetype?.compute_as === 'one_time_sale') ? S.btnDisabled : {}),
              }}
              onClick={handleMaterialize}
              disabled={materializing || selectedResult?.archetype?.compute_as === 'one_time_sale'}
              title={selectedResult?.archetype?.compute_as === 'one_time_sale'
                ? 'Sale-Leaseback uses a one-time gain model — not materializable in this wave.'
                : undefined}
            >
              {materializing ? 'Creating…' : 'Materialize as new scenario'}
            </button>
            <button style={S.btnGlass} onClick={handleExportMemo}>
              Export memo
            </button>
          </div>

          {/* S2.2: feedback messages */}
          {materializeError && (
            <div style={S.ctaError}>{materializeError}</div>
          )}
          {materializeSuccess && (
            <div style={S.ctaSuccess}>{materializeSuccess}</div>
          )}
        </div>
      )}

      {/* Methodology footer */}
      <div style={S.methodBox}>
        <div style={S.methodTitle}>Methodology</div>
        <div style={S.methodText}>
          Each archetype applies multiplicative factors on top of the active scenario&apos;s CAPEX, revenue, and OPEX inputs.
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
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-surface-1)', borderRadius: 6 },

  topBar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 16, flexWrap: 'wrap' },
  pageTitle: { fontSize: 18, fontWeight: 800, color: 'var(--cp-text-primary)', marginBottom: 4 },
  subtitle: { fontSize: 12, color: 'var(--cp-text-muted)', maxWidth: 640, lineHeight: 1.5 },
  scenarioSwitch: { display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' },
  scBtn: {
    display: 'inline-flex', alignItems: 'center',
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
    textAlign: 'left', font: 'inherit', width: '100%',
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
  exitChip: {
    fontSize: 9, fontWeight: 800, letterSpacing: 1,
    background: 'var(--cp-warning)', color: 'var(--cp-bg-deep)',
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

  // ─── S2.1: Diff table styles ───────────────────────────────────────────
  diffWrap: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    padding: 'var(--cp-space-5)',
    marginBottom: 'var(--cp-space-6)',
  },
  diffTitle: {
    fontSize: 'var(--cp-font-md)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-primary)',
    marginBottom: 'var(--cp-space-3)',
  },
  diffTable: { width: '100%', borderCollapse: 'collapse' },
  diffTh: {
    fontSize: 'var(--cp-font-micro)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    color: 'var(--cp-text-muted)',
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    borderBottom: '1px solid var(--cp-border-soft)',
    fontWeight: 'var(--cp-weight-semibold)',
    textAlign: 'center',
  },
  diffArchCode: {
    display: 'block',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-primary)',
    marginBottom: 'var(--cp-space-0)',
  },
  diffArchLabel: {
    display: 'block',
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-faint)',
  },
  diffTd: {
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    borderBottom: '1px solid var(--cp-border-soft)',
    fontSize: 'var(--cp-font-sm)',
    color: 'var(--cp-text-body)',
  },
  diffMetricLabel: {
    fontSize: 'var(--cp-font-micro)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    color: 'var(--cp-text-muted)',
    fontWeight: 'var(--cp-weight-semibold)',
    textAlign: 'left',
  },

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

  // S3.2 — operator fee slider
  sliderWrap: {
    marginTop: 'var(--cp-space-3)',
    padding: 'var(--cp-space-3) var(--cp-space-4)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-sm)',
  },
  sliderLabel: {
    display: 'block',
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
    marginBottom: 'var(--cp-space-2)',
    fontWeight: 'var(--cp-weight-semibold)',
  },
  sliderInput: {
    display: 'block',
    width: '100%',
    accentColor: 'var(--cp-accent-strong)',
    cursor: 'pointer',
  },
  sliderTicks: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-faint)',
    marginTop: 'var(--cp-space-1)',
  },

  // S2.5: missing input link
  missingLink: {
    color: 'var(--cp-accent-strong)',
    textDecoration: 'underline',
    cursor: 'pointer',
  },

  // ─── S2.2 + S2.3: CTA row ─────────────────────────────────────────────
  ctaRow: {
    display: 'flex',
    gap: 'var(--cp-space-3)',
    marginTop: 'var(--cp-space-5)',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-semibold)',
    padding: 'var(--cp-space-2) var(--cp-space-5)',
    borderRadius: 'var(--cp-radius-sm)',
    border: 'none',
    background: 'var(--cp-accent-strong)',
    color: 'var(--cp-text-strong)',
    transition: 'opacity var(--cp-dur-fast) var(--cp-ease)',
  },
  btnGlass: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-semibold)',
    padding: 'var(--cp-space-2) var(--cp-space-5)',
    borderRadius: 'var(--cp-radius-sm)',
    border: '1px solid var(--cp-border-strong)',
    background: 'var(--cp-surface-1)',
    color: 'var(--cp-text-primary)',
    transition: 'opacity var(--cp-dur-fast) var(--cp-ease)',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  ctaError: {
    marginTop: 'var(--cp-space-3)',
    padding: 'var(--cp-space-2) var(--cp-space-4)',
    borderRadius: 'var(--cp-radius-sm)',
    background: 'var(--cp-error-bg)',
    border: '1px solid var(--cp-border-strong)',
    color: 'var(--cp-error)',
    fontSize: 'var(--cp-font-xs)',
  },
  ctaSuccess: {
    marginTop: 'var(--cp-space-3)',
    padding: 'var(--cp-space-2) var(--cp-space-4)',
    borderRadius: 'var(--cp-radius-sm)',
    background: 'var(--cp-success-bg)',
    border: '1px solid var(--cp-border)',
    color: 'var(--cp-success)',
    fontSize: 'var(--cp-font-xs)',
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

  emptyState: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 8, padding: 24, maxWidth: 480,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  emptyCta: {
    display: 'inline-block',
    fontSize: 13, fontWeight: 700,
    color: 'var(--cp-accent-strong)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-accent-strong)',
    borderRadius: 6, padding: '8px 16px',
    textDecoration: 'none', alignSelf: 'flex-start',
  },
};
