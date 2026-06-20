'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../hearst.module.css';
import DataCenterProjection from '../components/DataCenterProjection';
import HearstPageShell from '../components/HearstPageShell';
import {
  fmtUSD,
  fmtPctFromRatio,
  fmtX,
  fmtMW,
  MISSING,
  parseApiError,
} from '../utils/format';
import { FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';
import {
  ARCHETYPES,
  DEFAULT_GEOGRAPHY,
  DEFAULT_SIM_SCALE_MW,
  DEFAULT_SIM_AI_MIX_PCT,
  RISK_LABELS,
  SIM_DEBOUNCE_MS,
  SCALE_PRESETS_MW,
  AI_MIX_PRESETS_PCT,
} from '../utils/constants';

// ── Labels ────────────────────────────────────────────────────────────────────
const THESIS_META = {
  shell:   { label: 'Shell + Long Lease',   short: 'Shell' },
  compute: { label: 'Compute Cloud',         short: 'Compute' },
  gov:     { label: 'Sovereign AI Cluster',  short: 'Sovereign' },
};

const INPUT_MODES = [
  { id: 'mw_first',          label: 'MW First',       hint: 'Set capacity → derive CAPEX & returns' },
  { id: 'capital_first',     label: 'Capital First',  hint: 'Set budget → derive max MW' },
  { id: 'target_irr_first',  label: 'Target IRR',     hint: 'Set return target → solve lever' },
];

const SOLVER_LEVERS = [
  { id: 'capex_per_mw', label: 'CAPEX/MW' },
  { id: 'pricing',      label: 'Pricing' },
  { id: 'leverage',     label: 'Leverage' },
  { id: 'mw',          label: 'Scale (MW)' },
];

const GEOGRAPHIES = [
  { id: 'qatar', label: 'Qatar' },
  { id: 'uae',   label: 'UAE' },
  { id: 'ksa',   label: 'KSA' },
  { id: 'gcc',   label: 'GCC' },
];

const CAPEX_USD_PRESETS = [500_000_000, 1_000_000_000, 2_000_000_000, 5_000_000_000];
const IRR_PRESETS_PCT   = [10, 12, 15, 18, 20];

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildPayload({ mode, thesis, scale, aiMix, capitalBudget, targetIrr, lever, geography }) {
  const archetype_id = ARCHETYPES[thesis] ?? ARCHETYPES.compute;
  const hardware_mix = { ai_pct: aiMix };

  let input_value;
  if (mode === 'mw_first') {
    input_value = { total_mw: scale };
  } else if (mode === 'capital_first') {
    input_value = { total_capex_usd: capitalBudget };
  } else {
    input_value = { target_irr_pct: targetIrr, lever, total_mw: scale };
  }

  return {
    input_mode: mode,
    input_value,
    archetype_id,
    hardware_mix,
    geography,
  };
}

function toneForIrr(irr, threshold = FINANCIAL_THRESHOLDS.ic_hurdle_pct / 100) {
  if (irr == null) return '';
  if (irr < 0) return styles.metricValueDanger;
  if (irr < threshold) return styles.metricValueElevated ?? '';
  return '';
}

function numFmt(n, digits = 0) {
  if (n == null || Number.isNaN(n)) return MISSING;
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: digits });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SimulatorPage() {
  // ── Inputs ──────────────────────────────────────────────────────────────────
  const [mode, setMode]               = useState('mw_first');
  const [thesis, setThesis]           = useState('compute');
  const [scale, setScale]             = useState(DEFAULT_SIM_SCALE_MW);
  const [aiMix, setAiMix]             = useState(DEFAULT_SIM_AI_MIX_PCT);
  const [capitalBudget, setCapital]   = useState(1_000_000_000);
  const [targetIrr, setTargetIrr]     = useState(15);
  const [lever, setLever]             = useState('mw');
  const [geography, setGeography]     = useState(DEFAULT_GEOGRAPHY);
  const [attempt, setAttempt]         = useState(0);

  // ── Results ──────────────────────────────────────────────────────────────────
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [result, setResult]     = useState(null);

  const abortRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const payload = buildPayload({ mode, thesis, scale, aiMix, capitalBudget, targetIrr, lever, geography });
        const res = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Simulation failed. Please try again.', {
            badRequestLabel: 'Invalid input',
            forbiddenLabel: 'You do not have access to run simulations.',
          }));
        }
        const data = await res.json();
        if (!active) return;
        setResult(data);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    const t = setTimeout(run, SIM_DEBOUNCE_MS);
    return () => { active = false; clearTimeout(t); };
  }, [mode, thesis, scale, aiMix, capitalBudget, targetIrr, lever, geography, attempt]);

  // ── Derived display values ────────────────────────────────────────────────
  const proj    = result?.projection    ?? {};
  const hw      = result?.hardware_breakdown ?? null;
  const solver  = result?.solver        ?? null;
  const archOut = result?.archetype_outcome ?? null;
  const scenario = result?.scenario     ?? null;

  const capEx   = proj.total_capex       ?? null;
  const irr     = proj.irr_post_tax      ?? proj.irr ?? null;
  const npv     = proj.npv_post_tax      ?? proj.npv ?? null;
  const ebitda  = proj.stabilized_ebitda ?? null;
  const dscr    = proj.dscr_stabilized   ?? null;
  const derivedMw = solver?.lever_value  ?? scenario?.total_mw ?? scale;
  const riskLabel = RISK_LABELS[thesis]  ?? RISK_LABELS.default;
  const riskTone  = thesis === 'compute' ? 'elevated' : 'stable';
  const thesisMeta = THESIS_META[thesis];

  const contextLine = mode === 'mw_first'
    ? `${thesisMeta.label} · ${scale} MW · ${aiMix}% AI mix · ${geography.toUpperCase()}`
    : mode === 'capital_first'
    ? `${thesisMeta.label} · ${fmtUSD(capitalBudget)} budget · ${aiMix}% AI mix · ${geography.toUpperCase()}`
    : `${thesisMeta.label} · ${targetIrr}% target IRR · ${geography.toUpperCase()}`;

  return (
    <HearstPageShell
      variant="instrument"
      title="Projection"
      context={contextLine}
    >
      <div className={styles.simLayout}>

        {/* ── LEFT CONTROLS ──────────────────────────────────────────────── */}
        <aside className={styles.simControls}>

          {/* Input Mode */}
          <div className={styles.controlGroup} role="group" aria-labelledby="mode-label">
            <h2 id="mode-label" className={styles.simSectionTitle}>Simulation Mode</h2>
            {INPUT_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={styles.controlBtn}
                data-active={mode === m.id}
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
              >
                <span>{m.label}</span>
                {mode === m.id && <span className={styles.faintSep}>✓</span>}
              </button>
            ))}
          </div>

          {/* Investment Thesis */}
          <div className={styles.controlGroup} role="group" aria-labelledby="thesis-label">
            <h2 id="thesis-label" className={styles.simSectionTitle}>Investment Thesis</h2>
            {Object.entries(THESIS_META).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                className={styles.controlBtn}
                data-active={thesis === key}
                aria-pressed={thesis === key}
                onClick={() => setThesis(key)}
              >
                <span>{meta.label}</span>
                {thesis === key && <span className={styles.faintSep}>✓</span>}
              </button>
            ))}
          </div>

          {/* Geography */}
          <div className={styles.controlGroup} role="group" aria-labelledby="geo-label">
            <h2 id="geo-label" className={styles.simSectionTitle}>Geography</h2>
            <div className={styles.controlRow}>
              {GEOGRAPHIES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={styles.controlBtn}
                  data-active={geography === g.id}
                  aria-pressed={geography === g.id}
                  aria-label={g.label}
                  onClick={() => setGeography(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* MW / Capital / IRR — conditional on mode */}
          {mode === 'mw_first' && (
            <div className={styles.controlGroup} role="group" aria-labelledby="scale-label">
              <h2 id="scale-label" className={styles.simSectionTitle}>Scale (MW)</h2>
              <div className={styles.controlRow}>
                {SCALE_PRESETS_MW.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={styles.controlBtn}
                    data-active={scale === val}
                    aria-pressed={scale === val}
                    aria-label={`${val} megawatts`}
                    onClick={() => setScale(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'capital_first' && (
            <div className={styles.controlGroup} role="group" aria-labelledby="capital-label">
              <h2 id="capital-label" className={styles.simSectionTitle}>Capital Budget</h2>
              <div className={styles.controlRow}>
                {CAPEX_USD_PRESETS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={styles.controlBtn}
                    data-active={capitalBudget === val}
                    aria-pressed={capitalBudget === val}
                    aria-label={fmtUSD(val)}
                    onClick={() => setCapital(val)}
                  >
                    {fmtUSD(val)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'target_irr_first' && (
            <>
              <div className={styles.controlGroup} role="group" aria-labelledby="irr-label">
                <h2 id="irr-label" className={styles.simSectionTitle}>Target IRR</h2>
                <div className={styles.controlRow}>
                  {IRR_PRESETS_PCT.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={styles.controlBtn}
                      data-active={targetIrr === val}
                      aria-pressed={targetIrr === val}
                      aria-label={`${val} percent IRR`}
                      onClick={() => setTargetIrr(val)}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.controlGroup} role="group" aria-labelledby="lever-label">
                <h2 id="lever-label" className={styles.simSectionTitle}>Solver Lever</h2>
                {SOLVER_LEVERS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={styles.controlBtn}
                    data-active={lever === l.id}
                    aria-pressed={lever === l.id}
                    onClick={() => setLever(l.id)}
                  >
                    <span>{l.label}</span>
                    {lever === l.id && <span className={styles.faintSep}>✓</span>}
                  </button>
                ))}
              </div>
              <div className={styles.controlGroup} role="group" aria-labelledby="scale-irr-label">
                <h2 id="scale-irr-label" className={styles.simSectionTitle}>Base Scale (MW)</h2>
                <div className={styles.controlRow}>
                  {SCALE_PRESETS_MW.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={styles.controlBtn}
                      data-active={scale === val}
                      aria-pressed={scale === val}
                      aria-label={`${val} megawatts`}
                      onClick={() => setScale(val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* AI Mix — always visible */}
          <div className={styles.controlGroup} role="group" aria-labelledby="aimix-label">
            <h2 id="aimix-label" className={styles.simSectionTitle}>AI Infrastructure Mix</h2>
            <div className={styles.controlRow}>
              {AI_MIX_PRESETS_PCT.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={styles.controlBtn}
                  data-active={aiMix === val}
                  aria-pressed={aiMix === val}
                  aria-label={`${val} percent AI mix`}
                  onClick={() => setAiMix(val)}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Retry */}
          {error && (
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => setAttempt((n) => n + 1)}
              disabled={loading}
            >
              Retry
            </button>
          )}
        </aside>

        {/* ── RIGHT — PROJECTION + RESULTS ───────────────────────────────── */}
        <section className={styles.simMain}>

          {/* Blueprint canvas */}
          <DataCenterProjection thesis={thesis} scale={mode === 'mw_first' ? scale : (derivedMw ?? scale)} aiMix={aiMix} />

          {/* Results area */}
          <div className={styles.simReadout} aria-live="polite" aria-busy={loading}>
            {!error && loading && (
              <div className={styles.simComputing}>Computing…</div>
            )}

            {error ? (
              <div className={styles.simError} role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => setAttempt((n) => n + 1)}
                  disabled={loading}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className={styles.simMetrics} data-loading={loading}>

                {/* CAPEX */}
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>Total CAPEX</div>
                  <div className={styles.metricValue}>
                    {loading && capEx == null ? MISSING : fmtUSD(capEx)}
                  </div>
                </div>

                {/* Derived MW — only show when not mw_first */}
                {mode !== 'mw_first' && (
                  <div className={styles.metricItem}>
                    <div className={styles.metricLabel}>
                      {mode === 'capital_first' ? 'Derived MW' : 'Solved MW'}
                    </div>
                    <div className={styles.metricValue}>
                      {loading && derivedMw == null ? MISSING : fmtMW(derivedMw)}
                    </div>
                  </div>
                )}

                {/* IRR */}
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>IRR (post-tax)</div>
                  <div className={`${styles.metricValue} ${toneForIrr(irr)}`}>
                    {loading && irr == null ? MISSING : fmtPctFromRatio(irr)}
                  </div>
                </div>

                {/* NPV */}
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>NPV (post-tax)</div>
                  <div className={`${styles.metricValue} ${irr != null && irr < 0 ? styles.metricValueDanger : ''}`}>
                    {loading && npv == null ? MISSING : fmtUSD(npv)}
                  </div>
                </div>

                {/* EBITDA stabilised */}
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>EBITDA (stabilised)</div>
                  <div className={styles.metricValue}>
                    {loading && ebitda == null ? MISSING : fmtUSD(ebitda)}
                  </div>
                </div>

                {/* DSCR min */}
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>DSCR (min)</div>
                  <div className={`${styles.metricValue} ${dscr != null && dscr < FINANCIAL_THRESHOLDS.dscr_breach_threshold ? styles.metricValueDanger : ''}`}>
                    {loading && dscr == null ? MISSING : dscr != null ? `${Number(dscr).toFixed(2)}×` : MISSING}
                  </div>
                </div>

                {/* GPU Revenue (if hw breakdown present) */}
                {hw && (
                  <div className={styles.metricItem}>
                    <div className={styles.metricLabel}>GPU Rev. (annual)</div>
                    <div className={styles.metricValue}>
                      {loading ? MISSING : fmtUSD(hw.revenue_ai_annual)}
                    </div>
                  </div>
                )}

                {/* Solver convergence — only for target_irr_first */}
                {mode === 'target_irr_first' && solver && (
                  <div className={styles.metricItem}>
                    <div className={styles.metricLabel}>Solver</div>
                    <div className={`${styles.metricValue} ${styles.metricValueRisk}`} data-tone={solver.converged ? 'stable' : 'elevated'}>
                      {solver.converged ? 'Converged' : 'No solution'}
                    </div>
                  </div>
                )}

                {/* Thesis risk */}
                <div className={styles.metricItem}>
                  <div className={styles.metricLabel}>Thesis risk</div>
                  <div className={`${styles.metricValue} ${styles.metricValueRisk}`} data-tone={riskTone}>
                    {riskLabel}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ── RESULTS DETAIL PANEL ──────────────────────────────────────── */}
          {result && !error && (
            <div className={`${styles.cockpitPanel} ${styles.simResultPanel}`}>
              <div className={styles.cockpitPanelHead}>
                <h2 className={styles.cockpitPanelTitle}>
                  {archOut?.label ?? thesisMeta.label} — Results
                </h2>
                {solver?.converged === false && (
                  <span className={styles.tagOff}>No solution</span>
                )}
                {solver?.converged === true && (
                  <span className={styles.tagOn}>Converged</span>
                )}
              </div>

              <div className={styles.simResultGrid}>

                {/* Projection table — year-by-year if available */}
                {Array.isArray(proj.years) && proj.years.length > 0 && (
                  <div className={styles.simResultSection}>
                    <div className={styles.simResultSectionTitle}>Year-by-Year Projection</div>
                    <div className={styles.desktopTableWrap}>
                      <table className={styles.sourcesTable}>
                        <thead>
                          <tr>
                            <th>Year</th>
                            <th>Revenue</th>
                            <th>OPEX</th>
                            <th>EBITDA</th>
                            <th>FCF</th>
                            {proj.years[0]?.dscr != null && <th>DSCR</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {proj.years.map((y) => (
                            <tr key={y.year}>
                              <td>{y.year}</td>
                              <td>{fmtUSD(y.revenue)}</td>
                              <td>{fmtUSD(y.opex)}</td>
                              <td className={y.ebitda < 0 ? styles.negative : ''}>{fmtUSD(y.ebitda)}</td>
                              <td className={y.free_cash_flow < 0 ? styles.negative : ''}>{fmtUSD(y.free_cash_flow)}</td>
                              {y.dscr != null && (
                                <td className={y.dscr < FINANCIAL_THRESHOLDS.dscr_breach_threshold ? styles.negative : ''}>{Number(y.dscr).toFixed(2)}×</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile card list — year-by-year, shown only ≤768px */}
                    <div className={styles.mobileCardList}>
                      {proj.years.map((y) => (
                        <article key={y.year} className={styles.sourceCard}>
                          <div className={styles.simYearCardHead}>
                            <span className={styles.simYearCardYear}>Year {y.year}</span>
                            {y.dscr != null && (
                              <span className={y.dscr < FINANCIAL_THRESHOLDS.dscr_breach_threshold ? styles.tagOff : styles.tagOn}>
                                DSCR {Number(y.dscr).toFixed(2)}×
                              </span>
                            )}
                          </div>
                          <div className={styles.simKvGrid}>
                            <div className={styles.simKvRow}>
                              <span className={styles.simKvKey}>Revenue</span>
                              <span className={styles.simKvVal}>{fmtUSD(y.revenue)}</span>
                            </div>
                            <div className={styles.simKvRow}>
                              <span className={styles.simKvKey}>OPEX</span>
                              <span className={styles.simKvVal}>{fmtUSD(y.opex)}</span>
                            </div>
                            <div className={styles.simKvRow}>
                              <span className={styles.simKvKey}>EBITDA</span>
                              <span className={`${styles.simKvVal} ${y.ebitda < 0 ? styles.negative : ''}`}>{fmtUSD(y.ebitda)}</span>
                            </div>
                            <div className={styles.simKvRow}>
                              <span className={styles.simKvKey}>FCF</span>
                              <span className={`${styles.simKvVal} ${y.free_cash_flow < 0 ? styles.negative : ''}`}>{fmtUSD(y.free_cash_flow)}</span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* Waterfall — capital structure + exit (waterfall.summary) */}
                {result.waterfall?.summary && (
                  <div className={styles.simResultSection}>
                    <div className={styles.simResultSectionTitle}>Capital & Exit</div>
                    <div className={styles.simKvGrid}>
                      {[
                        ['Total Equity',        fmtUSD(result.waterfall.summary.total_equity)],
                        ['Total Debt',          fmtUSD(result.waterfall.summary.total_debt)],
                        ['Preferred Rate',      fmtPctFromRatio(result.waterfall.summary.pref_rate)],
                        ['Terminal Value',      fmtUSD(result.waterfall.summary.terminal_value)],
                        ['TV to Equity',        fmtUSD(result.waterfall.summary.terminal_value_to_equity)],
                        ['Debt at Exit',        fmtUSD(result.waterfall.summary.remaining_debt_at_exit)],
                        ['MOIC (post-tax)',     proj.moic_post_tax != null ? fmtX(proj.moic_post_tax) : MISSING],
                        ['Payback',             proj.payback_years != null ? `${Number(proj.payback_years).toFixed(1)} yrs` : 'Not reached'],
                      ].map(([k, v]) => (
                        <div key={k} className={styles.simKvRow}>
                          <span className={styles.simKvKey}>{k}</span>
                          <span className={styles.simKvVal}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Debt schedule summary (debt_schedule.summary) */}
                {result.debt_schedule?.summary && (
                  <div className={styles.simResultSection}>
                    <div className={styles.simResultSectionTitle}>Debt Structure</div>
                    <div className={styles.simKvGrid}>
                      {[
                        ['Principal',       fmtUSD(result.debt_schedule.summary.principal)],
                        ['Total Interest',  fmtUSD(result.debt_schedule.summary.total_interest)],
                        ['Debt Term',       result.debt_schedule.summary.debt_term_years != null ? `${result.debt_schedule.summary.debt_term_years} yrs` : MISSING],
                        ['Min DSCR',        result.debt_schedule.summary.min_dscr != null ? `${Number(result.debt_schedule.summary.min_dscr).toFixed(2)}×` : MISSING],
                        ['Avg DSCR',        result.debt_schedule.summary.avg_dscr != null ? `${Number(result.debt_schedule.summary.avg_dscr).toFixed(2)}×` : MISSING],
                        ['Covenant Breaches', Array.isArray(result.debt_schedule.summary.breach_years) ? `${result.debt_schedule.summary.breach_years.length} yr(s)` : MISSING],
                      ].map(([k, v]) => (
                        <div key={k} className={styles.simKvRow}>
                          <span className={styles.simKvKey}>{k}</span>
                          <span className={styles.simKvVal}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hardware breakdown — MW allocation + GPU economics */}
                {hw && (
                  <div className={styles.simResultSection}>
                    <div className={styles.simResultSectionTitle}>Capacity & Hardware</div>
                    <div className={styles.simKvGrid}>
                      {[
                        ['Classic MW',         hw.mw_classic != null ? fmtMW(hw.mw_classic) : MISSING],
                        ['Liquid-cooled MW',   hw.mw_liquid != null ? fmtMW(hw.mw_liquid) : MISSING],
                        ['AI MW',              hw.mw_ai != null ? fmtMW(hw.mw_ai) : MISSING],
                        ['GPU CAPEX',          hw.capex_hardware ? fmtUSD(hw.capex_hardware) : MISSING],
                        ['AI Rev. (annual)',   hw.revenue_ai_annual ? fmtUSD(hw.revenue_ai_annual) : MISSING],
                        ...(hw.total_gpus ? [['Total GPUs', numFmt(hw.total_gpus)]] : []),
                      ].map(([k, v]) => (
                        <div key={k} className={styles.simKvRow}>
                          <span className={styles.simKvKey}>{k}</span>
                          <span className={styles.simKvVal}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Solver diagnostic — target_irr_first only */}
                {mode === 'target_irr_first' && solver && (
                  <div className={styles.simResultSection}>
                    <div className={styles.simResultSectionTitle}>Solver Diagnostic</div>
                    <div className={styles.simKvGrid}>
                      {[
                        ['Status',        solver.converged ? 'Converged' : 'Not converged'],
                        ['Iterations',    solver.iterations != null ? String(solver.iterations) : MISSING],
                        ['Lever value',   solver.lever_value != null ? numFmt(solver.lever_value, 2) : MISSING],
                        ['Achieved IRR',  solver.achieved_irr != null ? fmtPctFromRatio(solver.achieved_irr) : MISSING],
                      ].map(([k, v]) => (
                        <div key={k} className={styles.simKvRow}>
                          <span className={styles.simKvKey}>{k}</span>
                          <span className={styles.simKvVal}>{v}</span>
                        </div>
                      ))}
                      {solver.diagnostic && (
                        <div className={`${styles.simKvRow} ${styles.simKvRowFull}`}>
                          <span className={styles.simKvKey}>Note</span>
                          <span className={styles.simKvVal}>{solver.diagnostic}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Archetype scores */}
                {archOut?.scores && (
                  <div className={styles.simResultSection}>
                    <div className={styles.simResultSectionTitle}>Archetype Scores</div>
                    <div className={styles.simKvGrid}>
                      {Object.entries(archOut.scores).map(([dim, score]) => (
                        <div key={dim} className={styles.simKvRow}>
                          <span className={styles.simKvKey}>{dim.charAt(0).toUpperCase() + dim.slice(1)}</span>
                          <span className={styles.simKvVal}>{score}/5</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </section>
      </div>
    </HearstPageShell>
  );
}
