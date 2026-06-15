'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  GPU_CATALOG,
  calcRackPower,
  calcGpuCapex,
  calcGpuAnnualRevenue,
  REFERENCE_GPU_HOUR_PRICES,
} from '@/lib/hearst-gpu-catalog';
import {
  HARDWARE_PRESETS as HW_PRESET_PATCHES,
  DEFAULT_HARDWARE_MIX,
  hardwareMixMatchesPreset,
} from '@/lib/hearst-config-presets';
import { UI } from '@/lib/ui-strings';
import './simulator-config.css';

const PRESET_LABELS = {
  colo: { name: UI.HW_PRESET_COLO_NAME, tagline: UI.HW_PRESET_COLO_TAGLINE },
  mixed: { name: UI.HW_PRESET_MIXED_NAME, tagline: UI.HW_PRESET_MIXED_TAGLINE },
  ai_factory: { name: UI.HW_PRESET_AI_NAME, tagline: UI.HW_PRESET_AI_TAGLINE },
};

const HARDWARE_PRESETS = HW_PRESET_PATCHES.map((p) => ({
  ...p,
  ...PRESET_LABELS[p.id],
}));

const TIER_KEYS = ['classic_pct', 'liquid_pct', 'ai_pct'];

const TIER_NAMES = {
  classic_pct: UI.HW_MIX_STANDARD,
  liquid_pct: UI.HW_MIX_DENSE,
  ai_pct: UI.HW_MIX_AI,
};

const GPU_SHORT = {
  h100_sxm5: 'H100',
  h200_sxm5: 'H200',
  gb200_nvl72: 'GB200',
  mi300x: 'MI300X',
};

function matchPresetId(v) {
  const p = HARDWARE_PRESETS.find((preset) => hardwareMixMatchesPreset(v, preset.patch));
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

export default function HardwareMixer({ totalMw = 50, value, onChange, variant = 'full' }) {
  const v = value || { ...DEFAULT_HARDWARE_MIX, num_racks: null };

  const mw_ai = totalMw * (v.ai_pct / 100);
  const gpu = GPU_CATALOG.find((g) => g.id === v.gpu_sku_id) || GPU_CATALOG[0];
  const rack_kw = calcRackPower(gpu);
  const derived_racks = rack_kw > 0 ? Math.floor((mw_ai * 1000) / rack_kw) : 0;
  const racks_used = v.num_racks != null && v.num_racks > 0 ? v.num_racks : derived_racks;
  const total_gpus = racks_used * gpu.density_per_rack;
  const capex_hw = calcGpuCapex(racks_used, gpu);
  const revenue_ai = calcGpuAnnualRevenue(racks_used, gpu, v.utilization_pct, v.gpu_hour_price);

  const activePreset = matchPresetId(v);
  const [showFineTune, setShowFineTune] = useState(false);

  const showPresets = variant === 'full' || variant === 'presets';
  const showDetail = variant === 'full' || variant === 'detail';

  function setTier(key, val) {
    const next = redistribute(
      { classic_pct: v.classic_pct, liquid_pct: v.liquid_pct, ai_pct: v.ai_pct },
      key,
      Math.max(0, Math.min(100, val)),
    );
    onChange?.({ ...v, ...next });
  }

  function applyPreset(p) {
    if (activePreset === p.id) return;
    onChange?.({ ...v, ...p.patch });
  }

  return (
    <div data-hardware-mixer>
      {showPresets && (
        <>
          <div data-hardware-presets role="group" aria-label={UI.SIM_HW_TITLE}>
            {HARDWARE_PRESETS.map((p) => {
              const sel = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="hardware-preset-option"
                  aria-pressed={sel}
                  title={p.tagline || undefined}
                  onClick={() => applyPreset(p)}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
          {!activePreset && (
            <p className="hardware-custom-mix">{UI.HW_CUSTOM_MIX}</p>
          )}
        </>
      )}

      {showDetail && (
        <>
          <div data-hardware-spine>
            <div className="hardware-spine-panel">
              <p className="hardware-spine-title">{UI.HW_DEPLOY_TITLE()}</p>
              <MixBar classicPct={v.classic_pct} liquidPct={v.liquid_pct} aiPct={v.ai_pct} />
              <div className="hardware-spine-stats">
                <Readout label={UI.HW_READOUT_TOTAL} value={`${totalMw} MW`} />
                {v.ai_pct > 0 && (
                  <>
                    <Readout label={UI.HW_READOUT_AI} value={`${mw_ai.toFixed(1)} MW`} />
                    <Readout label={UI.HW_READOUT_GPU} value={GPU_SHORT[gpu.id] || gpu.sku} />
                    <Readout label={UI.HW_READOUT_RACKS} value={racks_used.toLocaleString('en-US')} />
                  </>
                )}
              </div>
            </div>
          </div>

          <div data-hardware-finetune-toggle>
            <button
              type="button"
              onClick={() => setShowFineTune((open) => !open)}
              className="hardware-finetune-button"
              aria-expanded={showFineTune}
              aria-controls="hardware-finetune-panel"
            >
              <span>{showFineTune ? UI.SIM_CONFIG_FINETUNE_HIDE : UI.SIM_CONFIG_FINETUNE_SHOW}</span>
              <span aria-hidden className={`hardware-finetune-chevron${showFineTune ? ' is-open' : ''}`}>▾</span>
            </button>
          </div>

          {showFineTune && (
            <div id="hardware-finetune-panel" data-hardware-advanced>
              <section data-hw-adv-block>
                <h4 className="hw-adv-heading">
                  {UI.HW_ADV_POWER_TITLE}
                  <span className="hw-adv-heading-meta">{UI.HW_ADV_POWER_META}</span>
                </h4>
                <div className="hw-adv-sliders">
                  {TIER_KEYS.map((key) => {
                    const pct = v[key];
                    const mw = (totalMw * pct / 100).toFixed(1);
                    const name = TIER_NAMES[key];
                    return (
                      <div key={key} className="hw-adv-slider">
                        <span className="hw-adv-slider-label">{name}</span>
                        <div className="hw-adv-slider-track">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            className="hw-adv-range"
                            value={pct}
                            aria-label={`${name} %`}
                            aria-valuetext={`${pct} %, ${mw} MW`}
                            onChange={(e) => setTier(key, Number(e.target.value))}
                          />
                          <span className="hw-adv-slider-pct">{pct}%</span>
                          <span className="hw-adv-slider-mw">{mw} MW</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {v.ai_pct > 0 && (
                <section data-hw-adv-block>
                  <h4 className="hw-adv-heading">
                    {UI.HW_ADV_AI_TITLE}
                    <span className="hw-adv-heading-meta">{UI.HW_ADV_AI_META(mw_ai.toFixed(1))}</span>
                  </h4>
                  <div data-hw-gpu-segment role="group" aria-label={UI.HW_ADV_AI_TITLE}>
                    {GPU_CATALOG.map((g) => {
                      const sel = v.gpu_sku_id === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          className="hw-gpu-option"
                          aria-pressed={sel}
                          title={g.sku}
                          onClick={() => onChange?.({
                            ...v,
                            gpu_sku_id: g.id,
                            gpu_hour_price: REFERENCE_GPU_HOUR_PRICES[g.id] || v.gpu_hour_price,
                          })}
                        >
                          {GPU_SHORT[g.id] || g.id}
                        </button>
                      );
                    })}
                  </div>

                  <div data-hw-ai-tuning>
                    <label className="hw-adv-tune">
                      <span className="hw-adv-tune-label">{UI.HW_ADV_UTILIZATION}</span>
                      <input
                        type="range"
                        min={40}
                        max={95}
                        step={1}
                        className="hw-adv-range"
                        value={v.utilization_pct}
                        aria-label={UI.HW_GPU_UTIL_ARIA}
                        aria-valuetext={`${v.utilization_pct} %`}
                        onChange={(e) => onChange?.({ ...v, utilization_pct: Number(e.target.value) })}
                      />
                      <span className="hw-adv-tune-value">{v.utilization_pct}%</span>
                    </label>
                    <label className="hw-adv-tune">
                      <span className="hw-adv-tune-label">{UI.HW_ADV_PRICE}</span>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        max={20}
                        className="hw-adv-num"
                        value={v.gpu_hour_price}
                        aria-label={UI.HW_ADV_PRICE}
                        onChange={(e) => onChange?.({ ...v, gpu_hour_price: Number(e.target.value) })}
                      />
                    </label>
                  </div>

                  <div className="hw-adv-economics" data-hw-economics>
                    <span><strong>{total_gpus.toLocaleString('en-US')}</strong> {UI.HW_KPI_CHIPS}</span>
                    <span><strong>${(capex_hw / 1e6).toFixed(1)}M</strong> {UI.HW_KPI_EQUIP}</span>
                    <span><strong>${(revenue_ai / 1e6).toFixed(1)}M</strong> {UI.HW_KPI_REVENUE}</span>
                  </div>
                </section>
              )}
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

function MixBar({ classicPct, liquidPct, aiPct }) {
  const flex = (n) => Math.max(n, 0.001);
  return (
    <div className="hardware-mix-wrap">
      <div className="hardware-mix-bar">
        <span className="hardware-mix-seg hardware-mix-seg-standard" style={{ width: `${classicPct}%` }} />
        <span className="hardware-mix-seg hardware-mix-seg-dense" style={{ width: `${liquidPct}%` }} />
        <span className="hardware-mix-seg hardware-mix-seg-ai" style={{ width: `${aiPct}%` }} />
      </div>
      <div className="hardware-mix-legend">
        <span className="hardware-mix-legend-item hardware-mix-legend-standard" style={{ flex: flex(classicPct) }}>
          {UI.HW_MIX_STANDARD} {classicPct}%
        </span>
        <span className="hardware-mix-legend-item hardware-mix-legend-dense" style={{ flex: flex(liquidPct) }}>
          {UI.HW_MIX_DENSE} {liquidPct}%
        </span>
        <span className="hardware-mix-legend-item hardware-mix-legend-ai" style={{ flex: flex(aiPct) }}>
          {UI.HW_MIX_AI} {aiPct}%
        </span>
      </div>
    </div>
  );
}

MixBar.propTypes = {
  classicPct: PropTypes.number,
  liquidPct: PropTypes.number,
  aiPct: PropTypes.number,
};

function Readout({ label, value }) {
  return (
    <span className="hardware-readout-row">
      <span className="hardware-readout-label">{label}</span>
      <strong className="hardware-readout-value">{value}</strong>
    </span>
  );
}

Readout.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
};
