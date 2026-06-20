'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './simulator.module.css';
import {
  fmtUSD,
  fmtPctFromRatio,
  fmtX,
  MISSING,
  parseApiError,
} from '../utils/format';
import {
  GPU_SKU_PRESETS,
  DEFAULT_GPU_HOUR_PRICE,
  DEFAULT_GPU_UTIL_PCT,
} from '../utils/constants';
import {
  INPUT_MODES,
  SOLVER_LEVERS,
  ARCHETYPE_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  GEOGRAPHY_OPTIONS,
  OPERATOR_STRATEGY_OPTIONS,
  OVERRIDE_GROUPS,
  OVERRIDE_KEYS,
} from '../utils/sim-levers';
import { buildMemoPayloadFromSimResult } from '../../../../lib/hearst-memo-payload';

const DEFAULT_CAPITAL_MUSD = 1500; // $M, used if capital_first is left blank
const DEFAULT_PUE = 1.35;

function numFmt(n, digits = 0) {
  if (n == null || Number.isNaN(n)) return MISSING;
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: digits });
}

// Compact placeholder for an override field, read from the last resolved scenario.
function placeholderFor(scenario, key) {
  if (!scenario) return 'default';
  const v = scenario[key];
  if (v == null || Number.isNaN(Number(v))) return 'default';
  const n = Number(v);
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return String(n);
}

export default function SimulatorPage() {
  const router = useRouter();

  // ── Entry mode (input_mode + input_value) ────────────────────────────────────
  const [inputMode, setInputMode]     = useState('mw_first');
  const [scale, setScale]             = useState(150);          // total_mw
  const [capitalMusd, setCapitalMusd] = useState('');           // capital_first ($M)
  const [targetIrr, setTargetIrr]     = useState(15);           // target_irr_first (%)
  const [solverLever, setSolverLever] = useState('pricing');

  // ── Positioning ──────────────────────────────────────────────────────────────
  const [archetype, setArchetype]         = useState('neocloud_gpu');
  const [businessModel, setBusinessModel] = useState('');
  const [geography, setGeography]         = useState('qatar');

  // ── Hardware mix ─────────────────────────────────────────────────────────────
  const [classicMix, setClassicMix]   = useState(25);
  const [liquidMix, setLiquidMix]     = useState(25);
  const [aiMix, setAiMix]             = useState(50);
  const [gpuSku, setGpuSku]           = useState('h100_sxm5');
  const [gpuHourPrice, setGpuHourPrice] = useState(DEFAULT_GPU_HOUR_PRICE);
  const [pueAssumption, setPueAssumption] = useState(DEFAULT_PUE); // → scenario_overrides.pue
  const [utilizationPct, setUtilizationPct] = useState(DEFAULT_GPU_UTIL_PCT);
  const [numRacks, setNumRacks]       = useState('');

  // ── Deep model overrides (scenario_overrides) ────────────────────────────────
  const [overrides, setOverrides]               = useState({}); // { field: stringValue }
  const [operatorStrategy, setOperatorStrategy] = useState('');
  const [showAdvanced, setShowAdvanced]         = useState(false);

  // ── UI State ─────────────────────────────────────────────────────────────────
  const [isResultsMode, setIsResultsMode] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [result, setResult]     = useState(null);

  // ── Memo generation state ────────────────────────────────────────────────────
  const [memoGenerating, setMemoGenerating] = useState(false);
  const [memoError, setMemoError]           = useState(null);

  const abortRef = useRef(null);

  const archetypeLabel = ARCHETYPE_OPTIONS.find(a => a.id === archetype)?.label ?? archetype;

  // ── Payload builder — only sends levers the engine actually consumes ──────────
  const buildPayload = () => {
    let input_value;
    if (inputMode === 'capital_first') {
      const musd = Number(capitalMusd) > 0 ? Number(capitalMusd) : DEFAULT_CAPITAL_MUSD;
      input_value = { total_capex_usd: Math.round(musd * 1_000_000) };
    } else if (inputMode === 'target_irr_first') {
      input_value = { target_irr_pct: Number(targetIrr), lever: solverLever, total_mw: scale };
    } else {
      input_value = { total_mw: scale };
    }

    const hardware_mix = {
      classic_pct: classicMix,
      liquid_pct: liquidMix,
      ai_pct: aiMix,
      gpu_sku_id: gpuSku,
      gpu_hour_price: gpuHourPrice,
      utilization_pct: utilizationPct,
    };
    if (Number(numRacks) > 0) hardware_mix.num_racks = Number(numRacks);

    // PUE: dedicated slider → real engine field (scenario_overrides.pue).
    // NOT a top-level pue_assumption field — SimulateRequestSchema is .strict()
    // and would reject any unknown key with a 400.
    const scenario_overrides = {};
    if (Number(pueAssumption) > 0) scenario_overrides.pue = Number(pueAssumption);
    // Drawer overrides applied after, so a drawer value wins over the slider default.
    for (const key of OVERRIDE_KEYS) {
      const raw = overrides[key];
      if (raw !== undefined && raw !== '' && !Number.isNaN(Number(raw))) {
        scenario_overrides[key] = Number(raw);
      }
    }
    if (operatorStrategy) scenario_overrides.operator_strategy = operatorStrategy;

    const payload = {
      input_mode: inputMode,
      input_value,
      archetype_id: archetype,
      geography,
      hardware_mix,
    };
    if (businessModel) payload.business_model_id = businessModel;
    if (Object.keys(scenario_overrides).length > 0) payload.scenario_overrides = scenario_overrides;
    return payload;
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleRunSimulation = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setIsResultsMode(true);

    try {
      const res = await fetch('/api/admin/hearst/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Simulation failed. Please try again.', {
          badRequestLabel: 'Invalid input',
          forbiddenLabel: 'You do not have access to run simulations.',
        }));
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Proportional load-mix rebalancing — keeps classic/liquid/ai summing to 100%.
  const updateMix = (type, val) => {
    const newMixValue = Math.max(0, Math.min(100, val));
    const currentMixes = { classic: classicMix, liquid: liquidMix, ai: aiMix };
    currentMixes[type] = newMixValue;

    const otherTypes = Object.keys(currentMixes).filter(k => k !== type);
    const totalOther = otherTypes.reduce((sum, k) => sum + currentMixes[k], 0);

    if (newMixValue + totalOther > 100) {
      const excess = (newMixValue + totalOther) - 100;
      if (totalOther > 0) {
        for (const k of otherTypes) {
          currentMixes[k] = Math.max(0, currentMixes[k] - (excess * (currentMixes[k] / totalOther)));
        }
      }
    } else if (newMixValue + totalOther < 100) {
      const deficit = 100 - (newMixValue + totalOther);
      if (totalOther > 0) {
        for (const k of otherTypes) {
          currentMixes[k] = currentMixes[k] + (deficit * (currentMixes[k] / totalOther));
        }
      }
    }

    setClassicMix(Math.round(currentMixes.classic));
    setLiquidMix(Math.round(currentMixes.liquid));
    setAiMix(Math.round(currentMixes.ai));
  };

  const setOverride = (key, value) => setOverrides(prev => ({ ...prev, [key]: value }));
  const clearOverrides = () => { setOverrides({}); setOperatorStrategy(''); };
  const overrideCount = Object.values(overrides).filter(v => v !== '' && v != null).length
    + (operatorStrategy ? 1 : 0);

  const handleReset = () => {
    setIsResultsMode(false);
    setResult(null);
    setError(null);
    setMemoError(null);
  };

  const handleGenerateMemo = async () => {
    if (!result || memoGenerating) return;
    setMemoGenerating(true);
    setMemoError(null);

    const label = result.archetype_outcome?.label ?? archetypeLabel;
    const title = `${label} — ${scale} MW`;

    try {
      // P0-a — resolve project_id so the memo is linked and visible in the Dossier
      let projectId = null;
      try {
        const projRes = await fetch('/api/admin/hearst/project');
        if (projRes.ok) {
          const projJson = await projRes.json().catch(() => null);
          const id = projJson?.project?.id ?? projJson?.id ?? null;
          if (id && typeof id === 'string' && id.length > 0) projectId = id;
        }
      } catch (_) { /* non-blocking — proceed without project_id */ }

      const body = {
        payload: buildMemoPayloadFromSimResult(result),
        audience: 'investor',
        title,
      };
      if (projectId) body.project_id = projectId;

      const res = await fetch('/api/admin/hearst/strategic-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // P1-b — align error parsing with handleRunSimulation pattern
      if (!res.ok) {
        setMemoError(await parseApiError(res, 'Memo generation failed. Please try again.', {
          badRequestLabel: 'Invalid scenario for memo',
          forbiddenLabel: 'You do not have permission to generate memos.',
        }));
        return;
      }

      // P0-b — 207 means memo generated but persist failed; do not redirect
      const json = await res.json().catch(() => ({}));
      if (res.status === 207 || json?.persisted?.error) {
        setMemoError('Memo generated but could not be saved. Please retry.');
        return;
      }

      router.push('/admin/hearst/dossier');
    } catch (err) {
      setMemoError(err.message);
    } finally {
      setMemoGenerating(false);
    }
  };

  // ── Derived display values ────────────────────────────────────────────────
  const proj    = result?.projection ?? {};
  const hw      = result?.hardware_breakdown ?? null;
  const solver  = result?.solver ?? null;
  const derived = result?.derived ?? null;
  const resolvedScenario = result?.scenario ?? null;

  const capEx   = proj.total_capex ?? null;
  const irr     = proj.irr_post_tax ?? proj.irr ?? null;
  const npv     = proj.npv_post_tax ?? proj.npv ?? null;
  const ebitda  = proj.stabilized_ebitda ?? null;
  const dscr    = proj.dscr_stabilized ?? null;
  const moic    = proj.moic_post_tax ?? null;

  // Render helpers
  const renderHardwareRows = () => {
    if (!hw) return null;
    const rows = [];
    if (hw.mw_classic > 0) {
      rows.push({ name: 'Classic Compute', qty: '-', capex: hw.capex_classic });
    }
    if (hw.mw_liquid > 0) {
      rows.push({ name: 'Liquid Cooled', qty: '-', capex: hw.capex_liquid });
    }
    if (hw.mw_ai > 0) {
      const skuName = GPU_SKU_PRESETS.find(s => s.id === gpuSku)?.label || gpuSku;
      rows.push({ name: skuName, qty: numFmt(hw.total_gpus), capex: hw.capex_hardware });
    }
    return rows.map((r, i) => (
      <tr key={i} className={styles.tableRow}>
        <td className={styles.textSm}>{r.name}</td>
        <td className={`${styles.textSm} ${styles.textRight} ${styles.textMono}`}>{r.qty}</td>
        <td className={`${styles.textSm} ${styles.textRight} ${styles.textMono}`}>{fmtUSD(r.capex)}</td>
      </tr>
    ));
  };

  return (
    <div className={styles.container}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <div className={styles.item}>
          <span className={styles.lbl}>
            <span className={loading ? styles.liveDotActive : styles.liveDot}></span>
            {loading ? 'COMPUTING...' : isResultsMode ? 'EVIDENCE-LINKED MODEL' : 'PROJECTION COCKPIT'}
          </span>
        </div>
        <div className={styles.item} style={{flex: 1}}></div>
        <div className={styles.item}>
          <span className={`${styles.lbl} ${styles.textMuted}`}>
            {isResultsMode ? 'FINANCIAL OUTCOMES' : 'UNDERWRITING PARAMETERS'}
          </span>
        </div>
      </div>

      <div className={styles.gridMain}>
        {/* LEFT COLUMN */}
        <div className={styles.col}>
          {!isResultsMode ? (
            <div className={`${styles.fadeEnterActive} ${styles.bracketBox}`}>
              <div className={styles.panelHeader}>
                <span className={styles.panelId}>INF-01</span>
                <div className={styles.lbl}>ENTRY MODE & POWER</div>
              </div>

              {/* INPUT MODE TABS */}
              <div className={styles.rowNoPad} style={{marginBottom: '2rem'}}>
                <div className={`${styles.lbl} ${styles.textWhite}`}>SOLVE FROM</div>
                <div className={styles.modeTabs}>
                  {INPUT_MODES.map(m => (
                    <button
                      key={m.id}
                      className={`${styles.modeTab} ${inputMode === m.id ? styles.modeTabActive : ''}`}
                      onClick={() => setInputMode(m.id)}
                      title={m.hint}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {inputMode === 'capital_first' && (
                  <div style={{marginTop: '1rem'}}>
                    <div className={styles.lbl}>CAPITAL BUDGET ($M)</div>
                    <input
                      type="number" min="1" step="50"
                      className={styles.numInput}
                      style={{marginTop: '0.5rem'}}
                      placeholder={`${DEFAULT_CAPITAL_MUSD}`}
                      value={capitalMusd}
                      onChange={(e) => setCapitalMusd(e.target.value)}
                    />
                    <div className={styles.solverNote}>Engine solves MW so total CAPEX ≈ budget.</div>
                  </div>
                )}

                {inputMode === 'target_irr_first' && (
                  <div style={{marginTop: '1rem'}}>
                    <div className={styles.flexBetween}>
                      <div className={styles.lbl}>TARGET IRR (%)</div>
                      <span className={`${styles.textMono} ${styles.textAccent}`}>{targetIrr}%</span>
                    </div>
                    <input
                      type="range" min="0" max="60" step="0.5"
                      className={styles.slider}
                      value={targetIrr}
                      onChange={(e) => setTargetIrr(Number(e.target.value))}
                    />
                    <div className={`${styles.lbl} ${styles.textWhite}`} style={{marginTop: '0.75rem'}}>SOLVE LEVER</div>
                    <div className={styles.modeTabs} style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
                      {SOLVER_LEVERS.map(l => (
                        <button
                          key={l.id}
                          className={`${styles.modeTab} ${solverLever === l.id ? styles.modeTabActive : ''}`}
                          onClick={() => setSolverLever(l.id)}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                    <div className={styles.solverNote}>Bisection finds the {SOLVER_LEVERS.find(l => l.id === solverLever)?.label} that hits {targetIrr}% IRR.</div>
                  </div>
                )}
              </div>

              {/* LOAD MIX */}
              <div className={styles.rowNoPad}>
                <div className={`${styles.lbl} ${styles.textWhite}`} style={{marginBottom: '1rem'}}>LOAD MIX (100% TOTAL)</div>

                <div className={styles.mixControl}>
                  <div className={styles.mixItem}>
                    <div className={styles.flexBetween}>
                      <span className={styles.switchLabel}>CLASSIC COMPUTE</span>
                      <span className={styles.textMono}>{classicMix}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={classicMix}
                      className={styles.slider}
                      onChange={(e) => updateMix('classic', Number(e.target.value))}
                    />
                  </div>

                  <div className={styles.mixItem}>
                    <div className={styles.flexBetween}>
                      <span className={styles.switchLabel}>LIQUID COOLING</span>
                      <span className={styles.textMono}>{liquidMix}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={liquidMix}
                      className={styles.slider}
                      onChange={(e) => updateMix('liquid', Number(e.target.value))}
                    />
                  </div>

                  <div className={styles.mixItem}>
                    <div className={styles.flexBetween}>
                      <span className={styles.switchLabel}>AI FACTORY</span>
                      <span className={styles.textMono} style={{color: 'var(--accent-gold)'}}>{aiMix}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={aiMix}
                      className={styles.slider}
                      onChange={(e) => updateMix('ai', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* TARGET CAPACITY + PUE */}
              <div className={styles.rowStretch} style={{padding: '1.5rem 0'}}>
                <div className={styles.flexBetween}>
                  <div className={`${styles.lbl} ${styles.textWhite}`}>
                    {inputMode === 'capital_first' ? 'CAPACITY (SOLVED)' : 'TARGET CAPACITY'}
                  </div>
                  <div className={`${styles.textLg} ${styles.textWhite} ${styles.textMono}`} style={{textShadow: '0 0 15px rgba(255,255,255,0.2)'}}>{scale} MW</div>
                </div>
                <div className={styles.lbl} style={{textTransform: 'uppercase', marginTop: '0.25rem', fontSize: '0.6rem', opacity: 0.6}}>
                  {inputMode === 'capital_first' ? 'BUDGET DRIVES MW' : 'SCALABLE CAMPUS ENVELOPE'}
                </div>

                <div className={styles.sliderContainer} style={{marginTop: '2rem'}}>
                  <div style={{position: 'absolute', left: '-10px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, var(--accent-gold), transparent)'}}></div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={scale}
                    className={styles.slider}
                    disabled={inputMode === 'capital_first'}
                    onChange={(e) => setScale(Number(e.target.value))}
                  />
                  <div className={styles.flexBetween} style={{marginTop: '1rem'}}>
                    <div className={`${styles.lbl} ${styles.textMono}`} style={{fontSize: '0.6rem'}}>MIN_10</div>
                    <div className={`${styles.lbl} ${styles.textMono}`} style={{fontSize: '0.6rem'}}>MAX_1GW</div>
                  </div>
                </div>

                {/* PUE ASSUMPTION → scenario_overrides.pue */}
                <div style={{marginTop: '2rem'}}>
                  <div className={styles.flexBetween}>
                    <div className={`${styles.lbl} ${styles.textWhite}`}>PUE ASSUMPTION</div>
                    <span className={`${styles.textMono} ${styles.textPrimary}`}>{pueAssumption.toFixed(2)}</span>
                  </div>
                  <input
                    type="range" min="1.0" max="2.0" step="0.01"
                    value={pueAssumption}
                    className={styles.slider}
                    onChange={(e) => setPueAssumption(Number(e.target.value))}
                  />
                  <div className={styles.flexBetween} style={{marginTop: '0.5rem'}}>
                    <div className={`${styles.lbl} ${styles.textMono}`} style={{fontSize: '0.6rem'}}>1.00</div>
                    <div className={`${styles.lbl} ${styles.textMono}`} style={{fontSize: '0.6rem'}}>2.00</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${styles.fadeEnterActive} ${styles.bracketBox}`}>
              <div className={styles.panelHeader}>
                <span className={styles.panelId}>RES-01</span>
                <div className={styles.lbl}>FINANCIAL OUTCOMES</div>
              </div>
              <div className={styles.rowNoPad}>
                {loading ? (
                  <div className={styles.textMuted}>Computing scenario...</div>
                ) : error ? (
                  <div className={styles.textDanger}>{error}</div>
                ) : (
                  <>
                    <div className={styles.resultWidget} style={{padding: '1.5rem 0'}}>
                      <div className={styles.resultLabel}>IRR (POST-TAX)</div>
                      <div className={`${styles.resultValue} ${styles.textPrimary} ${styles.textMono}`}>{fmtPctFromRatio(irr)}</div>
                      <div className={styles.resultSub}>Target: 15.0%</div>
                    </div>
                    <div className={styles.resultWidget} style={{padding: '1.5rem 0'}}>
                      <div className={styles.resultLabel}>NPV (POST-TAX)</div>
                      <div className={`${styles.resultValue} ${styles.textMono}`}>{fmtUSD(npv)}</div>
                    </div>
                    <div className={styles.resultWidget} style={{padding: '1.5rem 0'}}>
                      <div className={styles.resultLabel}>MOIC</div>
                      <div className={`${styles.resultValue} ${styles.textMono}`}>{moic != null ? fmtX(moic) : MISSING}</div>
                    </div>
                    <div className={styles.resultWidget} style={{padding: '1.5rem 0', borderBottom: (solver || derived?.mw != null) ? '1px solid var(--hl)' : 'none'}}>
                      <div className={styles.resultLabel}>TOTAL PROJECT CAPEX</div>
                      <div className={`${styles.resultValue} ${styles.textMono}`}>{capEx != null ? fmtUSD(capEx) : MISSING}</div>
                    </div>
                    {(solver || derived?.mw != null) && (
                      <div className={styles.resultWidget} style={{padding: '1.5rem 0', borderBottom: 'none'}}>
                        <div className={styles.resultLabel}>SOLVER</div>
                        {derived?.mw != null && (
                          <div className={styles.resultSub}>Solved MW: <span className={styles.textMono}>{numFmt(derived.mw, 1)}</span></div>
                        )}
                        {solver?.lever_value != null && (
                          <div className={styles.resultSub}>Lever value: <span className={styles.textMono}>{numFmt(solver.lever_value, 2)}</span></div>
                        )}
                        {solver?.achieved_irr != null && (
                          <div className={styles.resultSub}>Achieved IRR: <span className={styles.textMono}>{fmtPctFromRatio(solver.achieved_irr)}</span></div>
                        )}
                        {solver && (
                          <div className={styles.resultSub} style={{color: solver.converged ? 'var(--primary)' : 'var(--danger)'}}>
                            {solver.converged ? '✓ converged' : (solver.diagnostic || 'did not converge')}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: 3D DATACENTER & LAUNCH */}
        <div className={styles.col}>
          <div className={styles.rowStretch} style={{borderBottom: 'none', padding: 0}}>

            <div style={{padding: '1.5rem', borderBottom: `1px solid var(--hl)`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
              <div className={styles.lbl}>SITE TOPOLOGY</div>
              <div className={styles.lbl} style={{color: loading ? 'var(--fg-muted)' : 'var(--fg)'}}>
                <span className={loading ? styles.liveDotActive : styles.liveDot}></span>
                {loading ? 'ANALYZING' : 'TIER IV READY'}
              </div>
            </div>

            {/* 3D SVG DATACENTER */}
            <div className={`${styles.dcViz} ${loading ? styles.loading : ''}`}>
              <svg viewBox="0 0 400 300">
                <g transform="translate(200, 150)">
                  {/* Base platform */}
                  <polygon
                    points="0,-80 120,-20 0,40 -120,-20"
                    strokeWidth="1"
                    stroke="var(--accent-gold)"
                    fill="color-mix(in srgb, var(--accent-gold) 2%, transparent)"
                    className={styles.svgGlowStrong}
                  />
                  {/* Grid lines on platform */}
                  <line x1="-60" y1="-50" x2="60" y2="10" className={styles.dataFlow} strokeWidth="0.5" stroke="var(--fg-dim)"/>
                  <line x1="60" y1="-50" x2="-60" y2="10" className={styles.dataFlow} strokeWidth="0.5" stroke="var(--fg-dim)"/>

                  {/* Server Rack 1 */}
                  <g transform="translate(-40, -20)">
                    <polygon points="0,-40 30,-25 0,-10 -30,-25" stroke="var(--accent-gold)" strokeWidth="0.5" className={styles.svgGlowStrong} />
                    <polygon points="-30,-25 0,-10 0,30 -30,15" className={styles.svgGlow} />
                    <polygon points="0,-10 30,-25 30,15 0,30" className={styles.svgGlow} />
                    <line x1="-30" y1="-15" x2="0" y2="0" stroke="var(--accent-gold)" opacity="0.5" />
                    <line x1="-30" y1="-5" x2="0" y2="10" stroke="var(--accent-gold)" opacity="0.3" />
                    <line x1="-30" y1="5" x2="0" y2="20" stroke="var(--accent-gold)" opacity="0.1" />
                  </g>

                  {/* Server Rack 2 */}
                  <g transform="translate(40, 20)">
                    <polygon points="0,-40 30,-25 0,-10 -30,-25" stroke="var(--accent-gold)" strokeWidth="0.5" className={styles.svgGlowStrong} />
                    <polygon points="-30,-25 0,-10 0,30 -30,15" className={styles.svgGlow} />
                    <polygon points="0,-10 30,-25 30,15 0,30" className={styles.svgGlow} />
                    <line x1="-30" y1="-15" x2="0" y2="0" stroke="var(--accent-gold)" opacity="0.5" />
                    <line x1="-30" y1="-5" x2="0" y2="10" stroke="var(--accent-gold)" opacity="0.3" />
                    <line x1="-30" y1="5" x2="0" y2="20" stroke="var(--accent-gold)" opacity="0.1" />
                  </g>

                  {/* Floating Connection Node */}
                  <circle cx="0" cy="-110" r="3" fill="var(--accent-gold)" className={styles.pulseNode} />
                  <line x1="0" y1="-110" x2="0" y2="-70" stroke="var(--accent-gold)" strokeDasharray="2,2" strokeWidth="0.5" />
                </g>
              </svg>
            </div>

          </div>

          {/* LAUNCH BUTTON */}
          <div className={styles.row} style={{padding: '1.5rem'}}>
            {!isResultsMode ? (
              <button className={styles.btnLaunch} onClick={handleRunSimulation} disabled={loading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                COMPUTE SCENARIO
              </button>
            ) : (
              <>
                <button className={styles.btnReset} onClick={handleReset}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                  NEW SCENARIO
                </button>
                {result && !loading && (
                  <>
                    <button
                      className={styles.ctaMemo}
                      onClick={handleGenerateMemo}
                      disabled={memoGenerating}
                    >
                      {memoGenerating ? 'GENERATING…' : 'GENERATE MEMO'}
                    </button>
                    {memoError && (
                      <div className={styles.ctaMemoError}>{memoError}</div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.col}>
          {!isResultsMode ? (
            <div className={`${styles.fadeEnterActive} ${styles.bracketBox}`} style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
              <div className={styles.panelHeader}>
                <span className={styles.panelId}>STR-01</span>
                <div className={styles.lbl}>STRATEGIC UNDERWRITING</div>
              </div>

              <div className={styles.rowNoPad} style={{marginBottom: '2rem'}}>
                <div className={`${styles.lbl} ${styles.textWhite}`} style={{marginBottom: '1rem'}}>INVESTMENT THESIS (ARCHETYPE)</div>
                <div className={styles.selectorGrid}>
                  {ARCHETYPE_OPTIONS.map((a) => (
                    <div
                      key={a.id}
                      className={`${styles.mechanicalSwitch} ${archetype === a.id ? styles.mechanicalSwitchActive : ''}`}
                      onClick={() => setArchetype(a.id)}
                      title={a.label}
                    >
                      <div className={styles.switchLabel}>DEAL {a.code}</div>
                      <div className={styles.switchValue}>{a.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.rowNoPad} style={{marginBottom: '2rem'}}>
                <div className={`${styles.lbl} ${styles.textWhite}`}>BUSINESS MODEL</div>
                <select
                  className={styles.selectNative}
                  value={businessModel}
                  onChange={(e) => setBusinessModel(e.target.value)}
                >
                  {BUSINESS_MODEL_OPTIONS.map(b => (
                    <option key={b.id || 'auto'} value={b.id}>{b.label}</option>
                  ))}
                </select>

                <div className={`${styles.lbl} ${styles.textWhite}`} style={{marginTop: '1rem'}}>GEOGRAPHY</div>
                <select
                  className={styles.selectNative}
                  value={geography}
                  onChange={(e) => setGeography(e.target.value)}
                >
                  {GEOGRAPHY_OPTIONS.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.rowNoPad} style={{marginBottom: '2rem'}}>
                <div className={styles.flexBetween}>
                  <div className={`${styles.lbl} ${styles.textWhite}`}>GPU ECONOMICS</div>
                  <div className={`${styles.textMd} ${styles.textMono}`} style={{color: 'var(--accent-gold)'}}>${gpuHourPrice.toFixed(2)}/hr</div>
                </div>
                <div className={styles.lbl} style={{textTransform: 'uppercase', marginTop: '0.25rem', fontSize: '0.6rem', opacity: 0.6}}>MARKET_SPOT_RATE_2026</div>
                <div className={styles.sliderContainer} style={{marginTop: '1.25rem'}}>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={gpuHourPrice}
                    className={styles.slider}
                    onChange={(e) => setGpuHourPrice(Number(e.target.value))}
                  />
                  <div className={styles.flexBetween} style={{marginTop: '0.75rem'}}>
                    <div className={`${styles.lbl} ${styles.textMono}`} style={{fontSize: '0.6rem'}}>$1.00</div>
                    <div className={`${styles.lbl} ${styles.textMono}`} style={{fontSize: '0.6rem'}}>$5.00</div>
                  </div>
                </div>

                <div className={styles.flexBetween} style={{marginTop: '1rem'}}>
                  <div className={`${styles.lbl} ${styles.textWhite}`}>UTILIZATION</div>
                  <span className={styles.textMono}>{utilizationPct}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="5"
                  value={utilizationPct}
                  className={styles.slider}
                  onChange={(e) => setUtilizationPct(Number(e.target.value))}
                />
              </div>

              {aiMix > 0 && (
                <div className={styles.rowNoPad} style={{marginBottom: '2rem'}}>
                  <div className={`${styles.lbl} ${styles.textWhite}`} style={{marginBottom: '1rem'}}>GPU PROFILE (NVIDIA)</div>
                  <div className={styles.selectorGrid}>
                    {GPU_SKU_PRESETS.map((g) => (
                      <div
                        key={g.id}
                        className={`${styles.mechanicalSwitch} ${gpuSku === g.id ? styles.mechanicalSwitchActive : ''}`}
                        onClick={() => setGpuSku(g.id)}
                      >
                        <div className={styles.switchLabel}>NVIDIA_CORE</div>
                        <div className={styles.switchValue}>{g.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className={`${styles.lbl} ${styles.textWhite}`} style={{marginTop: '1rem'}}>NUM RACKS (OPTIONAL)</div>
                  <input
                    type="number" min="0" step="1"
                    className={styles.numInput}
                    style={{marginTop: '0.5rem'}}
                    placeholder="auto from MW"
                    value={numRacks}
                    onChange={(e) => setNumRacks(e.target.value)}
                  />
                </div>
              )}

              <div className={styles.rowNoPad} style={{background: 'var(--surface)', marginTop: 'auto', borderTop: '1px solid var(--accent-gold)', padding: '1.5rem 0'}}>
                <div className={styles.lbl}>EST. HARDWARE CAPEX</div>
                <div className={`${styles.textHuge} ${styles.textWhite} ${styles.textMono}`} style={{marginTop: '0.75rem', color: 'var(--accent-gold)'}}>
                  {fmtUSD(scale * 1_000_000 * (1 + aiMix/100 * 2))}
                </div>
                <div className={styles.lbl} style={{marginTop: '0.5rem', textTransform: 'uppercase', fontSize: '0.6rem', opacity: 0.6}}>
                  INDICATIVE_PROJECT_ENVELOPE
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.fadeEnterActive} style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
              <div className={styles.rowNoPad} style={{flex: 1}}>
                {!loading && result?.waterfall?.summary && (
                  <div style={{padding: '1.5rem', borderBottom: '1px solid var(--hl)'}}>
                    <div className={styles.lbl} style={{marginBottom: '1rem', color: 'var(--fg)'}}>CAPITAL STRUCTURE</div>
                    <div className={styles.flexBetween} style={{marginBottom: '0.5rem'}}>
                      <div className={styles.textSm}>Total Equity</div>
                      <div className={`${styles.textSm} ${styles.textMono}`}>{fmtUSD(result.waterfall.summary.total_equity)}</div>
                    </div>
                    <div className={styles.flexBetween} style={{marginBottom: '0.5rem'}}>
                      <div className={styles.textSm}>Total Debt</div>
                      <div className={`${styles.textSm} ${styles.textMono}`}>{fmtUSD(result.waterfall.summary.total_debt)}</div>
                    </div>
                    <div className={styles.flexBetween}>
                      <div className={styles.textSm}>Terminal Value</div>
                      <div className={`${styles.textSm} ${styles.textMono}`}>{fmtUSD(result.waterfall.summary.terminal_value)}</div>
                    </div>
                  </div>
                )}

                <div style={{padding: '1.5rem', borderBottom: '1px solid var(--hl)'}}>
                  <div className={styles.lbl} style={{marginBottom: '1rem', color: 'var(--fg)'}}>OPERATING METRICS</div>
                  <div className={styles.flexBetween} style={{marginBottom: '0.5rem'}}>
                    <div className={styles.textSm}>Stabilized EBITDA</div>
                    <div className={`${styles.textSm} ${styles.textMono}`}>{fmtUSD(ebitda)}</div>
                  </div>
                  <div className={styles.flexBetween}>
                    <div className={styles.textSm}>Min DSCR</div>
                    <div className={`${styles.textSm} ${styles.textMono}`}>{dscr != null ? `${Number(dscr).toFixed(2)}×` : MISSING}</div>
                  </div>
                </div>

                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.lbl} colSpan="3" style={{paddingTop: '1.5rem', color: 'var(--fg)'}}>HARDWARE PROFILE</th>
                    </tr>
                    <tr>
                      <th className={styles.lbl}>HARDWARE</th>
                      <th className={`${styles.lbl} ${styles.textRight}`}>QTY</th>
                      <th className={`${styles.lbl} ${styles.textRight}`}>CAPEX EST.</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {!loading && hw ? renderHardwareRows() : (
                      <tr className={styles.tableRow}>
                        <td colSpan="3" className={`${styles.textSm} ${styles.textMuted}`}>Loading...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.row} style={{background: 'var(--surface)', marginTop: 'auto'}}>
                <div className={styles.lbl}>IS IT INVESTABLE?</div>
                <div className={`${styles.textLg} ${styles.textPrimary} ${styles.textMono}`} style={{marginTop: '0.75rem'}}>
                  {loading ? MISSING : (irr >= 0.15 ? 'YES — MEETS HURDLE' : 'NO — BELOW HURDLE')}
                </div>
                <div className={styles.lbl} style={{marginTop: '0.5rem', textTransform: 'uppercase', fontSize: '0.65rem'}}>
                  Based on 15% target IRR
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADVANCED MODEL OVERRIDES DRAWER — input mode only */}
      {!isResultsMode && (
        <div className={styles.drawer}>
          <button className={styles.drawerToggle} onClick={() => setShowAdvanced(v => !v)}>
            <span className={styles.lbl}>
              ADVANCED MODEL OVERRIDES
              {overrideCount > 0 && <span className={styles.selectedBadge} style={{marginLeft: '0.75rem'}}>{overrideCount} SET</span>}
            </span>
            <span className={styles.drawerChevron}>{showAdvanced ? '▼ HIDE' : '▲ EXPAND'}</span>
          </button>
          {showAdvanced && (
            <div className={styles.drawerBody}>
              <div className={styles.drawerActions}>
                <button className={styles.drawerClear} onClick={clearOverrides} disabled={overrideCount === 0}>RESET ALL</button>
                <span className={styles.drawerHint}>Blank = inherit resolved {geography.toUpperCase()} default. Placeholder shows last run&rsquo;s value.</span>
              </div>
              <div className={styles.overrideGroups}>
                {OVERRIDE_GROUPS.map(group => (
                  <div key={group.id} className={styles.overrideGroup}>
                    <div className={styles.groupTitle}>{group.title}</div>
                    {group.fields.map(f => {
                      const val = overrides[f.key] ?? '';
                      const dirty = val !== '' && val != null;
                      return (
                        <div key={f.key} className={styles.overrideField}>
                          <label className={styles.overrideFieldLabel}>
                            {f.label}
                            {f.unit && <span className={styles.overrideFieldUnit}>{f.unit}</span>}
                          </label>
                          <input
                            type="number"
                            step={f.step}
                            className={`${styles.overrideInput} ${dirty ? styles.overrideInputDirty : ''}`}
                            placeholder={placeholderFor(resolvedScenario, f.key)}
                            value={val}
                            onChange={(e) => setOverride(f.key, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Commercial — operator strategy (enum) */}
                <div className={styles.overrideGroup}>
                  <div className={styles.groupTitle}>Commercial</div>
                  <div className={styles.overrideField} style={{gridTemplateColumns: '1fr'}}>
                    <label className={styles.overrideFieldLabel}>Operator Strategy</label>
                    <select
                      className={styles.selectNative}
                      style={{marginTop: '0.25rem'}}
                      value={operatorStrategy}
                      onChange={(e) => setOperatorStrategy(e.target.value)}
                    >
                      {OPERATOR_STRATEGY_OPTIONS.map(o => (
                        <option key={o.id || 'default'} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
