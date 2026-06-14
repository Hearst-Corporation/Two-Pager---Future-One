/**
 * lib/constants.ts — Single source of truth for all magic numbers and
 * config values that were previously scattered across lib/*.js files.
 *
 * Categories:
 *   LLM         — model identifiers, token budgets, timeouts
 *   CALCULATION — financial engine magic numbers
 *   SCRAPER     — external-provider fetch timeouts / cache TTL
 *   RATE_LIMIT  — API route rate-limiting windows
 */

// ─────────────────────────────────────────────────────────────────────────────
// LLM — model names & latency budgets
// ─────────────────────────────────────────────────────────────────────────────

/** Model used for the cockpit chat rail (streaming). */
export const LLM_CHAT_MODEL = "gpt-4o" as const;

/** Model used for strategic memo generation (JSON structured output). */
export const LLM_MEMO_MODEL = "gpt-4.1" as const;

/** Fallback model cascade for memo generation when primary fails. */
export const LLM_MEMO_CASCADE = [LLM_MEMO_MODEL] as const satisfies readonly string[];

/**
 * Hard client-side abort timeout for the memo fetch (ms).
 * Matched to the Vercel `maxDuration = 300` cap on the route.
 */
export const MEMO_CLIENT_TIMEOUT_MS = 300_000 as const;

/**
 * Soft server-side timeout before falling back to a deterministic memo (ms).
 * Shorter than the Vercel cap so we can still return a graceful response.
 */
export const MEMO_LLM_SOFT_TIMEOUT_MS = 90_000 as const;

/** Default OpenAI SDK network timeout (ms). Env override: LLM_MODEL_TIMEOUT_MS. */
export const LLM_SDK_TIMEOUT_MS = 300_000 as const;

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATION — financial engine & projection constants
// ─────────────────────────────────────────────────────────────────────────────

/** Hours in a standard non-leap year — used in energy cost & GPU revenue formulae. */
export const HOURS_PER_YEAR = 8_760 as const;

/** kW per MW — used in occupied-kW formula. */
export const KW_PER_MW = 1_000 as const;

/**
 * Maintenance capex as a fraction of annual revenue.
 * Source: CBRE H1 2025 — operator O&M typically 1.5–2.5% for stabilised DCs.
 */
export const MAINTENANCE_CAPEX_RATIO = 0.02 as const;

/**
 * Median industry capex benchmark ($/MW) used for reconciliation warnings.
 * Derived from: CBRE MENA $7.5M, Equinix ~$8.5M, CoreWeave-class ~$8.8M,
 * hyperscaler-spec ~$11M (see source-library.js).
 */
export const CAPEX_BENCHMARK_PER_MW = 8_850_000 as const;

/**
 * Acceptable deviation from CAPEX_BENCHMARK_PER_MW before a reconciliation
 * warning is surfaced (±15%).
 */
export const CAPEX_RECONCILE_TOLERANCE = 0.15 as const;

/**
 * Occupancy threshold (%) at which a project is considered "stabilised".
 * Used to pin the stabilised EBITDA/revenue/DSCR rows in projections.
 */
export const OCCUPANCY_STABILIZATION_PCT = 80 as const;

/**
 * Default occupancy ramp curve (fractional multipliers for years 0–10).
 * Applied as: actual_occupancy = ramp[year] × (target_occupancy_pct / 90).
 */
export const OCCUPANCY_RAMP = [
  0, 0.25, 0.45, 0.60, 0.70, 0.78, 0.84, 0.88, 0.91, 0.93, 0.95,
] as const satisfies readonly number[];

// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER — oracle-live provider timeouts & GPU pricing cache
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch abort timeout for external GPU-cloud pricing scrapers (ms). */
export const SCRAPER_TIMEOUT_MS = 8_000 as const;

/** In-memory cache TTL for GPU pricing data (ms). */
export const GPU_PRICING_CACHE_TTL_MS = 3_600_000; // 1 hour in ms

// ─────────────────────────────────────────────────────────────────────────────
// RATE_LIMIT — strategic-memo API route
// ─────────────────────────────────────────────────────────────────────────────

/** Rolling window for memo rate-limiting (ms). */
export const RATE_LIMIT_WINDOW_MS = 60_000 as const;

/** Max memo requests per actor per RATE_LIMIT_WINDOW_MS in production. */
export const RATE_LIMIT_MAX_REQUESTS = 5 as const;
