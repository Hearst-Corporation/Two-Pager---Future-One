'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import { GPU_CATALOG, calcRackPower, calcGpuCapex, calcGpuAnnualRevenue, REFERENCE_GPU_HOUR_PRICES } from '@/lib/hearst-gpu-catalog';
import { Card } from '@/components/hearst/ui';
import InfoHint from '@/components/hearst/InfoHint';
import { UI } from '@/lib/ui-strings';
import { G } from '@/lib/cp-styles';

// 3 ready-to-use hardware profiles. Click one to load the full mix; open
// Advanced to fine-tune every dial by hand.
const HARDWARE_PRESETS = [
  {
    id: 'colo',
    name: UI.HW_PRESET_COLO_NAME,
    tagline: UI.HW_PRESET_COLO_TAGLINE,
    info: UI.HW_PRESET_COLO_INFO,
    patch: { classic_pct: 80, liquid_pct: 15, ai_pct: 5, gpu_sku_id: 'h200_sxm5', utilization_pct: 70, gpu_hour_price: 2.99 },
  },
  {
    id: 'mixed',
    name: UI.HW_PRESET_MIXED_NAME,
    tagline: UI.HW_PRESET_MIXED_TAGLINE,
    info: UI.HW_PRESET_MIXED_INFO,
    patch: { classic_pct: 40, liquid_pct: 35, ai_pct: 25, gpu_sku_id: 'gb200_nvl72', utilization_pct: 75, gpu_hour_price: 5 },
  },
  {
    id: 'ai_factory',
    name: UI.HW_PRESET_AI_NAME,
    tagline: UI.HW_PRESET_AI_TAGLINE,
    info: UI.HW_PRESET_AI_INFO,
    patch: { classic_pct: 10, liquid_pct: 20, ai_pct: 70, gpu_sku_id: 'gb200_nvl72', utilization_pct: 85, gpu_hour_price: 5 },
  },
];

const PRESET_ICONS = {
  colo: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="1" />
      <line x1="8" y1="8" x2="8" y2="8.01" /><line x1="12" y1="8" x2="12" y2="8.01" /><line x1="16" y1="8" x2="16" y2="8.01" />
      <line x1="8" y1="12" x2="8" y2="12.01" /><line x1="12" y1="12" x2="12" y2="12.01" /><line x1="16" y1="12" x2="16" y2="12.01" />
    </>
  ),
  mixed: (
    <>
      <rect x="4" y="5" width="16" height="4" rx="0.5" />
      <rect x="6" y="10" width="12" height="4" rx="0.5" />
      <rect x="8" y="15" width="8" height="4" rx="0.5" />
    </>
  ),
  ai_factory: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <path d="M9 9h6M9 12h6M9 15h6" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
};

function PresetIcon({ id, selected }) {
  return (
    <span style={{ ...S.iconBadge, ...(selected ? S.iconBadgeSelected : {}) }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={S.iconSvg}>
        {PRESET_ICONS[id]}
      </svg>
    </span>
  );
}
PresetIcon.propTypes = { id: PropTypes.string, selected: PropTypes.bool };

// A preset is "active" only when the FULL patch still matches the live mix —
// tier split AND gpu/utilization/price. Otherwise editing any advanced dial would
// leave the preset card lit while the config has diverged (stale selection).
function matchPreset(v) {
  const p = HARDWARE_PRESETS.find((p) =>
    p.patch.classic_pct === v.classic_pct &&
    p.patch.liquid_pct === v.liquid_pct &&
    p.patch.ai_pct === v.ai_pct &&
    p.patch.gpu_sku_id === v.gpu_sku_id &&
    p.patch.utilization_pct === v.utilization_pct &&
    p.patch.gpu_hour_price === v.gpu_hour_price,
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

export default function HardwareMixer({ totalMw = 50, value, onChange, variant = 'full' }) {
  const v = value || { classic_pct: 60, liquid_pct: 25, ai_pct: 15, gpu_sku_id: 'gb200_nvl72', num_racks: null, utilization_pct: 75, gpu_hour_price: 5 };

  const mw_ai = totalMw * (v.ai_pct / 100);
  const gpu = GPU_CATALOG.find((g) => g.id === v.gpu_sku_id) || GPU_CATALOG[0];
  const rack_kw = calcRackPower(gpu);
  const derived_racks = rack_kw > 0 ? Math.floor((mw_ai * 1000) / rack_kw) : 0;
  const racks_used = v.num_racks != null && v.num_racks > 0 ? v.num_racks : derived_racks;
  const total_gpus = racks_used * gpu.density_per_rack;
  const capex_hw = calcGpuCapex(racks_used, gpu);
  const revenue_ai = calcGpuAnnualRevenue(racks_used, gpu, v.utilization_pct, v.gpu_hour_price);

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

  const [showFineTune, setShowFineTune] = useState(false);

  const showPresets = variant === 'full' || variant === 'presets';
  const showDetail = variant === 'full' || variant === 'detail';

  return (
    <div data-hardware-mixer style={S.wrap}>
      {showPresets && (
      <div data-hardware-presets style={S.presetRail}>
        {HARDWARE_PRESETS.map((p) => {
          const sel = activePreset === p.id;
          return (
            <div key={p.id} style={S.presetWrap}>
              <Card
                as="button"
                type="button"
                onClick={() => applyPreset(p)}
                padding="none"
                hover
                aria-pressed={sel}
                surface={2}
                style={{ ...S.presetCard, ...(sel ? G.selected : {}) }}
              >
                <PresetIcon id={p.id} selected={sel} />
                <span style={S.presetName}>{p.name}</span>
                <span style={S.presetTagline}>{p.tagline}</span>
              </Card>
              {p.info && (
                <span style={S.presetHintSlot}>
                  <InfoHint label={p.name} align="right" content={{ title: p.name, body: p.info }} />
                </span>
              )}
            </div>
          );
        })}
      </div>
      )}

      {showDetail && (
      <>
      <div data-hardware-spine style={S.spine}>
        <Card variant="flat" surface={1} padding="none" style={S.spineMain}>
          <div style={S.spineHead}>
            <div>
              <span style={S.kicker}>{UI.HW_DEPLOY_KICKER}</span>
              <h3 style={S.spineTitle}>{UI.HW_DEPLOY_TITLE(gpu.sku)}</h3>
            </div>
            <span style={S.aiBadge}>{UI.HW_AI_BADGE(v.ai_pct)}</span>
          </div>
          <MixBar classicPct={v.classic_pct} liquidPct={v.liquid_pct} aiPct={v.ai_pct} />
        </Card>

        <Card variant="flat" surface={1} padding="none" style={S.readout}>
          <ReadoutRow label={UI.HW_READOUT_TOTAL} value={`${totalMw} MW`} />
          <ReadoutRow label={UI.HW_READOUT_AI} value={`${mw_ai.toFixed(1)} MW`} accent />
          <ReadoutRow label={UI.HW_READOUT_RACKS} value={racks_used.toLocaleString('en-US')} />
        </Card>
      </div>

      <div data-hardware-finetune-toggle style={S.fineTuneToggle}>
        <button
          type="button"
          onClick={() => setShowFineTune((open) => !open)}
          style={S.fineTuneButton}
          aria-expanded={showFineTune}
          aria-controls="hardware-finetune-panel"
        >
          <span>{showFineTune ? UI.SIM_CONFIG_FINETUNE_HIDE : UI.SIM_CONFIG_FINETUNE_SHOW}</span>
          <span aria-hidden style={{ transform: showFineTune ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </button>
      </div>

      {showFineTune && (
        <div id="hardware-finetune-panel" data-hardware-advanced style={S.advanced}>
          <div data-hardware-summary style={S.summary}>
            <SumKpi label={UI.HW_KPI_CHIPS} value={total_gpus.toLocaleString('en-US')} />
            <SumKpi label={UI.HW_KPI_RACKS} value={racks_used.toLocaleString('en-US')} />
            <SumKpi label={UI.HW_KPI_EQUIP} value={`$${(capex_hw / 1e6).toFixed(1)}M`} />
            <SumKpi label={UI.HW_KPI_REVENUE} value={`$${(revenue_ai / 1e6).toFixed(1)}M`} accent />
          </div>

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
                      aria-pressed={sel}
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

              <div data-hardware-ai-controls style={S.aiControls}>
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
        </div>
      )}
      </>
      )}
    </div>
  );
}

HardwareMixer.propTypes = {
  totalMw: PropTypes.number,
  value: PropTypes.object,
  onChange: PropTypes.func,
  variant: PropTypes.oneOf(['full', 'presets', 'detail']),
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
      <text x="44" y="34" fill="var(--cp-text-muted)" fontSize="var(--cp-font-xs)" fontWeight="var(--cp-weight-black)" letterSpacing="var(--cp-tracking-wider)">{UI.HW_POWER_HALL.toUpperCase()}</text>
      <text x="556" y="34" fill="var(--cp-text-primary)" fontSize="var(--cp-font-lg)" fontWeight="var(--cp-weight-black)">{totalMw} MW</text>
      <g>
        <rect x="556" y="96" width="150" height="58" rx="12" fill="var(--cp-surface-2)" stroke="var(--cp-border)" />
        <text x="572" y="118" fill="var(--cp-text-muted)" fontSize="var(--cp-font-micro)" fontWeight="var(--cp-weight-black)" letterSpacing="var(--cp-tracking-wider)">{UI.HW_AI_FABRIC.toUpperCase()}</text>
        <text x="572" y="142" fill="var(--cp-text-primary)" fontSize="var(--cp-font-2xl)" fontWeight="var(--cp-weight-black)">{aiMw.toFixed(1)} MW</text>
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
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  fineTuneToggle: {
    display: 'flex',
    justifyContent: 'center',
    padding: 'var(--cp-space-1) 0',
    borderTop: '1px solid var(--cp-border)',
  },
  fineTuneButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-1) var(--cp-space-3)',
    background: 'transparent',
    border: 'none',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-widest)',
    cursor: 'pointer',
    opacity: 0.85,
    transition: 'opacity 0.2s',
  },
  advanced: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  presetRail: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 'var(--cp-space-px)',
    background: 'var(--cp-border)',
    padding: 'var(--cp-space-px)',
    borderRadius: 'var(--cp-radius-sm)',
    border: '1px solid var(--cp-border)',
    overflow: 'hidden',
    minHeight: 'var(--cp-tile-minh)',
  },
  presetWrap: {
    position: 'relative',
    display: 'flex',
    minWidth: 0,
    background: 'var(--cp-surface-2)',
  },
  presetHintSlot: {
    position: 'absolute',
    top: 'var(--cp-space-1)',
    right: 'var(--cp-space-1)',
    zIndex: 'var(--cp-z-floating)',
    opacity: 0.55,
    transform: 'scale(0.85)',
  },
  presetCard: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--cp-space-1)',
    textAlign: 'center',
    minHeight: 'var(--cp-tile-minh)',
    border: 'none',
    borderRadius: 0,
    padding: 'var(--cp-space-2) var(--cp-space-1)',
    background: 'transparent',
    transition: 'background var(--cp-dur-base) var(--cp-ease)',
  },
  iconBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--cp-control-md)',
    height: 'var(--cp-control-md)',
    borderRadius: 'var(--cp-radius-xs)',
    border: '1px solid var(--cp-border)',
    background: 'var(--cp-surface-1)',
    color: 'var(--cp-text-muted)',
    flexShrink: 0,
  },
  iconBadgeSelected: {
    borderColor: 'var(--cp-border-strong)',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
  },
  iconSvg: {
    width: 'var(--cp-icon-sm)',
    height: 'var(--cp-icon-sm)',
    strokeWidth: '1.5px',
  },
  presetName: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-wide)',
    lineHeight: 'var(--cp-leading-snug)',
    padding: '0 var(--cp-space-1)',
  },
  presetTagline: {
    fontSize: 'var(--cp-font-nano)',
    color: 'var(--cp-text-muted)',
    lineHeight: 'var(--cp-leading-heading)',
    padding: '0 var(--cp-space-1)',
  },
  spine: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(140px, 0.25fr)',
    gap: 'var(--cp-space-1)',
    alignItems: 'stretch',
  },
  spineMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minWidth: 0,
    border: '1px solid var(--cp-border)',
    padding: 'var(--cp-space-2)',
  },
  spineHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
  },
  kicker: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  spineTitle: {
    margin: '0',
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-none)',
    fontWeight: 'var(--cp-weight-black)',
  },
  aiBadge: {
    padding: '1px 4px',
    color: 'var(--cp-text-strong)',
    background: 'var(--cp-accent-maroon)',
    borderRadius: 'var(--cp-radius-2)',
    fontSize: 'var(--cp-font-nano)',
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
    gap: 'var(--cp-space-hair)',
  },
  mixBar: {
    height: 'var(--cp-bar-h)',
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
    gap: 'var(--cp-space-2)',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-nano)',
    fontWeight: 'var(--cp-weight-bold)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-wider)',
  },
  readout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    justifyContent: 'center',
    minWidth: 0,
    border: '1px solid var(--cp-border)',
    padding: 'var(--cp-space-1) var(--cp-space-2)',
  },
  readoutRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-2)',
    lineHeight: 'var(--cp-leading-relaxed)',
  },
  readoutLabel: {
    fontSize: 'var(--cp-font-nano)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  readoutValue: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    fontVariantNumeric: 'tabular-nums',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--cp-space-px)',
    background: 'var(--cp-border)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-xs)',
    overflow: 'hidden',
  },
  sumCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    border: 'none',
    borderRadius: '0',
    padding: 'var(--cp-space-1) var(--cp-space-2)',
    background: 'var(--cp-surface-2)',
  },
  sumLabel: {
    fontSize: 'var(--cp-font-nano)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    lineHeight: 'var(--cp-leading-none)',
  },
  sumValue: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 'var(--cp-leading-heading)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--cp-space-3)',
  },
  col: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)' },
  colTitle: {
    fontSize: 'var(--cp-font-nano)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wider)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--cp-border)',
    paddingBottom: 'var(--cp-space-px)',
  },
  colTitleMeta: {
    fontWeight: 'var(--cp-weight-medium)',
    opacity: 0.7,
    textTransform: 'none',
    float: 'right',
  },
  sliders: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)' },
  sliderRow: { display: 'flex', flexDirection: 'column', gap: '0' },
  sliderHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
  },
  sliderName: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-primary)',
  },
  sliderMeta: {
    fontSize: 'var(--cp-font-nano)',
    color: 'var(--cp-text-muted)',
  },
  sliderControl: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)' },
  range: { flex: 1, accentColor: 'var(--cp-accent-maroon)', height: '8px' },
  pct: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-primary)',
    minWidth: 24,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  mw: {
    fontSize: 'var(--cp-font-nano)',
    color: 'var(--cp-text-muted)',
    minWidth: 40,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  gpuCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--cp-space-px)',
    background: 'var(--cp-border)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-xs)',
    overflow: 'hidden',
  },
  gpuCard: {
    textAlign: 'left',
    border: 'none',
    borderRadius: '0',
    background: 'var(--cp-surface-2)',
    padding: 'var(--cp-space-1) var(--cp-space-2)',
  },
  gpuSku: { fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-black)', letterSpacing: 'var(--cp-tracking-wide)', lineHeight: 'var(--cp-leading-none)' },
  gpuMeta: { fontSize: 'var(--cp-font-nano)', opacity: 0.75, marginTop: '0', lineHeight: 'var(--cp-leading-none)' },
  gpuPrice: { fontSize: 'var(--cp-font-nano)', fontWeight: 'var(--cp-weight-bold)', marginTop: 'var(--cp-space-px)', lineHeight: 'var(--cp-leading-none)' },
  aiControls: {
    display: 'flex',
    gap: 'var(--cp-space-2)',
    paddingTop: 'var(--cp-space-1)',
    borderTop: '1px dashed var(--cp-border)',
  },
  ctrlBlock: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)', flex: 1 },
  ctrlLabel: {
    fontSize: 'var(--cp-font-nano)',
    color: 'var(--cp-text-muted)',
    fontWeight: 'var(--cp-weight-bold)',
    minWidth: 40,
  },
  ctrlValue: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    minWidth: 24,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  numInput: {
    width: 'var(--cp-readout-w)',
    fontSize: 'var(--cp-font-micro)',
    height: 'var(--cp-control-sm)',
    padding: '0 var(--cp-space-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-2)',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
};
