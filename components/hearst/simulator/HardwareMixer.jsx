'use client';

import { GPU_CATALOG, calcRackPower, calcGpuCapex, calcGpuAnnualRevenue, REFERENCE_GPU_HOUR_PRICES } from '@/lib/hearst-gpu-catalog';

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

  function setTier(key, val) {
    const next = redistribute(
      { classic_pct: v.classic_pct, liquid_pct: v.liquid_pct, ai_pct: v.ai_pct },
      key, Math.max(0, Math.min(100, val)),
    );
    onChange?.({ ...v, ...next });
  }

  return (
    <div style={S.wrap}>
      <div style={S.grid}>
        {/* Power density */}
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

        {/* AI chip */}
        {v.ai_pct > 0 && (
          <div style={S.col}>
            <div style={S.colTitle}>
              AI chip <span style={S.colTitleMeta}>({mw_ai.toFixed(1)} MW dedicated)</span>
            </div>
            <div style={S.gpuCards}>
              {GPU_CATALOG.map(g => {
                const sel = v.gpu_sku_id === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onChange?.({ ...v, gpu_sku_id: g.id, gpu_hour_price: REFERENCE_GPU_HOUR_PRICES[g.id] || v.gpu_hour_price })}
                    style={{ ...S.gpuCard, ...(sel ? S.gpuCardSel : {}) }}>
                    <div style={S.gpuSku}>{g.sku}</div>
                    <div style={S.gpuMeta}>
                      {g.vendor} · {g.rack_scale ? `${(g.tdp_w / 1000000).toFixed(1)} MW/rack` : `${g.tdp_w}W`} · {g.hbm_gb}GB
                    </div>
                    <div style={S.gpuPrice}>
                      ${g.rack_scale ? `${(g.msrp_usd / 1000000).toFixed(1)}M/rack` : `${(g.msrp_usd / 1000).toFixed(0)}k/GPU`}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={S.aiControls}>
              <label style={S.ctrlBlock}>
                <span style={S.ctrlLabel}>Utilization</span>
                <input type="range" min={40} max={95} step={1} value={v.utilization_pct}
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

      {v.ai_pct > 0 && (
        <div style={S.summary}>
          <SumKpi label="AI chips" value={total_gpus.toLocaleString()} />
          <SumKpi label="Racks" value={racks_used} />
          <SumKpi label="Equipment cost" value={`$${(capex_hw / 1e6).toFixed(1)}M`} />
          <SumKpi label="AI revenue / yr" value={`$${(revenue_ai / 1e6).toFixed(1)}M`} accent />
        </div>
      )}
    </div>
  );
}

function SumKpi({ label, value, accent }) {
  return (
    <div style={S.sumCard}>
      <div style={S.sumLabel}>{label}</div>
      <div style={{ ...S.sumValue, color: accent ? 'var(--cp-accent-maroon)' : 'var(--cp-text-primary)' }}>{value}</div>
    </div>
  );
}

const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  },
  col: { display: 'flex', flexDirection: 'column', gap: 12 },
  colTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  colTitleMeta: {
    fontWeight: 500,
    opacity: 0.7,
    textTransform: 'none',
    letterSpacing: 0,
  },

  sliders: { display: 'flex', flexDirection: 'column', gap: 12 },
  sliderRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  sliderHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  sliderName: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--cp-text-primary)',
  },
  sliderMeta: {
    fontSize: 11,
    color: 'var(--cp-text-muted)',
  },
  sliderControl: { display: 'flex', alignItems: 'center', gap: 12 },
  range: { flex: 1, accentColor: 'var(--cp-accent-maroon)' },
  pct: {
    fontSize: 12,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
    minWidth: 36,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  mw: {
    fontSize: 11,
    color: 'var(--cp-text-muted)',
    minWidth: 60,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },

  gpuCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  gpuCard: {
    padding: 10,
    background: 'var(--cp-surface-0)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--cp-border)',
    borderRadius: 6,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.12s ease',
    color: 'var(--cp-text-primary)',
  },
  gpuCardSel: {
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
    borderColor: 'var(--cp-accent-maroon)',
  },
  gpuSku: { fontSize: 12, fontWeight: 800, letterSpacing: 0.2 },
  gpuMeta: { fontSize: 11, opacity: 0.75, marginTop: 4, lineHeight: '16px' },
  gpuPrice: { fontSize: 11, fontWeight: 700, marginTop: 4 },

  aiControls: {
    display: 'flex',
    gap: 12,
    paddingTop: 8,
    borderTop: '1px dashed var(--cp-border)',
  },
  ctrlBlock: { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  ctrlLabel: {
    fontSize: 11,
    color: 'var(--cp-text-muted)',
    fontWeight: 700,
    minWidth: 60,
  },
  ctrlValue: {
    fontSize: 12,
    fontWeight: 700,
    minWidth: 36,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  numInput: {
    width: 72,
    fontSize: 12,
    height: 28,
    padding: '0 8px',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },

  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    paddingTop: 16,
    borderTop: '1px solid var(--cp-border)',
  },
  sumCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '10px 12px',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
  },
  sumLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sumValue: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: -0.2,
    fontVariantNumeric: 'tabular-nums',
  },
};
