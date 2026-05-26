'use client';

import { GPU_CATALOG, calcRackPower, calcGpuCapex, calcGpuAnnualRevenue, REFERENCE_GPU_HOUR_PRICES } from '@/lib/hearst-gpu-catalog';

/**
 * Slider couplé : ajuster un % redistribue le reste proportionnellement
 * pour garder la somme à 100.
 */
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
  // Repair sum to exactly 100
  const sum = Object.values(next).reduce((s, v) => s + v, 0);
  const diff = 100 - sum;
  if (diff !== 0 && others.length > 0) {
    next[others[0]] = (next[others[0]] || 0) + diff;
  }
  return next;
}

const TIER_LABELS = {
  classic_pct: 'Standard servers (low power, ≤15 kW/rack)',
  liquid_pct:  'High-density (medium power, ≤60 kW/rack)',
  ai_pct:      'AI clusters (very high power, ≥70 kW/rack)',
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
      {/* Power density */}
      <div style={S.col}>
        <div style={S.sectionTitle}>Power density per rack (must total 100%)</div>
        {['classic_pct', 'liquid_pct', 'ai_pct'].map(key => (
          <div key={key} style={S.sliderRow}>
            <div style={S.sliderLabel}>{TIER_LABELS[key]}</div>
            <div style={S.sliderRowInner}>
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

      {/* AI chip model */}
      {v.ai_pct > 0 && (
        <div style={S.col}>
          <div style={S.sectionTitle}>Pick your AI chip ({mw_ai.toFixed(1)} MW dedicated)</div>
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
              <span style={S.ctrlLabel}>How busy will it be?</span>
              <input type="range" min={40} max={95} step={1} value={v.utilization_pct}
                onChange={e => onChange?.({ ...v, utilization_pct: Number(e.target.value) })} style={S.range} />
              <span style={S.ctrlValue}>{v.utilization_pct}%</span>
            </label>
            <label style={S.ctrlBlock}>
              <span style={S.ctrlLabel}>Rental price per hour</span>
              <input type="number" step={0.10} min={0} max={20} value={v.gpu_hour_price}
                onChange={e => onChange?.({ ...v, gpu_hour_price: Number(e.target.value) })} style={S.numInput} />
            </label>
          </div>
        </div>
      )}

      {/* Summary */}
      {v.ai_pct > 0 && (
        <div style={S.summary}>
          <div style={S.sumRow}><span>Total AI chips</span><b>{total_gpus.toLocaleString()}</b></div>
          <div style={S.sumRow}><span>Rack count</span><b>{racks_used}</b></div>
          <div style={S.sumRow}><span>Equipment cost</span><b>${(capex_hw / 1e6).toFixed(1)}M</b></div>
          <div style={S.sumRow}><span>AI revenue / yr</span><b>${(revenue_ai / 1e6).toFixed(1)}M</b></div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr 0.8fr',
    gap: 16,
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 8,
    padding: 14,
  },
  col: { display: 'flex', flexDirection: 'column', gap: 10 },
  sectionTitle: {
    fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
    color: 'var(--cp-text-muted)', textTransform: 'uppercase',
  },
  sliderRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  sliderLabel: { fontSize: 11, fontWeight: 600, color: 'var(--cp-text-primary)' },
  sliderRowInner: { display: 'flex', alignItems: 'center', gap: 8 },
  range: { flex: 1, accentColor: 'var(--cp-accent-strong)' },
  pct: { fontSize: 11, fontWeight: 800, color: 'var(--cp-text-primary)', minWidth: 36, textAlign: 'right' },
  mw: { fontSize: 10, color: 'var(--cp-text-muted)', minWidth: 60, textAlign: 'right' },
  gpuCards: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 },
  gpuCard: {
    padding: '8px 10px',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
    cursor: 'pointer',
    textAlign: 'left',
  },
  gpuCardSel: {
    background: 'var(--cp-accent-strong)',
    color: 'var(--cp-text-strong)',
    borderColor: 'var(--cp-accent-strong)',
  },
  gpuSku: { fontSize: 12, fontWeight: 800 },
  gpuMeta: { fontSize: 10, opacity: 0.8, marginTop: 2 },
  gpuPrice: { fontSize: 10, fontWeight: 700, marginTop: 2 },
  aiControls: { display: 'flex', gap: 12, marginTop: 4 },
  ctrlBlock: { display: 'flex', alignItems: 'center', gap: 6, flex: 1 },
  ctrlLabel: { fontSize: 10, color: 'var(--cp-text-muted)', fontWeight: 700 },
  ctrlValue: { fontSize: 11, fontWeight: 700, minWidth: 36 },
  numInput: {
    width: 70, fontSize: 11, padding: '4px 6px',
    border: '1px solid var(--cp-border)', borderRadius: 4,
    background: 'var(--cp-surface-0)', color: 'var(--cp-text-primary)',
  },
  summary: {
    display: 'flex', flexDirection: 'column', gap: 6,
    background: 'var(--cp-surface-0)', borderRadius: 6, padding: '10px 12px',
    border: '1px solid var(--cp-border)',
    alignSelf: 'flex-start',
  },
  sumRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 11, color: 'var(--cp-text-muted)',
  },
};
