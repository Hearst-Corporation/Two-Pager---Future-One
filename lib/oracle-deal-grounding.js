// lib/oracle-deal-grounding.js
//
// Grounding block generator — pure, testable, no side effects.
//
// Produces a text block that is appended to the cockpit-chat system prompt
// when the caller supplies an active deal (scenario + projection). The block
// instructs the LLM to use ENGINE numbers for THIS deal and never present
// general corpus archetype ranges (e.g. "powered shell ~18–24% IRR") as
// facts about the current scenario.
//
// Called by: app/api/cockpit-chat/route.ts → buildDealGroundingBlock(body.deal)
// Depends on: lib/dossier-derive.js (deriveVerdict), lib/hearst-format.js (fmtUSD, fmtPctFromRatio, fmtX)

import { deriveVerdict } from '@/lib/dossier-derive';
import { fmtUSD, fmtPctFromRatio, fmtX } from '@/lib/hearst-format';

/**
 * Build the engine-truth grounding block to append to the system prompt.
 *
 * @param {object|null|undefined} deal
 *   { scenario?: object, projection?: object, warnings?: string[] }
 * @returns {string} The block text, or '' when no projection is present.
 */
export function buildDealGroundingBlock(deal) {
  if (!deal || !deal.projection) return '';

  const p = deal.projection;
  const s = deal.scenario || {};

  // deriveVerdict expects { _exec_projection: projection } — mirror the memo shape.
  const verdict = deriveVerdict({ _exec_projection: p });

  const lines = [];

  lines.push(
    '── CURRENT DEAL — ENGINE TRUTH (authoritative; overrides any general corpus range) ──',
  );

  // Scenario parameters when present
  if (s.total_mw != null) {
    const archetypeId = (typeof s.archetype_id === 'string') ? s.archetype_id.slice(0, 120) : '';
    const parts = [`${s.total_mw} MW`];
    if (s.pue != null) parts.push(`PUE ${s.pue}`);
    if (s.debt_pct != null) parts.push(`debt ${s.debt_pct}%`);
    if (archetypeId) parts.push(archetypeId);
    lines.push(`Scenario: ${parts.join(' · ')}`);
  }

  // Core return metrics from the engine — post-tax preferred, pre-tax as fallback
  const irrVal     = p.irr_post_tax  ?? p.irr;
  const moicVal    = p.moic_post_tax ?? p.moic;
  const npvVal     = p.npv_post_tax  ?? p.npv;
  const irrStr     = irrVal  != null         ? fmtPctFromRatio(irrVal)      : '—';
  const moicStr    = moicVal != null         ? fmtX(moicVal)                : '—';
  const npvStr     = npvVal  != null         ? fmtUSD(npvVal)               : '—';
  const paybackStr = p.payback_years != null ? `${p.payback_years} yr`      : 'never within horizon';
  const dscrStr    = p.dscr_stabilized != null ? fmtX(p.dscr_stabilized)   : 'n/a';

  lines.push(
    `Engine (post-tax, levered-equity): IRR ${irrStr} · MOIC ${moicStr} · NPV ${npvStr} · Payback ${paybackStr} · DSCR ${dscrStr}`,
  );

  // Verdict from deriveVerdict (PROCEED / REVIEW / REJECT / etc.)
  const verdictLabel = verdict.key ?? verdict.label ?? 'INSUFFICIENT_DATA';
  const verdictDrivers = Array.isArray(verdict.drivers) && verdict.drivers.length
    ? ' — ' + verdict.drivers.join('; ')
    : '';
  lines.push(`Engine verdict: ${verdictLabel}${verdictDrivers}`);

  // Warnings
  const warnings = Array.isArray(deal.warnings) ? deal.warnings : [];
  lines.push(`Engine warnings: ${warnings.length ? warnings.join(' | ') : 'none'}`);

  // Grounding rule — the most important line
  lines.push(
    "RULE: For ANY question about THIS deal, use ONLY the engine figures above. " +
    "The knowledge corpus contains GENERAL archetype ranges (e.g. \"powered shell ~18–24% IRR\") " +
    "— these are background priors, NOT facts about this scenario. " +
    "If a corpus range conflicts with the engine numbers above, the engine numbers are correct; " +
    "never present a corpus range as this deal's result.",
  );

  return lines.join('\n');
}
