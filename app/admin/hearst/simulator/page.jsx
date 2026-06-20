'use client';

import { useState, useRef } from 'react';
import styles from './simulator.module.css';
import {
  fmtUSD,
  fmtPctFromRatio,
  fmtX,
  MISSING,
  parseApiError,
} from '../utils/format';
import {
  ARCHETYPES,
  GPU_SKU_PRESETS,
  DEFAULT_GPU_HOUR_PRICE,
  DEFAULT_GPU_UTIL_PCT,
} from '../utils/constants';

// ── Labels ────────────────────────────────────────────────────────────────────
const THESIS_META = {
  shell:   { label: 'Shell + Long Lease',   short: 'Shell' },
  compute: { label: 'Compute Cloud',         short: 'Compute' },
  gov:     { label: 'Sovereign AI Cluster',  short: 'Sovereign' },
};

const GEOGRAPHIES = [
  { id: 'qatar', label: 'QATAR (QA-01)' },
  { id: 'uae',   label: 'UAE (AE-02)' },
  { id: 'ksa',   label: 'KSA (SA-01)' },
  { id: 'gcc',   label: 'GCC (GC-00)' },
];

function buildPayload({ thesis, scale, aiMix, geography, gpuSku, gpuHourPrice }) {
  const archetype_id = ARCHETYPES[thesis] ?? ARCHETYPES.compute;
  const hardware_mix = aiMix > 0
    ? { ai_pct: aiMix, gpu_sku_id: gpuSku, gpu_hour_price: gpuHourPrice, utilization_pct: DEFAULT_GPU_UTIL_PCT }
    : { ai_pct: aiMix };

  return {
    input_mode: 'mw_first',
    input_value: { total_mw: scale },
    archetype_id,
    hardware_mix,
    geography,
  };
}

function numFmt(n, digits = 0) {
  if (n == null || Number.isNaN(n)) return MISSING;
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: digits });
}

export default function SimulatorPage() {
  // ── Inputs ──────────────────────────────────────────────────────────────────
  const [thesis, setThesis]           = useState('compute');
  const [scale, setScale]             = useState(150);
  const [aiMix, setAiMix]             = useState(50);
  const [gpuSku, setGpuSku]           = useState('h100');
  const [gpuHourPrice] = useState(DEFAULT_GPU_HOUR_PRICE);
  const [geography, setGeography]     = useState('qatar');
  
  // ── UI State ─────────────────────────────────────────────────────────────────
  const [isResultsMode, setIsResultsMode] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [result, setResult]     = useState(null);

  const abortRef = useRef(null);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleRunSimulation = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setIsResultsMode(true); // Switch to results mode immediately for loading state

    try {
      const payload = buildPayload({ thesis, scale, aiMix, geography, gpuSku, gpuHourPrice });
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
      setResult(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsResultsMode(false);
    setResult(null);
    setError(null);
  };

  // ── Derived display values ────────────────────────────────────────────────
  const proj    = result?.projection ?? {};
  const hw      = result?.hardware_breakdown ?? null;

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
        <td className={`${styles.textSm} ${styles.textRight}`}>{r.qty}</td>
        <td className={`${styles.textSm} ${styles.textRight}`}>{fmtUSD(r.capex)}</td>
      </tr>
    ));
  };

  return (
    <div className={styles.container}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <div className={styles.item}><span className={`${styles.lbl} ${styles.textWhite}`} style={{letterSpacing: '0.2em', fontWeight: 700}}>FUTUR ONE</span></div>
        <div className={styles.item}><span className={`${styles.lbl} ${styles.textMuted}`}>PROJECTION COCKPIT</span></div>
        <div className={styles.item}>
          <span className={styles.lbl}>
            <span className={loading ? styles.liveDotActive : styles.liveDot}></span>
            {loading ? 'COMPUTING...' : isResultsMode ? 'EVIDENCE-LINKED MODEL' : 'BASE SCENARIO'}
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
            <div className={styles.fadeEnterActive}>
              <div className={styles.row}>
                <div className={styles.lbl} style={{marginBottom: '2rem'}}>INFRASTRUCTURE & POWER</div>
                
                <div className={`${styles.lbl} ${styles.textWhite}`} style={{marginBottom: '0.5rem'}}>SITE LOCATION</div>
                {GEOGRAPHIES.map((g) => (
                  <div 
                    key={g.id} 
                    className={geography === g.id ? styles.selectorItemActive : styles.selectorItem}
                    onClick={() => setGeography(g.id)}
                  >
                    <div className={styles.textSm}>{g.label}</div>
                    <div className={styles.lbl}>{geography === g.id ? 'SELECTED' : ''}</div>
                  </div>
                ))}
              </div>
              
              <div className={styles.rowStretch}>
                <div className={styles.flexBetween}>
                  <div className={`${styles.lbl} ${styles.textWhite}`}>TARGET CAPACITY</div>
                  <div className={`${styles.textLg} ${styles.textWhite}`}>{scale} MW</div>
                </div>
                <div className={styles.lbl} style={{textTransform: 'none', marginTop: '0.25rem'}}>Phase I / scalable campus</div>
                
                <div className={styles.sliderContainer}>
                  <input 
                    type="range" 
                    min="10" 
                    max="1000" 
                    step="10"
                    value={scale} 
                    className={styles.slider}
                    onChange={(e) => setScale(Number(e.target.value))}
                  />
                  <div className={styles.flexBetween} style={{marginTop: '0.75rem'}}>
                    <div className={styles.lbl}>10 MW</div>
                    <div className={styles.lbl}>1 GW</div>
                  </div>
                </div>
                
                <div className={styles.flexBetween} style={{marginTop: '3rem'}}>
                  <div className={styles.lbl}>EST. PUE</div>
                  <div className={styles.textMd}>1.12</div>
                </div>
                <div className={styles.flexBetween} style={{marginTop: '1.5rem'}}>
                  <div className={styles.lbl}>GRID CONNECTION</div>
                  <div className={styles.textMd}>2027 Q3</div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.fadeEnterActive}>
              <div className={styles.row}>
                <div className={styles.lbl} style={{marginBottom: '2rem'}}>FINANCIAL OUTCOMES</div>
                {loading ? (
                  <div className={styles.textMuted}>Computing scenario...</div>
                ) : error ? (
                  <div className={styles.textDanger}>{error}</div>
                ) : (
                  <>
                    <div className={styles.resultWidget}>
                      <div className={styles.resultLabel}>IRR (POST-TAX)</div>
                      <div className={`${styles.resultValue} ${styles.textPrimary}`}>{fmtPctFromRatio(irr)}</div>
                      <div className={styles.resultSub}>Target: 15.0%</div>
                    </div>
                    <div className={styles.resultWidget}>
                      <div className={styles.resultLabel}>NPV (POST-TAX)</div>
                      <div className={styles.resultValue}>{fmtUSD(npv)}</div>
                    </div>
                    <div className={styles.resultWidget}>
                      <div className={styles.resultLabel}>MOIC</div>
                      <div className={styles.resultValue}>{moic != null ? fmtX(moic) : MISSING}</div>
                    </div>
                    <div className={styles.resultWidget}>
                      <div className={styles.resultLabel}>TOTAL PROJECT CAPEX</div>
                      <div className={styles.resultValue}>{capEx != null ? fmtUSD(capEx) : MISSING}</div>
                    </div>
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
                  <polygon points="0,-80 120,-20 0,40 -120,-20" strokeWidth="0.5" stroke="var(--fg-dim)" className={styles.svgGlowStrong} />
                  {/* Grid lines on platform */}
                  <line x1="-60" y1="-50" x2="60" y2="10" strokeDasharray="4,4" strokeWidth="0.5" stroke="var(--fg-dim)"/>
                  <line x1="60" y1="-50" x2="-60" y2="10" strokeDasharray="4,4" strokeWidth="0.5" stroke="var(--fg-dim)"/>

                  {/* Server Rack 1 */}
                  <g transform="translate(-40, -20)">
                    <polygon points="0,-40 30,-25 0,-10 -30,-25" className={styles.svgGlowStrong} />
                    <polygon points="-30,-25 0,-10 0,30 -30,15" className={styles.svgGlow} />
                    <polygon points="0,-10 30,-25 30,15 0,30" className={styles.svgGlow} />
                    <line x1="-30" y1="-15" x2="0" y2="0" />
                    <line x1="-30" y1="-5" x2="0" y2="10" />
                    <line x1="-30" y1="5" x2="0" y2="20" />
                    <line x1="0" y1="0" x2="30" y2="-15" />
                    <line x1="0" y1="10" x2="30" y2="-5" />
                    <line x1="0" y1="20" x2="30" y2="5" />
                  </g>

                  {/* Server Rack 2 */}
                  <g transform="translate(40, 20)">
                    <polygon points="0,-40 30,-25 0,-10 -30,-25" className={styles.svgGlowStrong} />
                    <polygon points="-30,-25 0,-10 0,30 -30,15" className={styles.svgGlow} />
                    <polygon points="0,-10 30,-25 30,15 0,30" className={styles.svgGlow} />
                    <line x1="-30" y1="-15" x2="0" y2="0" />
                    <line x1="-30" y1="-5" x2="0" y2="10" />
                    <line x1="-30" y1="5" x2="0" y2="20" />
                    <line x1="0" y1="0" x2="30" y2="-15" />
                    <line x1="0" y1="10" x2="30" y2="-5" />
                    <line x1="0" y1="20" x2="30" y2="5" />
                  </g>
                  
                  {/* Floating Connection Node */}
                  <circle cx="0" cy="-110" r="3" fill="var(--fg-dim)" stroke="none" />
                  <line x1="0" y1="-110" x2="0" y2="-70" stroke="var(--fg-dim)" strokeDasharray="2,2" strokeWidth="0.5" />
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
              <button className={styles.btnReset} onClick={handleReset}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                NEW SCENARIO
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.col}>
          {!isResultsMode ? (
            <div className={styles.fadeEnterActive} style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
              <div className={styles.row}>
                <div className={`${styles.lbl} ${styles.textWhite}`} style={{marginBottom: '1rem'}}>INVESTMENT THESIS</div>
                {Object.entries(THESIS_META).map(([key, meta]) => (
                  <div 
                    key={key} 
                    className={thesis === key ? styles.selectorItemActive : styles.selectorItem}
                    onClick={() => setThesis(key)}
                  >
                    <div className={styles.textSm}>{meta.label}</div>
                    <div className={styles.lbl}>{thesis === key ? 'SELECTED' : ''}</div>
                  </div>
                ))}
              </div>

              <div className={styles.row}>
                <div className={styles.flexBetween}>
                  <div className={`${styles.lbl} ${styles.textWhite}`}>AI INFRASTRUCTURE MIX</div>
                  <div className={`${styles.textLg} ${styles.textWhite}`}>{aiMix}%</div>
                </div>
                <div className={styles.lbl} style={{textTransform: 'none', marginTop: '0.25rem'}}>AI load share — impacts capex, cooling, power density</div>
                <div className={styles.sliderContainer}>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="10"
                    value={aiMix} 
                    className={styles.slider}
                    onChange={(e) => setAiMix(Number(e.target.value))}
                  />
                  <div className={styles.flexBetween} style={{marginTop: '0.75rem'}}>
                    <div className={styles.lbl}>0%</div>
                    <div className={styles.lbl}>100%</div>
                  </div>
                </div>
              </div>

              {aiMix > 0 && (
                <div className={styles.row}>
                  <div className={`${styles.lbl} ${styles.textWhite}`} style={{marginBottom: '1rem'}}>GPU PROFILE</div>
                  {GPU_SKU_PRESETS.map((g) => (
                    <div 
                      key={g.id} 
                      className={gpuSku === g.id ? styles.selectorItemActive : styles.selectorItem}
                      onClick={() => setGpuSku(g.id)}
                    >
                      <div className={styles.textSm}>{g.label}</div>
                      <div className={styles.lbl}>{gpuSku === g.id ? 'SELECTED' : ''}</div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className={styles.row} style={{background: 'var(--surface)', marginTop: 'auto'}}>
                <div className={styles.lbl}>EST. HARDWARE CAPEX</div>
                <div className={`${styles.textHuge} ${styles.textWhite}`} style={{marginTop: '0.75rem'}}>
                  {/* Rough client-side estimate for input mode */}
                  {fmtUSD(scale * 1_000_000 * (1 + aiMix/100 * 2))}
                </div>
                <div className={`${styles.lbl} ${styles.textMuted}`} style={{marginTop: '0.5rem', textTransform: 'none'}}>
                  Total project envelope - indicative
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
                      <div className={styles.textSm}>{fmtUSD(result.waterfall.summary.total_equity)}</div>
                    </div>
                    <div className={styles.flexBetween} style={{marginBottom: '0.5rem'}}>
                      <div className={styles.textSm}>Total Debt</div>
                      <div className={styles.textSm}>{fmtUSD(result.waterfall.summary.total_debt)}</div>
                    </div>
                    <div className={styles.flexBetween}>
                      <div className={styles.textSm}>Terminal Value</div>
                      <div className={styles.textSm}>{fmtUSD(result.waterfall.summary.terminal_value)}</div>
                    </div>
                  </div>
                )}

                <div style={{padding: '1.5rem', borderBottom: '1px solid var(--hl)'}}>
                  <div className={styles.lbl} style={{marginBottom: '1rem', color: 'var(--fg)'}}>OPERATING METRICS</div>
                  <div className={styles.flexBetween} style={{marginBottom: '0.5rem'}}>
                    <div className={styles.textSm}>Stabilized EBITDA</div>
                    <div className={styles.textSm}>{fmtUSD(ebitda)}</div>
                  </div>
                  <div className={styles.flexBetween}>
                    <div className={styles.textSm}>Min DSCR</div>
                    <div className={styles.textSm}>{dscr != null ? `${Number(dscr).toFixed(2)}×` : MISSING}</div>
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
                <div className={`${styles.textLg} ${styles.textPrimary}`} style={{marginTop: '0.75rem'}}>
                  {loading ? MISSING : (irr >= 15 ? 'YES — MEETS HURDLE' : 'NO — BELOW HURDLE')}
                </div>
                <div className={`${styles.lbl} ${styles.textMuted}`} style={{marginTop: '0.5rem', textTransform: 'none'}}>
                  Based on 15% target IRR
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
