// lib/oracle-live/index.js
//
// Sprint 3 — Live Data Architecture public entry point.
//
// Exports the complete oracle-live public API. Agents 2/3/4 override
// getGpuPricingBrief, getEnergyBrief, and getInfrastructureSignals by
// adding gpu-pricing.js, energy.js, and infra-signals.js alongside this
// file. This module gracefully falls back to markUnavailable() if those
// files are not yet present.

export {
  validateLiveDatapoint,
  markUnavailable,
  LIVE_CATEGORIES,
  LIVE_SOURCE_TYPES,
  AVAILABILITY_STATUS,
} from './schema.js';

export { scoreFreshness, scoreVolatility, freshnessTag } from './freshness.js';

export { validateSignal, signalSeverityWeight, SIGNAL_SEVERITIES } from './signals.js';

// ────────────────────────────────────────────────────────────────────────
// GPU Pricing Brief — delegated to Agent 2 (gpu-pricing.js)
// ────────────────────────────────────────────────────────────────────────

/**
 * Returns a GPU pricing brief for the given context.
 * Delegates to ./gpu-pricing.js when available; otherwise returns a clean
 * unavailable datapoint — never a fabricated value.
 *
 * @param {{ region?: string, [key: string]: any }} ctx - Request context.
 * @returns {Promise<Object>} Live datapoint or unavailable marker.
 */
export async function getGpuPricingBrief(ctx) {
  try {
    const mod = await import('./gpu-pricing.js');
    if (typeof mod.getGpuPricingBrief === 'function') {
      return mod.getGpuPricingBrief(ctx);
    }
  } catch (_err) {
    // gpu-pricing.js not yet available — fall through
  }
  const { markUnavailable: mu } = await import('./schema.js');
  return mu('gpu_pricing', ctx?.region || 'global', 'GPU pricing module not yet integrated (pending Agent 2).');
}

// ────────────────────────────────────────────────────────────────────────
// Energy Tariff Brief — delegated to Agent 3 (energy.js)
// ────────────────────────────────────────────────────────────────────────

/**
 * Returns an energy tariff brief for the given context.
 * Delegates to ./energy.js when available; otherwise returns a clean
 * unavailable datapoint — never a fabricated value.
 *
 * @param {{ region?: string, [key: string]: any }} ctx - Request context.
 * @returns {Promise<Object>} Live datapoint or unavailable marker.
 */
export async function getEnergyBrief(ctx) {
  try {
    const mod = await import('./energy.js');
    if (typeof mod.getEnergyBrief === 'function') {
      return mod.getEnergyBrief(ctx);
    }
  } catch (_err) {
    // energy.js not yet available — fall through
  }
  const { markUnavailable: mu } = await import('./schema.js');
  return mu('energy_tariff', ctx?.region || 'global', 'Energy tariff module not yet integrated (pending Agent 3).');
}

// ────────────────────────────────────────────────────────────────────────
// Infrastructure Signals — delegated to Agent 4 (infra-signals.js)
// ────────────────────────────────────────────────────────────────────────

/**
 * Returns a list of live infrastructure signals for the given context.
 * Delegates to ./infra-signals.js when available; otherwise returns an
 * empty array — never fabricated signals.
 *
 * @param {{ region?: string, [key: string]: any }} ctx - Request context.
 * @returns {Promise<Object[]>} Array of signals (may be empty).
 */
export async function getInfrastructureSignals(ctx) {
  try {
    const mod = await import('./infra-signals.js');
    if (typeof mod.getInfrastructureSignals === 'function') {
      return mod.getInfrastructureSignals(ctx);
    }
  } catch (_err) {
    // infra-signals.js not yet available — fall through
  }
  return [];
}

// ────────────────────────────────────────────────────────────────────────
// Live Infrastructure Brief — top-level aggregator
// ────────────────────────────────────────────────────────────────────────

/**
 * Aggregates all live data sources into a single brief object.
 *
 * When sub-modules are not yet wired (Agents 2/3/4 pending), each slot
 * returns a clean unavailable marker or empty list — never fabricated data.
 *
 * @param {{ region?: string, [key: string]: any }} ctx - Request context.
 * @returns {Promise<{
 *   gpu_pricing: Object|null,
 *   energy: Object|null,
 *   signals: Object[],
 *   freshness_summary: string,
 * }>}
 */
export async function getLiveInfrastructureBrief(ctx) {
  const [gpuPricing, energy, signals] = await Promise.all([
    getGpuPricingBrief(ctx).catch(() => null),
    getEnergyBrief(ctx).catch(() => null),
    getInfrastructureSignals(ctx).catch(() => []),
  ]);

  // Determine overall freshness summary
  const allDatapoints = [gpuPricing, energy].filter(Boolean);
  const hasLiveData = allDatapoints.some(
    (dp) => dp && dp.availability_status === 'live' && dp.freshness > 0,
  );
  const hasStaleData = allDatapoints.some(
    (dp) => dp && dp.availability_status === 'stale',
  );

  let freshness_summary;
  if (hasLiveData) {
    freshness_summary = 'live';
  } else if (hasStaleData) {
    freshness_summary = 'stale';
  } else {
    freshness_summary = 'no_live_data';
  }

  return {
    gpu_pricing: gpuPricing,
    energy,
    signals,
    freshness_summary,
  };
}
