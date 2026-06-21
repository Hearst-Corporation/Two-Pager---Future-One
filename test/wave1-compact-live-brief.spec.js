/**
 * test/wave1-compact-live-brief.spec.js
 *
 * AC-D1 : compactLiveBriefForModel(brief) ne contient AUCUNE valeur undefined
 *         (vérification récursive), chaque champ trace vers un champ réel.
 * AC-D2 : gpu_pricing / energy / signals manquants → bloc OMIS proprement.
 */

import { describe, it, expect } from 'vitest';
import { compactLiveBriefForModel } from '../app/api/admin/hearst/strategic-memo/memo-projection.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Recursively check that no value in `obj` is strictly `undefined`.
 * Returns an array of dotted paths where undefined was found.
 *
 * @param {unknown} obj
 * @param {string}  [path]
 * @returns {string[]}
 */
function findUndefinedPaths(obj, path = 'root') {
  if (obj === undefined) return [path];
  if (obj === null || typeof obj !== 'object') return [];
  if (Array.isArray(obj)) {
    return obj.flatMap((item, i) => findUndefinedPaths(item, `${path}[${i}]`));
  }
  return Object.entries(obj).flatMap(([k, v]) =>
    findUndefinedPaths(v, `${path}.${k}`)
  );
}

// ─── Fixtures matching the REAL oracle-live return shapes ─────────────────────

/**
 * Fixture for getGpuPricingBrief — returns an ARRAY of per-SKU objects.
 * Field names match gpu-pricing.js exactly.
 */
const FIXTURE_GPU_PRICING = [
  {
    sku: 'H100',
    prices: [
      {
        provider: 'lambda',
        status: 'live',
        price_usd_hour: 2.49,
        range_low: 2.39,
        range_high: 2.59,
        availability: 'available',
        allocation_risk: 'low',
        last_updated: '2025-06-20T10:00:00Z',
        freshness_hours: 2.5,
        pricing_confidence: 'high',
        notes: 'Lambda on-demand H100',
        raw_excerpt: null,
      },
      {
        provider: 'vast_ai',
        status: 'live',
        price_usd_hour: 2.10,
        range_low: 1.90,
        range_high: 2.30,
        availability: 'available',
        allocation_risk: 'medium',
        last_updated: '2025-06-20T09:00:00Z',
        freshness_hours: 3.0,
        pricing_confidence: 'high',
        notes: 'Vast.ai spot H100',
        raw_excerpt: null,
      },
    ],
    median_price_usd_hour: 2.295,
    range_low: 2.10,
    range_high: 2.49,
    confidence_band: 'high',
    status: 'live',
    static_anchors: [
      {
        source: 'static_anchor',
        datapoint_id: 'lambda_h100_on_demand',
        provider: 'lambda',
        sku: 'H100',
        price_usd_hour: 2.49,
        freshness: '13 months ago',
        confidence: 'high',
        volatility: 'high',
      },
    ],
    region: 'global',
    notes: 'H100 on-demand pricing aggregated across Lambda, Vast.ai, RunPod.',
  },
  {
    sku: 'H200',
    prices: [
      {
        provider: 'lambda',
        status: 'unavailable',
        price_usd_hour: null,
        range_low: null,
        range_high: null,
        availability: 'unknown',
        allocation_risk: 'unknown',
        last_updated: null,
        freshness_hours: null,
        pricing_confidence: 'unavailable',
        notes: 'H200 not listed on Lambda',
        raw_excerpt: null,
      },
    ],
    median_price_usd_hour: null,
    range_low: null,
    range_high: null,
    confidence_band: 'no_live_data',
    status: 'unavailable',
    static_anchors: [],
    region: 'global',
    notes: 'H200 supply-constrained SKU.',
  },
];

/**
 * Fixture for getEnergyBrief — returns an EnergyRegion object.
 * Field names match energy.js exactly.
 */
const FIXTURE_ENERGY = {
  region: 'qatar',
  label: 'Qatar',
  electricity_tariff_industrial_usd_mwh: {
    value: 42,
    range_low: 38,
    range_high: 48,
    confidence: 'high',
    volatility: 'low',
    source_datapoint_id: 'kahramaa_tariff_industrial',
  },
  electricity_tariff_data_center_usd_mwh: {
    value: 45,
    range_low: 40,
    range_high: 55,
    confidence: 'medium',
    volatility: 'low',
    source: 'consultant_estimate',
  },
  cooling_sensitivity: 'high',
  water_stress_index: 4.7,
  grid_dependency: 'monopoly_state',
  renewable_share_pct: { value: 0.05, target_2030: null, source: 'utility_disclosure' },
  energy_volatility: 'low',
  source_confidence: 'high',
  reality_constraints: [
    'Water permits for evaporative cooling typically 9 months in GCC.',
    'KAHRAMAA monopoly means no PPA arbitrage.',
  ],
  static_anchors: ['kahramaa_tariff_industrial', 'kahramaa_grid_capacity'],
  implications: [
    'Water stress (4.7/5) amplifies cooling capex by ~20% vs temperate markets.',
    'KAHRAMAA monopoly eliminates PPA arbitrage; plan for 3-5%/yr tariff creep.',
    'Grid connection lead time (24 months) is the primary build-path constraint.',
  ],
};

/**
 * Fixture for getInfrastructureSignals — returns a FLAT Array of signal objects.
 * Field names match infra-signals.js exactly.
 */
const FIXTURE_SIGNALS = [
  {
    id: 'transformer_shortage_global',
    title: '22-month transformer lead time drives critical path on every GCC DC build',
    severity: 'high',
    category: 'supply_chain',
    region: 'global',
    affected_archetypes: ['powered_shell', 'neocloud_gpu'],
    affected_regions: ['qatar', 'uae', 'saudi_arabia'],
    explanation: 'Schneider/Siemens 2024 guidance confirms 50 MVA transformer lead times at 22 months.',
    implication: 'A Qatar project breaking ground in H2 2025 without a transformer on order today risks energisation slipping to late 2027.',
    confidence: 'high',
    freshness: '2024-12-01',
    recommended_action: 'Issue transformer LoI before land/permit finalisation.',
    impact_score: 9,
    timeline_horizon: 'now',
    mitigation_hint: 'Lock a slot with a secondary supplier in parallel.',
  },
  {
    id: 'brookfield_qia_partnership_unlock',
    title: 'QIA-Brookfield $20B AI infra partnership',
    severity: 'high',
    category: 'capital_availability',
    region: 'qatar',
    affected_archetypes: ['powered_shell', 'branded_jv'],
    affected_regions: ['qatar'],
    explanation: 'QIA and Brookfield announced a $20B AI infrastructure partnership.',
    implication: 'A Qatar powered-shell with a signed hyperscaler is immediately financeable via QIA-Brookfield.',
    confidence: 'high',
    freshness: '2024-05-01',
    recommended_action: 'Prepare a data room with QFZA entity structure.',
    impact_score: 9,
    timeline_horizon: '3-6mo',
    mitigation_hint: 'Structure as plain-vanilla NNN powered-shell first.',
  },
];

// ─── Full brief fixture ───────────────────────────────────────────────────────

const FULL_BRIEF = {
  gpu_pricing: FIXTURE_GPU_PRICING,
  energy: FIXTURE_ENERGY,
  signals: FIXTURE_SIGNALS,
};

// ─── AC-D1 tests ─────────────────────────────────────────────────────────────

describe('compactLiveBriefForModel — AC-D1: no undefined values, real fields only', () => {
  it('returns an object (not null/undefined) from a full brief', () => {
    const result = compactLiveBriefForModel(FULL_BRIEF);
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(typeof result).toBe('object');
  });

  it('contains ZERO undefined values (recursive check)', () => {
    const result = compactLiveBriefForModel(FULL_BRIEF);
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
  });

  it('gpu_pricing is an array of SKU summaries derived from real fields', () => {
    const result = compactLiveBriefForModel(FULL_BRIEF);
    expect(Array.isArray(result.gpu_pricing)).toBe(true);
    const h100 = result.gpu_pricing[0];
    // sku traces to skuBrief.sku
    expect(h100.sku).toBe('H100');
    // median_observed derived from median_price_usd_hour (real field)
    expect(h100.median_observed).toMatch(/\$2\.295\/hr/);
    // freshness_tag derived from status (real field), never a phantom key
    expect(['FRESH', 'OK', 'STALE', 'NO_LIVE_DATA']).toContain(h100.freshness_tag);
    // H100 is live → FRESH
    expect(h100.freshness_tag).toBe('FRESH');
    // confidence_band traces to skuBrief.confidence_band
    expect(h100.confidence_band).toBe('high');
  });

  it('gpu_pricing price rows use real field names (price_usd_hour not price_usd_hr, no phantom sku)', () => {
    const result = compactLiveBriefForModel(FULL_BRIEF);
    const h100 = result.gpu_pricing[0];
    expect(Array.isArray(h100.prices)).toBe(true);
    const priceRow = h100.prices[0];
    // Real field name
    expect(priceRow).toHaveProperty('price_usd_hour');
    // Phantom fields must NOT exist
    expect(priceRow).not.toHaveProperty('price_usd_hr');
    expect(priceRow).not.toHaveProperty('sku');
    // freshness_tag derived, present
    expect(priceRow).toHaveProperty('freshness_tag');
    expect(['FRESH', 'OK', 'STALE', 'NO_LIVE_DATA']).toContain(priceRow.freshness_tag);
  });

  it('energy.tariff_used is derived from electricity_tariff_industrial_usd_mwh.value (real field)', () => {
    const result = compactLiveBriefForModel(FULL_BRIEF);
    expect(result.energy).toBeDefined();
    // tariff_used is derived from the real value field
    expect(result.energy.tariff_used).toMatch(/\$42\/MWh/);
    // Phantom keys must NOT exist
    expect(result.energy).not.toHaveProperty('summary_phantom');
    // summary is derived, not a phantom read
    expect(result.energy.summary).toContain('Qatar');
    expect(result.energy.summary).toContain('42');
  });

  it('energy.freshness_tag derived from source_confidence (real field), not a phantom key', () => {
    const result = compactLiveBriefForModel(FULL_BRIEF);
    // Qatar has source_confidence: 'high' → 'OK'
    expect(result.energy.freshness_tag).toBe('OK');
  });

  it('signals is a flat array taken directly from brief.signals (no phantom .signals.signals)', () => {
    const result = compactLiveBriefForModel(FULL_BRIEF);
    expect(Array.isArray(result.signals)).toBe(true);
    expect(result.signals.length).toBe(2);
    expect(result.signals[0].id).toBe('transformer_shortage_global');
    // Verify real fields present
    expect(result.signals[0]).toHaveProperty('id');
    expect(result.signals[0]).toHaveProperty('title');
    expect(result.signals[0]).toHaveProperty('severity');
    expect(result.signals[0]).toHaveProperty('implication');
  });

  it('handles gpu_pricing SKU with no live data: median_observed is null, freshness_tag is NO_LIVE_DATA', () => {
    const result = compactLiveBriefForModel(FULL_BRIEF);
    const h200 = result.gpu_pricing[1];
    expect(h200.sku).toBe('H200');
    expect(h200.median_observed).toBeNull();
    expect(h200.freshness_tag).toBe('NO_LIVE_DATA');
  });

  it('no phantom key brief.gpu_pricing.summary read (summary is derived, not read)', () => {
    // The whole point: if we had read brief.gpu_pricing.summary on an array, it would be undefined.
    // With the new code we derive it. Verify the fixture array has no .summary property.
    expect(FIXTURE_GPU_PRICING.summary).toBeUndefined();
    // But the compact output has a per-SKU summary derived from real data
    const result = compactLiveBriefForModel(FULL_BRIEF);
    expect(result.gpu_pricing[0].summary).toBeDefined();
    expect(typeof result.gpu_pricing[0].summary).toBe('string');
    expect(result.gpu_pricing[0].summary.length).toBeGreaterThan(0);
  });

  it('no phantom key brief.energy.summary (summary is derived)', () => {
    // The old code read brief.energy.summary which does not exist on EnergyRegion
    expect(FIXTURE_ENERGY.summary).toBeUndefined();
    // New code derives it
    const result = compactLiveBriefForModel(FULL_BRIEF);
    expect(result.energy.summary).toBeDefined();
    expect(typeof result.energy.summary).toBe('string');
  });

  it('no phantom key brief.signals.signals (signals is already a flat array)', () => {
    // Old code: (brief.signals?.signals || brief.signals || [])
    // If brief.signals is an array, .signals property is undefined → fallback works accidentally
    // but the new code eliminates the phantom read entirely
    expect(FIXTURE_SIGNALS.signals).toBeUndefined();
    const result = compactLiveBriefForModel(FULL_BRIEF);
    expect(Array.isArray(result.signals)).toBe(true);
  });
});

// ─── AC-D2 tests ─────────────────────────────────────────────────────────────

describe('compactLiveBriefForModel — AC-D2: missing blocks omitted cleanly', () => {
  it('omits gpu_pricing block when null', () => {
    const result = compactLiveBriefForModel({ gpu_pricing: null, energy: FIXTURE_ENERGY, signals: FIXTURE_SIGNALS });
    expect(result).not.toHaveProperty('gpu_pricing');
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
  });

  it('omits gpu_pricing block when empty array', () => {
    const result = compactLiveBriefForModel({ gpu_pricing: [], energy: FIXTURE_ENERGY, signals: FIXTURE_SIGNALS });
    expect(result).not.toHaveProperty('gpu_pricing');
  });

  it('omits energy block when null', () => {
    const result = compactLiveBriefForModel({ gpu_pricing: FIXTURE_GPU_PRICING, energy: null, signals: FIXTURE_SIGNALS });
    expect(result).not.toHaveProperty('energy');
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
  });

  it('omits energy block when object has no .region (not a real EnergyRegion)', () => {
    const result = compactLiveBriefForModel({ gpu_pricing: FIXTURE_GPU_PRICING, energy: { arbitrary: 'junk' }, signals: FIXTURE_SIGNALS });
    expect(result).not.toHaveProperty('energy');
  });

  it('omits signals block when empty array', () => {
    const result = compactLiveBriefForModel({ gpu_pricing: FIXTURE_GPU_PRICING, energy: FIXTURE_ENERGY, signals: [] });
    expect(result).not.toHaveProperty('signals');
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
  });

  it('returns empty object when all three blocks are absent/empty', () => {
    const result = compactLiveBriefForModel({ gpu_pricing: null, energy: null, signals: [] });
    expect(result).toEqual({});
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
  });

  it('returns null unchanged when brief is null', () => {
    const result = compactLiveBriefForModel(null);
    expect(result).toBeNull();
  });

  it('returns undefined unchanged when brief is undefined', () => {
    const result = compactLiveBriefForModel(undefined);
    expect(result).toBeUndefined();
  });

  it('sparse signal {id only} → no undefined value, no "undefined" string in output', () => {
    const result = compactLiveBriefForModel({ gpu_pricing: null, energy: null, signals: [{ id: 's1' }] });
    expect(result).toHaveProperty('signals');
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('"undefined"');
    // id preserved, missing fields coerced to null
    expect(result.signals[0].id).toBe('s1');
    expect(result.signals[0].title).toBeNull();
    expect(result.signals[0].severity).toBeNull();
    expect(result.signals[0].implication).toBeNull();
  });

  it('sparse gpu price row {sku, status:undefined} → no undefined value, no "undefined" string', () => {
    const sparseGpu = [{
      sku: 'X',
      median_price_usd_hour: null,
      status: undefined,
      prices: [{ sku: 'X', median_price_usd_hour: null, status: undefined, prices: null }],
    }];
    const result = compactLiveBriefForModel({ gpu_pricing: sparseGpu, energy: null, signals: [] });
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('"undefined"');
    // confidence: undefined in summary must not appear
    expect(serialized).not.toContain('confidence: undefined');
  });

  it('gpu SKU with missing confidence_band → summary contains "confidence: ?" not "confidence: undefined"', () => {
    const gpuNoBand = [{
      sku: 'A100',
      median_price_usd_hour: 1.5,
      status: 'live',
      prices: [],
      // confidence_band absent
    }];
    const result = compactLiveBriefForModel({ gpu_pricing: gpuNoBand, energy: null, signals: [] });
    expect(result.gpu_pricing[0].summary).toContain('confidence: ?');
    expect(result.gpu_pricing[0].summary).not.toContain('confidence: undefined');
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
  });

  it('zero undefined values when only signals are present', () => {
    const result = compactLiveBriefForModel({ gpu_pricing: null, energy: null, signals: FIXTURE_SIGNALS });
    expect(result).not.toHaveProperty('gpu_pricing');
    expect(result).not.toHaveProperty('energy');
    expect(Array.isArray(result.signals)).toBe(true);
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
  });

  it('zero undefined values on full brief (final integration check)', () => {
    const result = compactLiveBriefForModel(FULL_BRIEF);
    const undefinedPaths = findUndefinedPaths(result);
    expect(undefinedPaths).toEqual([]);
  });
});
