// Helpers extracted from route.js.
//
// Next.js App Router forbids non-handler exports from a `route.js` file
// (only GET/POST/… and route config like `maxDuration` are valid exports —
// anything else fails the production build with "is not a valid Route export
// field"). These two pure functions are imported both by the route and by the
// test suite, so they live in this sibling module instead.

import { generateProjection, foldGpuRevenue } from '@/lib/hearst-calculations';
import { DEAL_ARCHETYPES, projectArchetype } from '@/lib/hearst-deal-structures';
import { FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';

// Same archetype lookup the /simulate route uses (keeps the memo recompute
// deterministically aligned with what generated the on-screen numbers).
const ARCHETYPE_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));

/**
 * Resolve the engine-authoritative ("truth") projection for the memo, ARCHETYPE-AWARE.
 *
 * Why this exists (P0 coherence bug):
 *   Most archetypes are modelled by re-running generateProjection() on the
 *   post-archetype scenario — recomputing it server-side here is correct and
 *   anti-tampering. BUT `sale_leaseback` (compute_as: 'one_time_sale') does NOT
 *   project a 10-year HOLD: projectArchetype() builds a developer-SALE model
 *   (exit at dev_exit_year ≈ 4, sale_proceeds = stabilized_ebitda / sale_yield,
 *   levered equity cash flows, Qatar capital-gains tax) and returns a projection
 *   with `sale_mode: true`. A blind generateProjection(scenario) here would
 *   OVERWRITE that with a hold projection — the memo would then pin HOLD
 *   IRR/MOIC/NPV/payback/TV while the screen shows the SALE. The document lies.
 *
 * Resolution rules:
 *   1. SALE path — archetype.compute_as === 'one_time_sale' (or, defensively,
 *      payload.projection.sale_mode === true) AND the archetype is resolvable
 *      server-side from payload.archetype_outcome.id:
 *        → recompute via projectArchetype(scenario, archetype), which reproduces
 *          the SALE model deterministically (same code path as /simulate). Use
 *          ITS projection as truth. We do NOT call generateProjection / foldGpuRevenue
 *          here (sale_mode carries no recurring GPU/colo revenue).
 *   2. SALE fallback — payload.projection.sale_mode === true but the archetype is
 *      NOT resolvable server-side (no id in payload): reuse payload.projection
 *      verbatim instead of recomputing, so the memo still matches the screen
 *      rather than silently reverting to a hold model.
 *   3. STANDARD path — every other archetype: recompute generateProjection(scenario)
 *      then fold GPU revenue when hardware_breakdown is present (the existing,
 *      correct behaviour for gpu_cloud / minority_equity / recurring_revenue).
 *      Unchanged.
 *
 * @param {object} payload - the /simulate result snapshot (scenario, projection,
 *   archetype_outcome, hardware_breakdown, …).
 * @returns {{ projection: object|null, mode: 'sale_recompute'|'sale_fallback'|'standard_recompute'|'client_projection', recomputeError: string|null }}
 */
export function resolveTruthProjection(payload) {
  const scenario = payload?.scenario || null;
  const clientProjection = payload?.projection || null;
  const archetype = ARCHETYPE_BY_ID[payload?.archetype_outcome?.id] || null;
  const isOneTimeSale =
    archetype?.compute_as === 'one_time_sale' ||
    payload?.archetype_outcome?.compute_as === 'one_time_sale' ||
    clientProjection?.sale_mode === true;

  // ── SALE path (sale_leaseback / one_time_sale / any sale_mode projection) ──
  if (isOneTimeSale) {
    if (scenario && archetype) {
      try {
        // projectArchetype reproduces the developer-sale model deterministically,
        // identical to /simulate. Its projection (sale_mode:true, payback≈dev_exit)
        // is the SAME object the screen rendered.
        const ar = projectArchetype(scenario, archetype);
        if (ar?.projection) {
          return { projection: ar.projection, mode: 'sale_recompute', recomputeError: null };
        }
      } catch (e) {
        // Fall through to the fallback below — never throw out of the resolver.
        if (clientProjection?.sale_mode === true) {
          return { projection: clientProjection, mode: 'sale_fallback', recomputeError: e?.message || 'projectArchetype failed' };
        }
        return { projection: clientProjection, mode: 'client_projection', recomputeError: e?.message || 'projectArchetype failed' };
      }
    }
    // Documented FALLBACK: scenario or archetype not recoverable server-side, but
    // the client projection IS a sale. Reuse it rather than recomputing a HOLD —
    // this keeps the memo matching the screen. (A standard generateProjection here
    // would produce a 10-year hold and re-introduce the divergence.)
    if (clientProjection?.sale_mode === true) {
      return { projection: clientProjection, mode: 'sale_fallback', recomputeError: null };
    }
    // No scenario AND no sale projection to fall back on — nothing to resolve.
    return { projection: clientProjection, mode: 'client_projection', recomputeError: null };
  }

  // ── STANDARD path (unchanged) — recompute hold projection + fold GPU revenue ──
  if (scenario) {
    try {
      const serverProjection = generateProjection(scenario);
      const hb = payload?.hardware_breakdown;
      if (serverProjection?.years?.length && hb && ((hb.revenue_ai_annual > 0) || (hb.capex_hardware > 0))) {
        foldGpuRevenue(serverProjection, hb, scenario, {
          rfs_year: scenario.phase1_complete_year || 3, ramp_years: 2,
          exit_year: scenario.exit_year || 10,
          discount_rate_pct: scenario.discount_rate_pct ?? FINANCIAL_THRESHOLDS.discount_rate_pct,
        });
      }
      if (serverProjection && serverProjection.years?.length) {
        return { projection: serverProjection, mode: 'standard_recompute', recomputeError: null };
      }
    } catch (e) {
      return { projection: clientProjection, mode: 'client_projection', recomputeError: e?.message || 'generateProjection failed' };
    }
  }
  return { projection: clientProjection, mode: 'client_projection', recomputeError: null };
}

/**
 * Derive a human-readable freshness tag from a provider pricing record.
 * Uses `freshness_hours` when available; falls back to `status`.
 *
 * @param {{ status: string, freshness_hours: number|null }} priceRecord
 * @returns {'FRESH'|'OK'|'STALE'|'NO_LIVE_DATA'}
 */
function _derivePriceFreshnessTag(priceRecord) {
  if (!priceRecord) return 'NO_LIVE_DATA';
  if (priceRecord.freshness_hours != null) {
    if (priceRecord.freshness_hours < 4)   return 'FRESH';
    if (priceRecord.freshness_hours < 24)  return 'OK';
    return 'STALE';
  }
  if (priceRecord.status === 'live')    return 'FRESH';
  if (priceRecord.status === 'stale')   return 'STALE';
  return 'NO_LIVE_DATA';
}

/**
 * Compact the live brief into a lean shape for the LLM.
 * Only reads fields that actually exist in the real oracle-live return values:
 *   - gpu_pricing  → Array of per-SKU objects (median_price_usd_hour, confidence_band, status, prices[])
 *   - energy       → EnergyRegion object (electricity_tariff_industrial_usd_mwh.value, source_confidence, label)
 *   - signals      → flat Array of signal objects (id, title, severity, implication)
 *
 * No ghost keys, no fabricated freshness. Missing blocks are omitted entirely.
 *
 * @param {{ gpu_pricing: Array|null, energy: Object|null, signals: Array }} brief
 * @returns {Object}
 */
export function compactLiveBriefForModel(brief) {
  if (!brief) return brief;
  const out = {};

  // ── gpu_pricing ──────────────────────────────────────────────────────────
  // Real shape: Array<{ sku, median_price_usd_hour, range_low, range_high,
  //   confidence_band, status, notes, prices[], static_anchors[], region }>
  // We expose the first 3 SKUs, each with their top-4 live price rows.
  const gpuArray = Array.isArray(brief.gpu_pricing) ? brief.gpu_pricing : null;
  if (gpuArray && gpuArray.length > 0) {
    out.gpu_pricing = gpuArray.slice(0, 3).map(skuBrief => {
      // Derive overall freshness tag from aggregate status / confidence_band
      let freshness_tag;
      if (skuBrief.status === 'live')         freshness_tag = 'FRESH';
      else if (skuBrief.status === 'partial_live') freshness_tag = 'OK';
      else if (skuBrief.status === 'stale')   freshness_tag = 'STALE';
      else                                     freshness_tag = 'NO_LIVE_DATA';

      // Derive median_observed from real field (null when no live data)
      const medianRaw = skuBrief.median_price_usd_hour;
      const median_observed = medianRaw != null ? `$${medianRaw}/hr` : null;

      // Build summary from real fields, never invent figures
      const livePriceCount = (skuBrief.prices || []).filter(
        p => p.status === 'live' || p.status === 'partial_live'
      ).length;
      const summary = median_observed
        ? `${skuBrief.sku} median $${medianRaw}/hr across ${livePriceCount} live provider(s); confidence: ${skuBrief.confidence_band ?? '?'}`
        : `${skuBrief.sku} — no live pricing data; confidence: ${skuBrief.confidence_band ?? '?'}`;

      return {
        sku: skuBrief.sku,
        summary,
        freshness_tag,
        median_observed,
        confidence_band: skuBrief.confidence_band ?? null,
        range_low: skuBrief.range_low ?? null,
        range_high: skuBrief.range_high ?? null,
        // Top-4 provider price rows — real fields only
        prices: (skuBrief.prices || []).slice(0, 4).map(p => ({
          provider: p.provider ?? null,
          status: p.status ?? null,
          price_usd_hour: p.price_usd_hour ?? null,
          freshness_tag: _derivePriceFreshnessTag(p),
        })),
        notes: skuBrief.notes ?? null,
      };
    });
  }

  // ── energy ───────────────────────────────────────────────────────────────
  // Real shape: EnergyRegion { label, region, electricity_tariff_industrial_usd_mwh: { value, range_low/high, confidence },
  //   source_confidence, cooling_sensitivity, water_stress_index, implications[], ... }
  if (brief.energy && typeof brief.energy === 'object' && brief.energy.region) {
    const e = brief.energy;
    const tariffSpec = e.electricity_tariff_industrial_usd_mwh;
    const tariffValue = tariffSpec?.value ?? null;
    const tariff_used = tariffValue != null
      ? `$${tariffValue}/MWh (range $${tariffSpec.range_low ?? '?'}–$${tariffSpec.range_high ?? '?'}/MWh, confidence: ${tariffSpec.confidence ?? '?'})`
      : null;

    // Derive freshness tag from source_confidence (energy is static — no live scraping)
    let freshness_tag;
    if (e.source_confidence === 'high')   freshness_tag = 'OK';
    else if (e.source_confidence === 'medium') freshness_tag = 'STALE';
    else                                        freshness_tag = 'NO_LIVE_DATA';

    const summary = tariff_used
      ? `${e.label} industrial electricity ${tariff_used}; cooling sensitivity: ${e.cooling_sensitivity ?? '?'}; water stress: ${e.water_stress_index ?? '?'}/5`
      : `${e.label} — tariff data unavailable`;

    out.energy = {
      region: e.region,
      label: e.label,
      summary,
      tariff_used,
      freshness_tag,
      source_confidence: e.source_confidence ?? null,
      cooling_sensitivity: e.cooling_sensitivity ?? null,
      water_stress_index: e.water_stress_index ?? null,
      // Top-3 decisional implications derived from archetype/reality constraints
      implications: (e.implications || []).slice(0, 3),
    };
  }

  // ── signals ──────────────────────────────────────────────────────────────
  // Real shape: flat Array<{ id, title, severity, category, explanation,
  //   implication, confidence, freshness, recommended_action, impact_score, ... }>
  // (no nested .signals property — the array IS the signals list)
  const signalArray = Array.isArray(brief.signals) ? brief.signals : [];
  if (signalArray.length > 0) {
    out.signals = signalArray.slice(0, 5).map(s => ({
      id: s.id ?? null,
      title: s.title ?? null,
      severity: s.severity ?? null,
      implication: s.implication ?? null,
    }));
  }

  return out;
}
