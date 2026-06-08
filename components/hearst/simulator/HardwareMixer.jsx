'use client';

import { useState } from 'react';
import { GPU_CATALOG, calcRackPower, calcGpuCapex, calcGpuAnnualRevenue, REFERENCE_GPU_HOUR_PRICES } from '@/lib/hearst-gpu-catalog';
import { Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

// 3 ready-to-use hardware profiles. Click one to load the full mix; open
// Advanced to fine-tune every dial by hand.
const HARDWARE_PRESETS = [
  {
    id: 'colo',
    name: 'Classic Colocation',
    tagline: 'Mostly standard racks, little AI',
    patch: { classic_pct: 80, liquid_pct: 15, ai_pct: 5, gpu_sku_id: 'h200_sxm5', utilization_pct: 70, gpu_hour_price: 3 },
  },
  {
    id: 'mixed',
    name: 'Mixed AI-Ready',
    tagline: 'Balanced colo + AI capacity',
    patch: { classic_pct: 40, liquid_pct: 35, ai_pct: 25, gpu_sku_id: 'gb200_nvl72', utilization_pct: 75, gpu_hour_price: 5 },
  },
  {
    id: 'ai_factory',
    name: 'AI Factory',
    tagline: 'GPU-dense, liquid-cooled',
    patch: { classic_pct: 10, liquid_pct: 20, ai_pct: 70, gpu_sku_id: 'gb200_nvl72', utilization_pct: 85, gpu_hour_price: 6 },
  },
];

function matchPreset(v) {
  const p = HARDWARE_PRESETS.find(p =>
    p.patch.classic_pct === v.classic_pct &&
    p.patch.liquid_pct === v.liquid_pct &&
    p.patch.ai_pct === v.ai_pct,
  );
  return p?.id || null;
}

function redistribute(prev, changedKey, newValue) {
  const others = Object.keys(prev).filter(k => k !== changedKey);
  const remaining = Math.max(0, 100 - newValue);
  const otherSum = others.reduce((s, k) => s + (prev[k] || 0), 0);
  const next = { ...prev, [changedKey]: newValue };
  if (otherSum > 0) {
    others.forEach(k => {
      next[k] = Math.round((prev[k] / otherSum) * remaining);
    });
  } else {
    const split = Math.round(remaining / others.length);
    others.forEach(k => { next[k] = split; });
  }
  const sum = Object.values(next).reduce((s, v) => s + v, 0);
  const diff = 100 - sum;
  if (diff !== 0 && others.length > 0) {
    next[others[0]] = (next[others[0]] || 0) + diff;
  }
  return next;
}

const TIER_LABELS = {
  classic_pct: { name: 'Standard',     meta: 'low power · ≤15 kW/rack' },
  liquid_pct:  { name: 'High-density', meta: 'medium power · ≤60 kW/rack' },
  ai_pct:      { name: 'AI clusters',  meta: 'very high power · ≥70 kW/rack' },
};

export default function HardwareMixer({ totalMw = 50, value, onChange }) {
  const v = value || { classic_pct: 60, liquid_pct: 25, ai_pct: 15, gpu_sku_id: 'gb200_nvl72', num_racks: null, utilization_pct: 75, gpu_hour_price: 5 };

  const mw_ai = totalMw * (v.ai_pct / 100);
  const gpu = GPU_CATALOG.find(g => g.id === v.gpu_sku_id) || GPU_CATALOG[0];
  const rack_kw = calcRackPower(gpu);
  const derived_racks = rack_kw > 0 ? Math.floor((mw_ai * 1000) / rack_kw) : 0;
  const racks_used = v.num_racks != null && v.num_racks > 0 ? v.num_racks : derived_racks;
  const total_gpus = racks_used * gpu.density_per_rack;
  const capex_hw = calcGpuCapex(racks_used, gpu);
  const revenue_ai = calcGpuAnnualRevenue(racks_used, gpu, v.utilization_pct, v.gpu_hour_price);

  const [advanced, setAdvanced] = useState(false);
  const activePreset = matchPreset(v);

  function setTier(key, val) {
    const next = redistribute(
      { classic_pct: v.classic_pct, liquid_pct: v.liquid_pct, ai_pct: v.ai_pct },
      key, Math.max(0, Math.min(100, val)),
    );
    onChange?.({ ...v, ...next });
  }

  function applyPreset(p) {
    onChange?.({ ...v, ...p.patch });
  }

  return (
    <div style={S.wrap}>
      <style>{`
        @media (max-width: 1500px) {
          [data-hardware-advanced-grid] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 1100px) {
          [data-hardware-stack] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div data-hardware-stack style={S.stackGrid}>
        <Card variant="flat" style={S.visualPanel} padding="md">
          <div style={S.visualHead}>
            <div>
              <span style={S.visualKicker}>GPU / rack topology</span>
              <h3 style={S.visualTitle}>{gpu.sku} deployment map</h3>
            </div>
            <div style={S.aiBadge}>{v.ai_pct}% AI</div>
          </div>
          <HardwareTopology
            classicPct={v.classic_pct}
            liquidPct={v.liquid_pct}
            racks={racks_used}
            totalMw={totalMw}
            aiMw={mw_ai}
          />
          <MixBar classicPct={v.classic_pct} liquidPct={v.liquid_pct} aiPct={v.ai_pct} />
        </Card>

        <div style={S.controlPanel}>
          <div style={S.presetGrid}>
            {HARDWARE_PRESETS.map(p => {
              const sel = activePreset === p.id;
              return (
                <Card
                  as="button"
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  padding="md"
                  hover
                  accent={sel}
                  surface={2}
                  style={{ ...S.presetCard, ...(sel ? S.presetCardSel : {}) }}>
                  <div style={S.presetMix}>
                    <span style={S.presetMixSeg}>{p.patch.classic_pct}</span>
                    <span style={S.presetMixDiv}>/</span>
                    <span style={S.presetMixSeg}>{p.patch.liquid_pct}</span>
                    <span style={S.presetMixDiv}>/</span>
                    <span style={{ ...S.presetMixSeg, ...S.presetMixAi }}>{p.patch.ai_pct}</span>
                  </div>
                  <div style={S.presetName}>{p.name}</div>
                  <div style={S.presetTagline}>{p.tagline}</div>
                </Card>
              );
            })}
          </div>

          <div data-hardware-summary style={S.summary}>
            <SumKpi label="AI chips" value={total_gpus.toLocaleString('en-US')} />
            <SumKpi label="Racks" value={racks_used.toLocaleString('en-US')} />
            <SumKpi label="Equipment cost" value={`$${(capex_hw / 1e6).toFixed(1)}M`} />
            <SumKpi label="AI revenue / yr" value={`$${(revenue_ai / 1e6).toFixed(1)}M`} accent />
          </div>

          <button type="button" onClick={() => setAdvanced(a => !a)} style={S.advancedToggle}>
            {advanced ? 'Hide advanced controls' : 'Tune GPU and power assumptions'}
          </button>
        </div>
      </div>

      {advanced && (
        <div data-hardware-advanced-grid style={S.grid}>
          <div style={S.col}>
            <div style={S.colTitle}>Power density per rack <span style={S.colTitleMeta}>(total 100%)</span></div>
            <div style={S.sliders}>
              {['classic_pct', 'liquid_pct', 'ai_pct'].map(key => (
                <div key={key} style={S.sliderRow}>
                  <div style={S.sliderHead}>
                    <span style={S.sliderName}>{TIER_LABELS[key].name}</span>
                    <span style={S.sliderMeta}>{TIER_LABELS[key].meta}</span>
                  </div>
                  <div style={S.sliderControl}>
                    <input
                      type="range" min={0} max={100} step={1}
                      value={v[key]}
                      aria-label={`${TIER_LABELS[key].name} allocation percentage`}
                      aria-valuetext={`${v[key]} percent, ${(totalMw * v[key] / 100).toFixed(1)} megawatts`}
                      onChange={e => setTier(key, Number(e.target.value))}
                      style={S.range}
                    />
                    <span style={S.pct}>{v[key]}%</span>
                    <span style={S.mw}>{(totalMw * v[key] / 100).toFixed(1)} MW</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {v.ai_pct > 0 && (
            <div style={S.col}>
              <div style={S.colTitle}>
                AI chip <span style={S.colTitleMeta}>({mw_ai.toFixed(1)} MW dedicated)</span>
              </div>
              <div data-hardware-gpu-grid style={S.gpuCards}>
                {GPU_CATALOG.map(g => {
                  const sel = v.gpu_sku_id === g.id;
                  return (
                    <Card
                      as="button"
                      key={g.id}
                      type="button"
                      onClick={() => onChange?.({ ...v, gpu_sku_id: g.id, gpu_hour_price: REFERENCE_GPU_HOUR_PRICES[g.id] || v.gpu_hour_price })}
                      padding="sm"
                      hover
                      accent={sel}
                      surface={2}
                      style={{ ...S.gpuCard, ...(sel ? S.gpuCardSel : {}) }}>
                      <div style={S.gpuSku}>{g.sku}</div>
                      <div style={S.gpuMeta}>
                        {g.vendor} · {g.rack_scale ? `${(g.tdp_w / 1000000).toFixed(1)} MW/rack` : `${g.tdp_w}W`} · {g.hbm_gb}GB
                      </div>
                      <div style={S.gpuPrice}>
                        ${g.rack_scale ? `${(g.msrp_usd / 1000000).toFixed(1)}M/rack` : `${(g.msrp_usd / 1000).toFixed(0)}k/GPU`}
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div style={S.aiControls}>
                <label style={S.ctrlBlock}>
                  <span style={S.ctrlLabel}>Utilization</span>
                  <input type="range" min={40} max={95} step={1} value={v.utilization_pct}
                    aria-label={UI.HW_GPU_UTIL_ARIA}
                    aria-valuetext={`${v.utilization_pct} percent utilization`}
                    onChange={e => onChange?.({ ...v, utilization_pct: Number(e.target.value) })} style={S.range} />
                  <span style={S.ctrlValue}>{v.utilization_pct}%</span>
                </label>
                <label style={S.ctrlBlock}>
                  <span style={S.ctrlLabel}>$/hr</span>
                  <input type="number" step={0.10} min={0} max={20} value={v.gpu_hour_price}
                    onChange={e => onChange?.({ ...v, gpu_hour_price: Number(e.target.value) })} style={S.numInput} />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HardwareTopology({ classicPct, liquidPct, racks, totalMw, aiMw }) {
  const rackCount = 18;
  const classicCount = Math.round(rackCount * classicPct / 100);
  const liquidCount = Math.round(rackCount * liquidPct / 100);
  return (
    <svg viewBox="0 0 760 300" role="img" aria-label={UI.HW_TOPOLOGY_ARIA} style={S.topology}>
      <defs>
        <linearGradient id="rackGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--cp-accent-maroon)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--cp-accent)" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--cp-accent-maroon)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--cp-accent-maroon)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="758" height="298" rx="24" fill="var(--cp-surface-0)" stroke="var(--cp-border)" />
      <circle cx="580" cy="92" r="118" fill="url(#coreGlow)" />
      <path d="M70 228 C190 112 285 238 390 118 S590 66 690 150" fill="none" stroke="var(--cp-border)" strokeWidth="1.2" strokeDasharray="6 8" />
      {Array.from({ length: rackCount }).map((_, i) => {
        const col = i % 9;
        const row = Math.floor(i / 9);
        const x = 58 + col * 58;
        const y = 78 + row * 86;
        const fill = i < classicCount
          ? 'var(--cp-text-muted)'
          : i < classicCount + liquidCount
            ? 'var(--cp-accent)'
            : 'url(#rackGlow)';
        return (
          <g key={i}>
            <rect x={x} y={y} width="36" height="64" rx="8" fill={fill} opacity={i < classicCount ? 0.34 : 0.82} />
            <rect x={x + 8} y={y + 10} width="20" height="4" rx="2" fill="var(--cp-text-strong)" opacity="0.48" />
            <rect x={x + 8} y={y + 24} width="20" height="4" rx="2" fill="var(--cp-text-strong)" opacity="0.34" />
            <rect x={x + 8} y={y + 38} width="20" height="4" rx="2" fill="var(--cp-text-strong)" opacity="0.26" />
          </g>
        );
      })}
      <g>
        <rect x="562" y="172" width="132" height="74" rx="16" fill="var(--cp-surface-2)" stroke="var(--cp-border)" />
        <text x="580" y="198" fill="var(--cp-text-muted)" fontSize="12" fontWeight="var(--cp-weight-black)" letterSpacing="var(--cp-tracking-wider)">AI FABRIC</text>
        <text x="580" y="224" fill="var(--cp-text-primary)" fontSize="26" fontWeight="var(--cp-weight-black)">{aiMw.toFixed(1)} MW</text>
      </g>
      <text x="58" y="48" fill="var(--cp-text-muted)" fontSize="12" fontWeight="var(--cp-weight-black)" letterSpacing="var(--cp-tracking-wider)">POWER HALL</text>
      <text x="590" y="48" fill="var(--cp-text-primary)" fontSize="18" fontWeight="var(--cp-weight-black)">{totalMw} MW</text>
      <text x="590" y="70" fill="var(--cp-text-muted)" fontSize="12">{racks.toLocaleString('en-US')} GPU racks implied</text>
    </svg>
  );
}

function MixBar({ classicPct, liquidPct, aiPct }) {
  return (
    <div style={S.mixWrap}>
      <div style={S.mixBar}>
        <span style={{ ...S.mixSegStandard, width: `${classicPct}%` }} />
        <span style={{ ...S.mixSegDense, width: `${liquidPct}%` }} />
        <span style={{ ...S.mixSegAi, width: `${aiPct}%` }} />
      </div>
      <div style={S.mixLegend}>
        <span>Standard {classicPct}%</span>
        <span>Dense {liquidPct}%</span>
        <span>AI {aiPct}%</span>
      </div>
    </div>
  );
}

function SumKpi({ label, value, accent }) {
  return (
    <Card variant="flat" style={S.sumCard} padding="sm" surface={2}>
      <div style={S.sumLabel}>{label}</div>
      <div style={{ ...S.sumValue, color: accent ? 'var(--cp-accent-maroon)' : 'var(--cp-text-primary)' }}>{value}</div>
    </Card>
  );
}

const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-5)',
  },
  stackGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.75fr)',
    gap: 'var(--cp-space-5)',
    alignItems: 'stretch',
  },
  visualPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    minWidth: 0,
  },
  visualHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    alignItems: 'flex-start',
  },
  visualKicker: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
  visualTitle: {
    margin: 'var(--cp-space-1) 0 0',
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-2xl)',
    lineHeight: 1.1,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  aiBadge: {
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    color: 'var(--cp-text-strong)',
    background: 'var(--cp-accent-maroon)',
    borderRadius: 'var(--cp-radius-pill)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    whiteSpace: 'nowrap',
  },
  topology: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  mixWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  mixBar: {
    height: 'calc(var(--cp-space-3) + var(--cp-space-1) / 2)',
    display: 'flex',
    overflow: 'hidden',
    borderRadius: 'var(--cp-radius-pill)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
  },
  mixSegStandard: { display: 'block', background: 'var(--cp-text-muted)', opacity: 0.5 },
  mixSegDense: { display: 'block', background: 'var(--cp-accent)' },
  mixSegAi: { display: 'block', background: 'var(--cp-accent-maroon)' },
  mixLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-3)',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-wider)',
  },
  controlPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 'var(--cp-space-3)',
  },
  presetCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    textAlign: 'left',
  },
  presetCardSel: {},
  presetMix: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-1)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    flexWrap: 'nowrap',
  },
  presetMixSeg: { fontSize: 'var(--cp-font-xl)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)', letterSpacing: 'var(--cp-tracking-tight)' },
  presetMixDiv: { fontSize: 'var(--cp-font-base)', fontWeight: 'var(--cp-weight-semibold)', color: 'var(--cp-text-muted)' },
  presetMixAi: { color: 'var(--cp-accent-maroon)' },
  presetName: { fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)' },
  presetTagline: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', lineHeight: 'var(--cp-leading-tight)' },

  advancedToggle: {
    alignSelf: 'stretch',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    padding: 'var(--cp-space-3) var(--cp-space-4)',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    cursor: 'pointer',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--cp-space-6)',
  },
  col: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-3)' },
  colTitle: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  colTitleMeta: {
    fontWeight: 'var(--cp-weight-medium)',
    opacity: 0.7,
    textTransform: 'none',
  },

  sliders: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-3)' },
  sliderRow: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)' },
  sliderHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
  },
  sliderName: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-primary)',
  },
  sliderMeta: {
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
  },
  sliderControl: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-3)' },
  range: { flex: 1, accentColor: 'var(--cp-accent-maroon)' },
  pct: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-primary)',
    minWidth: 36,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  mw: {
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
    minWidth: 60,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },

  gpuCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--cp-space-2)',
  },
  gpuCard: {
    textAlign: 'left',
  },
  gpuCardSel: {},
  gpuSku: { fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-black)', letterSpacing: 'var(--cp-tracking-wide)' },
  gpuMeta: { fontSize: 'var(--cp-font-xs)', opacity: 0.75, marginTop: 'var(--cp-space-1)', lineHeight: 'var(--cp-leading-tight)' },
  gpuPrice: { fontSize: 'var(--cp-font-xs)', fontWeight: 'var(--cp-weight-bold)', marginTop: 'var(--cp-space-1)' },

  aiControls: {
    display: 'flex',
    gap: 'var(--cp-space-3)',
    paddingTop: 'var(--cp-space-2)',
    borderTop: '1px dashed var(--cp-border)',
  },
  ctrlBlock: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)', flex: 1 },
  ctrlLabel: {
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
    fontWeight: 'var(--cp-weight-bold)',
    minWidth: 60,
  },
  ctrlValue: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    minWidth: 36,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  numInput: {
    width: 'calc(var(--cp-space-9) + var(--cp-space-8))',
    fontSize: 'var(--cp-font-sm)',
    height: 'var(--cp-space-7)',
    padding: '0 var(--cp-space-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-sm)',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },

  summary: {
    display: 'grid',
    // auto-fit réagit à la largeur du CONTENEUR (rail chat ouvert → centre étroit),
    // pas du viewport. Évite le débordement de la carte "AI revenue / yr".
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 'var(--cp-space-2)',
    paddingTop: 'var(--cp-space-0)',
  },
  sumCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
  },
  sumLabel: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  sumValue: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
  },
};
