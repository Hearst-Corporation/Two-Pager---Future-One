'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import { GPU_CATALOG, calcRackPower, calcGpuCapex, calcGpuAnnualRevenue, REFERENCE_GPU_HOUR_PRICES } from '@/lib/hearst-gpu-catalog';
import { Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

// 3 ready-to-use hardware profiles. Click one to load the full mix; open
// Advanced to fine-tune every dial by hand.
const HARDWARE_PRESETS = [
  {
    id: 'colo',
    name: UI.HW_PRESET_COLO_NAME,
    tagline: UI.HW_PRESET_COLO_TAGLINE,
    patch: { classic_pct: 80, liquid_pct: 15, ai_pct: 5, gpu_sku_id: 'h200_sxm5', utilization_pct: 70, gpu_hour_price: 3 },
  },
  {
    id: 'mixed',
    name: UI.HW_PRESET_MIXED_NAME,
    tagline: UI.HW_PRESET_MIXED_TAGLINE,
    patch: { classic_pct: 40, liquid_pct: 35, ai_pct: 25, gpu_sku_id: 'gb200_nvl72', utilization_pct: 75, gpu_hour_price: 5 },
  },
  {
    id: 'ai_factory',
    name: UI.HW_PRESET_AI_NAME,
    tagline: UI.HW_PRESET_AI_TAGLINE,
    patch: { classic_pct: 10, liquid_pct: 20, ai_pct: 70, gpu_sku_id: 'gb200_nvl72', utilization_pct: 85, gpu_hour_price: 6 },
  },
];

function matchPreset(v) {
  const p = HARDWARE_PRESETS.find((p) =>
    p.patch.classic_pct === v.classic_pct &&
    p.patch.liquid_pct === v.liquid_pct &&
    p.patch.ai_pct === v.ai_pct,
  );
  return p?.id || null;
}

function redistribute(prev, changedKey, newValue) {
  const others = Object.keys(prev).filter((k) => k !== changedKey);
  const remaining = Math.max(0, 100 - newValue);
  const otherSum = others.reduce((s, k) => s + (prev[k] || 0), 0);
  const next = { ...prev, [changedKey]: newValue };
  if (otherSum > 0) {
    others.forEach((k) => {
      next[k] = Math.round((prev[k] / otherSum) * remaining);
    });
  } else {
    const split = Math.round(remaining / others.length);
    others.forEach((k) => { next[k] = split; });
  }
  const sum = Object.values(next).reduce((s, val) => s + val, 0);
  const diff = 100 - sum;
  if (diff !== 0 && others.length > 0) {
    next[others[0]] = (next[others[0]] || 0) + diff;
  }
  return next;
}

const TIER_LABELS = {
  classic_pct: { name: UI.HW_TIER_STANDARD_NAME, meta: UI.HW_TIER_STANDARD_META },
  liquid_pct:  { name: UI.HW_TIER_DENSE_NAME,    meta: UI.HW_TIER_DENSE_META },
  ai_pct:      { name: UI.HW_TIER_AI_NAME,       meta: UI.HW_TIER_AI_META },
};

export default function HardwareMixer({ totalMw = 50, value, onChange }) {
  const v = value || { classic_pct: 60, liquid_pct: 25, ai_pct: 15, gpu_sku_id: 'gb200_nvl72', num_racks: null, utilization_pct: 75, gpu_hour_price: 5 };

  const mw_ai = totalMw * (v.ai_pct / 100);
  const gpu = GPU_CATALOG.find((g) => g.id === v.gpu_sku_id) || GPU_CATALOG[0];
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
      {/* Hardware grids stack earlier than the page (1100/1500 vs 900) because the
          chat rail narrows the centre panel — these react to container width, not
          the viewport. This component owns its own breakpoints; the page-level
          stack rule does not target the hardware grids. */}
      <style>{`
        @media (max-width: 1100px) {
          [data-hardware-presets] { grid-template-columns: 1fr !important; }
          [data-hardware-spine] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1500px) {
          [data-hardware-advanced-grid] { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* PRESET RAIL — 3 horizontal choices, no redundant number triple */}
      <div data-hardware-presets style={S.presetRail}>
        {HARDWARE_PRESETS.map((p) => {
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
              style={S.presetCard}
            >
              <span style={S.presetName}>{p.name}</span>
              <span style={S.presetTagline}>{p.tagline}</span>
            </Card>
          );
        })}
      </div>

      {/* LIVE MIX SPINE — compact deployment visual + mix bar + power readout */}
      <div data-hardware-spine style={S.spine}>
        <Card variant="flat" surface={1} padding="md" style={S.spineMain}>
          <div style={S.spineHead}>
            <div>
              <span style={S.kicker}>{UI.HW_DEPLOY_KICKER}</span>
              <h3 style={S.spineTitle}>{UI.HW_DEPLOY_TITLE(gpu.sku)}</h3>
            </div>
            <span style={S.aiBadge}>{UI.HW_AI_BADGE(v.ai_pct)}</span>
          </div>
          <HardwareTopology
            classicPct={v.classic_pct}
            liquidPct={v.liquid_pct}
            totalMw={totalMw}
            aiMw={mw_ai}
          />
          <MixBar classicPct={v.classic_pct} liquidPct={v.liquid_pct} aiPct={v.ai_pct} />
        </Card>

        <Card variant="flat" surface={1} padding="md" style={S.readout}>
          <ReadoutRow label={UI.HW_READOUT_TOTAL} value={`${totalMw} MW`} />
          <ReadoutRow label={UI.HW_READOUT_AI} value={`${mw_ai.toFixed(1)} MW`} accent />
          <ReadoutRow label={UI.HW_READOUT_RACKS} value={racks_used.toLocaleString('en-US')} />
        </Card>
      </div>

      {/* KPI ROW — full width, breathing */}
      <div data-hardware-summary style={S.summary}>
        <SumKpi label={UI.HW_KPI_CHIPS} value={total_gpus.toLocaleString('en-US')} />
        <SumKpi label={UI.HW_KPI_RACKS} value={racks_used.toLocaleString('en-US')} />
        <SumKpi label={UI.HW_KPI_EQUIP} value={`$${(capex_hw / 1e6).toFixed(1)}M`} />
        <SumKpi label={UI.HW_KPI_REVENUE} value={`$${(revenue_ai / 1e6).toFixed(1)}M`} accent />
      </div>

      <button type="button" onClick={() => setAdvanced((a) => !a)} style={S.advancedToggle}>
        {advanced ? UI.HW_ADV_HIDE : UI.HW_ADV_SHOW}
      </button>

      {advanced && (
        <div data-hardware-advanced-grid style={S.grid}>
          <div style={S.col}>
            <div style={S.colTitle}>
              {UI.HW_ADV_POWER_TITLE} <span style={S.colTitleMeta}>{UI.HW_ADV_POWER_META}</span>
            </div>
            <div style={S.sliders}>
              {['classic_pct', 'liquid_pct', 'ai_pct'].map((key) => (
                <div key={key} style={S.sliderRow}>
                  <div style={S.sliderHead}>
                    <span style={S.sliderName}>{TIER_LABELS[key].name}</span>
                    <span style={S.sliderMeta}>{TIER_LABELS[key].meta}</span>
                  </div>
                  <div style={S.sliderControl}>
                    <input
                      type="range" min={0} max={100} step={1}
                      value={v[key]}
                      aria-label={`${TIER_LABELS[key].name} %`}
                      aria-valuetext={`${v[key]} %, ${(totalMw * v[key] / 100).toFixed(1)} MW`}
                      onChange={(e) => setTier(key, Number(e.target.value))}
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
                {UI.HW_ADV_AI_TITLE} <span style={S.colTitleMeta}>{UI.HW_ADV_AI_META(mw_ai.toFixed(1))}</span>
              </div>
              <div data-hardware-gpu-grid style={S.gpuCards}>
                {GPU_CATALOG.map((g) => {
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
                      style={S.gpuCard}
                    >
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
                  <span style={S.ctrlLabel}>{UI.HW_ADV_UTILIZATION}</span>
                  <input type="range" min={40} max={95} step={1} value={v.utilization_pct}
                    aria-label={UI.HW_GPU_UTIL_ARIA}
                    aria-valuetext={`${v.utilization_pct} %`}
                    onChange={(e) => onChange?.({ ...v, utilization_pct: Number(e.target.value) })} style={S.range} />
                  <span style={S.ctrlValue}>{v.utilization_pct}%</span>
                </label>
                <label style={S.ctrlBlock}>
                  <span style={S.ctrlLabel}>{UI.HW_ADV_PRICE}</span>
                  <input type="number" step={0.10} min={0} max={20} value={v.gpu_hour_price}
                    aria-label={UI.HW_ADV_PRICE}
                    onChange={(e) => onChange?.({ ...v, gpu_hour_price: Number(e.target.value) })} style={S.numInput} />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

HardwareMixer.propTypes = {
  totalMw: PropTypes.number,
  value: PropTypes.object,
  onChange: PropTypes.func,
};

// Compact rack-topology illustration (ambience, smaller than before).
function HardwareTopology({ classicPct, liquidPct, totalMw, aiMw }) {
  const rackCount = 18;
  const classicCount = Math.round(rackCount * classicPct / 100);
  const liquidCount = Math.round(rackCount * liquidPct / 100);
  return (
    <svg viewBox="0 0 760 180" role="img" aria-label={UI.HW_TOPOLOGY_ARIA} style={S.topology}>
      <defs>
        <linearGradient id="rackGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--cp-accent-maroon)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--cp-accent)" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--cp-accent-maroon)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--cp-accent-maroon)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="758" height="178" rx="18" fill="var(--cp-surface-0)" stroke="var(--cp-border)" />
      <circle cx="600" cy="70" r="92" fill="url(#coreGlow)" />
      {Array.from({ length: rackCount }).map((_, i) => {
        const col = i % 9;
        const row = Math.floor(i / 9);
        const x = 44 + col * 50;
        const y = 56 + row * 56;
        const fill = i < classicCount
          ? 'var(--cp-text-muted)'
          : i < classicCount + liquidCount
            ? 'var(--cp-accent)'
            : 'url(#rackGlow)';
        return (
          <g key={i}>
            <rect x={x} y={y} width="30" height="44" rx="6" fill={fill} opacity={i < classicCount ? 0.34 : 0.82} />
            <rect x={x + 6} y={y + 8} width="18" height="3" rx="2" fill="var(--cp-text-strong)" opacity="0.44" />
            <rect x={x + 6} y={y + 18} width="18" height="3" rx="2" fill="var(--cp-text-strong)" opacity="0.3" />
          </g>
        );
      })}
      <text x="44" y="34" fill="var(--cp-text-muted)" fontSize="11" fontWeight="var(--cp-weight-black)" letterSpacing="var(--cp-tracking-wider)">{UI.HW_POWER_HALL.toUpperCase()}</text>
      <text x="556" y="34" fill="var(--cp-text-primary)" fontSize="15" fontWeight="var(--cp-weight-black)">{totalMw} MW</text>
      <g>
        <rect x="556" y="96" width="150" height="58" rx="12" fill="var(--cp-surface-2)" stroke="var(--cp-border)" />
        <text x="572" y="118" fill="var(--cp-text-muted)" fontSize="10" fontWeight="var(--cp-weight-black)" letterSpacing="var(--cp-tracking-wider)">{UI.HW_AI_FABRIC.toUpperCase()}</text>
        <text x="572" y="142" fill="var(--cp-text-primary)" fontSize="22" fontWeight="var(--cp-weight-black)">{aiMw.toFixed(1)} MW</text>
      </g>
    </svg>
  );
}

HardwareTopology.propTypes = {
  classicPct: PropTypes.number,
  liquidPct: PropTypes.number,
  totalMw: PropTypes.number,
  aiMw: PropTypes.number,
};

function MixBar({ classicPct, liquidPct, aiPct }) {
  return (
    <div style={S.mixWrap}>
      <div style={S.mixBar}>
        <span style={{ ...S.mixSegStandard, width: `${classicPct}%` }} />
        <span style={{ ...S.mixSegDense, width: `${liquidPct}%` }} />
        <span style={{ ...S.mixSegAi, width: `${aiPct}%` }} />
      </div>
      <div style={S.mixLegend}>
        <span>{UI.HW_MIX_STANDARD} {classicPct}%</span>
        <span>{UI.HW_MIX_DENSE} {liquidPct}%</span>
        <span>{UI.HW_MIX_AI} {aiPct}%</span>
      </div>
    </div>
  );
}

MixBar.propTypes = {
  classicPct: PropTypes.number,
  liquidPct: PropTypes.number,
  aiPct: PropTypes.number,
};

function ReadoutRow({ label, value, accent }) {
  return (
    <div style={S.readoutRow}>
      <span style={S.readoutLabel}>{label}</span>
      <strong style={{ ...S.readoutValue, color: accent ? 'var(--cp-accent-maroon)' : 'var(--cp-text-primary)' }}>{value}</strong>
    </div>
  );
}

ReadoutRow.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  accent: PropTypes.bool,
};

function SumKpi({ label, value, accent }) {
  return (
    <Card variant="flat" style={S.sumCard} padding="sm" surface={2}>
      <div style={S.sumLabel}>{label}</div>
      <div style={{ ...S.sumValue, color: accent ? 'var(--cp-accent-maroon)' : 'var(--cp-text-primary)' }}>{value}</div>
    </Card>
  );
}

SumKpi.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  accent: PropTypes.bool,
};

const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
  },
  presetRail: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 'var(--cp-space-3)',
  },
  presetCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    textAlign: 'left',
    minHeight: 64,
  },
  presetName: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-primary)',
  },
  presetTagline: {
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
    lineHeight: 'var(--cp-leading-tight)',
  },
  spine: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 0.34fr)',
    gap: 'var(--cp-space-3)',
    alignItems: 'stretch',
  },
  spineMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  spineHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--cp-space-3)',
  },
  kicker: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
  },
  spineTitle: {
    margin: 'var(--cp-space-1) 0 0',
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-lg)',
    lineHeight: 1.1,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  aiBadge: {
    padding: 'var(--cp-space-1) var(--cp-space-3)',
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
  readout: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    justifyContent: 'center',
    minWidth: 0,
  },
  readoutRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-2)',
  },
  readoutLabel: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  readoutValue: {
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    fontVariantNumeric: 'tabular-nums',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 'var(--cp-space-2)',
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
};
