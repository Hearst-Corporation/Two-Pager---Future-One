// lib/dossier-derive.js
//
// Decision Canvas derivation layer — PURE, DISPLAY-ONLY helpers.
//
// These functions read values that were ALREADY computed by the financial
// engine + memo generator (memo_json._exec_projection, key_financial_metrics,
// risks_constraints, deployment_roadmap, confidence_block, data_freshness) and
// shape them for a decision-first render.
//
// They DO NOT recompute IRR/MOIC/NPV or touch the financial engine, the memo
// provider, or the approval API. No numbers are invented — when a value is
// absent we return null so the UI can show an honest "Not available" placeholder.

import { FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';
import { resolveCitationsInText } from '@/lib/citation-resolver';
import {
  fmtUSD as coreUsd,
  fmtPctFromRatio as corePctRatio,
  fmtPctRaw as corePctRaw,
  fmtX as coreX,
  fmtYears as coreYears,
} from '@/lib/hearst-format';

// ─── number / format helpers ──────────────────────────────────────────────

function num(v) {
  if (v == null) return null;
  const n = typeof v === 'string' ? parseFloat(v.replace(/[^0-9.+-]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : null;
}

// These formatters now DELEGATE to lib/hearst-format (the single formatter
// layer) so the Dossier / Memo / persisted key_financial_metrics render with the
// exact same glyph, rounding and tiers as Results / Financial / PDF (audit P0-2).
// They keep the null-return contract (not the "—" token) so the deriveKpis
// `value || rawFor(...)` fallback chain still works, and keep num() parsing so a
// stringified KFM value ("$286M") still formats.

/** Format an absolute USD figure ($440,000,000 → "$440.0M", 1.18e9 → "$1.18B"). */
export function fmtUsd(v) {
  const n = num(v);
  return n == null ? null : coreUsd(n);
}

/** Format a fraction (0.182 → "18.2%"). Pass isFraction=false for already-% values. */
export function fmtPct(v, isFraction = true) {
  const n = num(v);
  if (n == null) return null;
  return isFraction ? corePctRatio(n) : corePctRaw(n);
}

export function fmtX(v) {
  const n = num(v);
  return n == null ? null : coreX(n);
}

export function fmtYears(v) {
  const n = num(v);
  return n == null ? null : coreYears(n);
}

const SEV = (s) => {
  const u = (s || '').toUpperCase();
  if (u === 'MEDIUM') return 'MED';
  return u || 'MED';
};

// ─── verdict ───────────────────────────────────────────────────────────────
//
// Synthesizes a board-level verdict from signals that already exist in the
// memo: return metrics, risk severity, reality-check flags, data freshness and
// source confidence. The `drivers` array makes the verdict auditable — the UI
// shows exactly why this verdict was assigned. This is a transparent read of
// existing data, NOT a financial recomputation.

const VERDICTS = {
  PROCEED:                 { label: 'PROCEED',                 tone: 'success' },
  PROCEED_WITH_CONDITIONS: { label: 'PROCEED WITH CONDITIONS', tone: 'warning' },
  REVIEW:                  { label: 'REVIEW',                  tone: 'warning' },
  REJECT:                  { label: 'REJECT',                  tone: 'danger'  },
  INSUFFICIENT_DATA:       { label: 'INSUFFICIENT DATA',       tone: 'neutral' },
};

// ─── financial gate constants ─────────────────────────────────────────────
const HURDLE_IRR    = FINANCIAL_THRESHOLDS.discount_rate_pct / 100;   // NPV is discounted at the WACC/discount rate — IRR below this is NPV-negative
const MIN_MOIC      = 1.0;    // below 1× = capital destruction
const DSCR_COVENANT = FINANCIAL_THRESHOLDS.dscr_breach_threshold;   // matches generateDebtSchedule breach threshold

export function deriveVerdict(memo) {
  const m = memo || {};
  const proj = m._exec_projection || {};
  const fin = m.key_financial_metrics?.metrics || [];
  const risks = m.risks_constraints?.items || [];
  const flags = m.deployment_roadmap?.reality_check_flags || [];
  const conf = (m.confidence_block?.confidence_level || '').toUpperCase();
  const fresh = (m.data_freshness?.overall_status || '').toUpperCase();
  const headline = m.executive_summary?.headline || '';

  // P0-2: the board-facing verdict gates on POST-TAX returns (the numbers the IC
  // actually sees), falling back to pre-tax only for projections predating the tax
  // layer. Pre-tax stays available on the projection for transparency.
  const irr     = num(proj.irr_post_tax ?? proj.irr);
  const moic    = num(proj.moic_post_tax ?? proj.moic);
  const npv     = num(proj.npv_post_tax ?? proj.npv);
  const payback = num(proj.payback_years);
  const dscr    = num(proj.dscr_stabilized);

  const hasCoreReturns = [proj.irr_post_tax ?? proj.irr, proj.moic_post_tax ?? proj.moic, proj.npv_post_tax ?? proj.npv].some(v => v != null);
  const hasFin = hasCoreReturns || fin.length > 0;

  const highRisks = risks.filter(r => SEV(r.severity) === 'HIGH');
  const drivers = [];
  if (highRisks.length) drivers.push(`${highRisks.length} high-severity risk${highRisks.length > 1 ? 's' : ''}`);
  if (flags.length) drivers.push(`${flags.length} reality-check flag${flags.length > 1 ? 's' : ''}`);
  if (fresh === 'EXPIRED' || fresh === 'STALE') {
    const asOf = m.data_freshness?.data_as_of;
    drivers.push(`data ${fresh.toLowerCase()}${asOf ? ` (as of ${asOf})` : ''}`);
  }
  if (conf === 'LOW') drivers.push('low source confidence');

  // ── Gate 1: INSUFFICIENT_DATA ─────────────────────────────────────────────
  if (!hasFin) {
    return { ...VERDICTS.INSUFFICIENT_DATA, key: 'INSUFFICIENT_DATA', drivers: ['No financial projection attached to this memo version'] };
  }
  // Also insufficient when all three core return metrics are absent (cannot evaluate)
  if (irr == null && moic == null && npv == null) {
    return { ...VERDICTS.INSUFFICIENT_DATA, key: 'INSUFFICIENT_DATA', drivers: ['IRR, MOIC and NPV all absent — cannot evaluate'] };
  }

  // ── Gate 2: REJECT — capital destruction ─────────────────────────────────
  const isCapitalDestruction = (irr != null && irr < 0) || (moic != null && moic < MIN_MOIC);
  if (isCapitalDestruction) {
    return {
      ...VERDICTS.REJECT,
      key: 'REJECT',
      drivers: drivers.length ? drivers : ['Returns below 1.0× / negative IRR — capital destruction'],
    };
  }

  // ── Gate 3: REVIEW — returns capital but fails hurdle / coverage / timing ─
  const reviewDrivers = [];
  if (npv != null && npv < 0)                  reviewDrivers.push(`NPV below 0 at ${HURDLE_IRR * 100}% hurdle`);
  if (payback == null)                          reviewDrivers.push('no payback within horizon');
  if (dscr != null && dscr < DSCR_COVENANT)    reviewDrivers.push(`DSCR ${dscr} < ${DSCR_COVENANT}`);

  if (reviewDrivers.length > 0) {
    return {
      ...VERDICTS.REVIEW,
      key: 'REVIEW',
      drivers: reviewDrivers,
    };
  }

  // ── Gate 4: PROCEED_WITH_CONDITIONS ──────────────────────────────────────
  const conditional = /\b(if|provided|contingent|subject to|once|before|conditional|pending)\b/i.test(headline);
  const hasConditions = highRisks.length > 0 || flags.length > 0 || conditional || fresh === 'EXPIRED' || fresh === 'STALE' || conf === 'LOW';

  if (hasConditions) {
    return {
      ...VERDICTS.PROCEED_WITH_CONDITIONS,
      key: 'PROCEED_WITH_CONDITIONS',
      drivers: drivers.length ? drivers : ['Returns positive · conditions apply before commit'],
    };
  }

  // ── Gate 5: PROCEED ───────────────────────────────────────────────────────
  return { ...VERDICTS.PROCEED, key: 'PROCEED', drivers: ['Returns positive · no blocking risks or flags'] };
}

// ─── opportunity category ────────────────────────────────────────────────

const CATEGORY_RULES = [
  { cat: 'Powered Shell',        re: /powered[\s-]?shell|powered shell|tenant-owned|\bnnn\b/ },
  { cat: 'AI Factory',           re: /ai factory|training cluster|gb200|nvl72|ai[\s-]?factory/ },
  { cat: 'GPU Cloud',            re: /gpu cloud|neocloud|gpu-as-a-service|compute rental|inference-as/ },
  { cat: 'Government Compute',   re: /sovereign compute|sovereign ai|sovereign cloud|sovereign-grade|government compute|government ai/ },
  { cat: 'Hyperscale Campus',    re: /hyperscale campus|hyperscale|campus/ },
  { cat: 'Edge Campus',          re: /\bedge\b/ },
  { cat: 'Enterprise Colocation', re: /colocation|\bcolo\b|enterprise colo|retail colo/ },
];

export function deriveCategory(memo) {
  const m = memo || {};
  const cfg = m.recommended_architecture?.config;
  const hay = [
    m.executive_summary?.headline,
    m.recommended_architecture?.rationale,
    cfg && typeof cfg === 'object' ? Object.values(cfg).join(' ') : '',
    m.commercialization_strategy?.contract_structure,
    m.commercialization_strategy?.anchor_tenant,
    m.strategic_context?.body,
  ].filter(Boolean).join(' ').toLowerCase();

  if (!hay) return null;
  for (const r of CATEGORY_RULES) if (r.re.test(hay)) return r.cat;
  return null;
}

// ─── KPI strip ─────────────────────────────────────────────────────────────
//
// 6 core board KPIs. Prefers the already-computed _exec_projection; falls back
// to parsing key_financial_metrics labels. Returns null `value` (rendered "—")
// rather than fabricating a number.

function findMetric(fin, re) {
  return (fin || []).find(x => re.test((x.label || '').toLowerCase())) || null;
}

/** Format a key_financial_metrics row's raw value, rejecting non-displayable inputs. */
function sanitizeMetricValue(mt) {
  if (!mt || mt.value == null) return null;
  const v = mt.value;
  if (typeof v === 'object') return null;
  if (typeof v === 'number' && !Number.isFinite(v)) return null;
  const s = String(v).trim();
  if (!s || /^(n\/?a|nan|tbd|—|-)$/i.test(s)) return null;
  const unit = mt.unit;
  const sep = unit && !/^\$|%|×|x$/.test(unit) ? ' ' : '';
  return `${s}${unit ? sep + unit : ''}`.trim();
}

export function deriveKpis(memo) {
  const m = memo || {};
  const proj = m._exec_projection || {};
  const fin = m.key_financial_metrics?.metrics || [];
  const risk = deriveRiskLevel(m);

  // A KFM row is only trusted to label/feed a KPI when it is an UNAMBIGUOUS
  // single match — otherwise a regex could pair (e.g.) a "Pre-tax IRR" row's
  // confidence with the levered IRR shown, mislabelling the figure on screen.
  const single = (re) => { const ms = fin.filter(x => re.test((x.label || '').toLowerCase())); return ms.length === 1 ? ms[0] : null; };
  const rawFor = (re) => sanitizeMetricValue(single(re));
  const confFor = (re) => single(re)?.confidence || null;

  const cards = [
    {
      // Board-facing IRR is POST-TAX (P0-2); fall back to pre-tax for older memos.
      key: 'irr', label: 'IRR',
      value: fmtPct(proj.irr_post_tax ?? proj.irr) || rawFor(/post-tax.*irr|\birr\b/),
      sub: proj.irr_post_tax != null ? 'Post-tax · Levered equity' : 'Levered (pre-tax)',
      confidence: confFor(/\birr\b/),
    },
    {
      key: 'moic', label: 'MOIC',
      value: fmtX(proj.moic_post_tax ?? proj.moic) || rawFor(/\bmoic\b|multiple/),
      sub: proj.moic_post_tax != null ? 'Post-tax · Equity multiple' : 'Equity multiple (pre-tax)',
      confidence: confFor(/\bmoic\b/),
    },
    {
      key: 'npv', label: 'NPV',
      value: fmtUsd(proj.npv_post_tax ?? proj.npv) || rawFor(/\bnpv\b/),
      sub: proj.npv_post_tax != null ? 'Post-tax · Net present value' : 'Net present value (pre-tax)',
      confidence: confFor(/\bnpv\b/),
    },
    {
      key: 'capex', label: 'CAPEX',
      value: fmtUsd(proj.total_capex) || rawFor(/capex/),
      sub: proj.capex_per_mw != null ? `${fmtUsd(proj.capex_per_mw)}/MW` : 'Total build',
      confidence: confFor(/capex/),
    },
    {
      key: 'payback', label: 'Payback',
      value: fmtYears(proj.payback_years) || rawFor(/payback/),
      sub: proj.dscr_stabilized != null ? `DSCR ${fmtX(proj.dscr_stabilized)}` : 'To breakeven',
      confidence: confFor(/payback/),
    },
    {
      key: 'risk', label: 'Risk',
      value: risk.label,
      sub: risk.sub,
      tone: risk.tone,
    },
  ];
  return cards;
}

// ─── risk level (for KPI + hero) ──────────────────────────────────────────

export function deriveRiskLevel(memo) {
  const items = memo?.risks_constraints?.items || [];
  const high = items.filter(r => SEV(r.severity) === 'HIGH').length;
  const med = items.filter(r => SEV(r.severity) === 'MED').length;
  const low = items.filter(r => SEV(r.severity) === 'LOW').length;
  if (!items.length) return { label: '—', sub: 'No risks logged', tone: 'neutral', high, med, low };
  if (high > 0) return { label: 'Elevated', sub: `${high} high · ${med} med`, tone: 'danger', high, med, low };
  if (med > 0) return { label: 'Moderate', sub: `${med} med · ${low} low`, tone: 'warning', high, med, low };
  return { label: 'Contained', sub: `${low} low`, tone: 'success', high, med, low };
}

/** Top N risks, highest severity first. */
export function topRisks(memo, n = 5) {
  const order = { HIGH: 0, MED: 1, LOW: 2 };
  return [...(memo?.risks_constraints?.items || [])]
    .sort((a, b) => (order[SEV(a.severity)] ?? 1) - (order[SEV(b.severity)] ?? 1))
    .slice(0, n);
}

// ─── decision card ──────────────────────────────────────────────────────────

function clampWords(str, max) {
  if (!str) return '';
  const words = String(str).trim().split(/\s+/);
  return words.length <= max ? str : words.slice(0, max).join(' ') + '…';
}

export function deriveDecision(memo, status) {
  const m = memo || {};
  const recommendation = m.executive_summary?.headline || null;
  const why = clampWords(
    resolveCitationsInText(
      m.explainability?.why_this_recommendation || m.recommended_architecture?.rationale || '',
    ),
    55,
  ) || null;

  // Conditions before approval: the dependencies that gate the HIGH-severity risks.
  const conditions = topRisks(m, 5)
    .filter(r => SEV(r.severity) === 'HIGH')
    .map(r => r.dependency || r.label)
    .filter(Boolean)
    .slice(0, 3);

  const nextAction = deriveNextAction(m, status);
  return { recommendation, why, conditions, nextAction };
}

function deriveNextAction(memo, status) {
  const gates = memo?.deployment_roadmap?.phases?.[0]?.gating_events || [];
  const firstMove = gates[0] || null;
  switch ((status || '').toLowerCase()) {
    case 'draft':    return { primary: 'Mark reviewed', detail: 'Route to a reviewer before approval.' };
    case 'reviewed': return { primary: 'Approve or send back', detail: 'Confirm the verdict, or return for revision.' };
    case 'approved': return { primary: 'Proceed to execution', detail: firstMove ? `First move: ${firstMove}` : 'Advance to financing and procurement.' };
    case 'archived': return { primary: 'Reopen to revisit', detail: 'Archived — reopen to act on this report.' };
    default:         return { primary: 'Review report', detail: firstMove ? `First move: ${firstMove}` : 'Assess and route for approval.' };
  }
}

// ─── capital stack (Visual Story) ────────────────────────────────────────

export function deriveCapitalStack(memo, scenario) {
  const m = memo || {};
  const sc = scenario || {};
  let debtPct = num(sc.debt_pct);
  if (debtPct == null) {
    // Fallback to a KFM row ONLY when it is plausibly a debt-to-total-capital
    // percentage. A leverage multiple ("2.5x") or an absolute amount ("$286M")
    // is NOT a percentage — accepting it would fabricate a capital structure,
    // so we leave debtPct null and let the UI show the honest placeholder.
    const dm = findMetric(m.key_financial_metrics?.metrics, /debt|leverage|ltv/);
    if (dm) {
      const hay = `${dm.unit || ''} ${dm.value ?? ''}`;
      const looksPercent = hay.includes('%');
      const looksMultipleOrAmount = /[x×$]/i.test(hay);
      const parsed = num(dm.value);
      if (looksPercent && !looksMultipleOrAmount && parsed != null && parsed >= 0 && parsed <= 100) {
        debtPct = parsed;
      }
    }
  }
  if (debtPct == null) return null;
  const equityPct = Math.max(0, 100 - debtPct);

  // Equity sponsor split, when the originating scenario carries it.
  const split = [
    ['Hearst', num(sc.equity_hearst_pct)],
    ['Brookfield', num(sc.equity_brookfield_pct)],
    ['Qatar', num(sc.equity_qatar_pct)],
  ].filter(([, v]) => v != null && v > 0).map(([name, v]) => ({ name, pct: v }));

  return { debtPct, equityPct, split };
}
