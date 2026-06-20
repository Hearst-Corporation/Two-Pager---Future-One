// lib/oracle-deal-grounding.js
//
// Grounding block generator — pure, testable, no side effects.
//
// Produces a text block that is appended to the chat system prompt
// when the caller supplies an active deal (scenario + projection). The block
// instructs the LLM to use ENGINE numbers for THIS deal and never present
// general corpus archetype ranges (e.g. "powered shell ~18–24% IRR") as
// facts about the current scenario.
//
// Called by: app/api/cockpit-chat/route.ts → buildDealGroundingBlock(body.deal)
// Depends on: lib/dossier-derive.js (deriveVerdict), lib/hearst-format.js (fmtUSD, fmtPctFromRatio, fmtX)

import { deriveVerdict } from '@/lib/dossier-derive';
import { fmtUSD, fmtPctFromRatio, fmtX } from '@/lib/hearst-format';
import { deriveReturnsComposition } from '@/lib/returns-composition';

/**
 * Sanitise un warning avant de l'injecter dans le system prompt.
 * - Trim + normalise les espaces/retours ligne.
 * - Neutralise les marqueurs qui ressemblent à des instructions système
 *   (RULE:, SYSTEM:, ###, ---) en début de ligne.
 * - Plafonne à 200 caractères (cohérent avec le schema Zod).
 *
 * @param {string} s
 * @returns {string}
 */
export function sanitizeWarning(s) {
  // P2-A: tolère null/undefined/number — convertit en string avant tout.
  const str = String(s ?? '');
  if (!str.trim()) return '';

  // P2-B: neutralise les marqueurs d'instruction système AU DÉBUT DE CHAQUE LIGNE
  // (avant de collapser les newlines), pour couvrir "line1\nRULE: do X".
  // Un marqueur au milieu d'une ligne ("Power tariff RULE: 0.05/kWh") est préservé.
  const perLineNeutralised = str
    .split(/\r?\n/)
    .map(line => line.replace(/^(\s*)(RULE:|SYSTEM:|#{1,6}\s*|---+\s*)/i, '$1[W] '))
    .join('\n');

  // Remplace les retours ligne et tabs par un espace, trim.
  let out = perLineNeutralised.replace(/[\r\n\t]+/g, ' ').trim();

  // Plafond à 200 chars.
  if (out.length > 200) out = out.slice(0, 200);
  return out;
}

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

  // Core return metrics — headline is POST-TAX; pre-tax shown as sub-figure only
  // when the post-tax field exists, both values are present, and they differ.
  // If NO post-tax fields are present at all (legacy projection predating the tax
  // layer) we fall back to pre-tax for all three metrics and append a transparency note.
  const hasPostTax = p.irr_post_tax != null || p.moic_post_tax != null || p.npv_post_tax != null;

  // IRR
  const irrHeadline  = p.irr_post_tax ?? p.irr;
  const irrPreRaw    = p.irr;
  const irrStr       = irrHeadline != null ? fmtPctFromRatio(irrHeadline) : '—';
  const irrSub       = (hasPostTax && p.irr_post_tax != null && irrPreRaw != null && irrPreRaw !== p.irr_post_tax)
    ? ` (pre-tax ${fmtPctFromRatio(irrPreRaw)})`
    : '';

  // MOIC
  const moicHeadline = p.moic_post_tax ?? p.moic;
  const moicPreRaw   = p.moic;
  const moicStr      = moicHeadline != null ? fmtX(moicHeadline) : '—';
  const moicSub      = (hasPostTax && p.moic_post_tax != null && moicPreRaw != null && moicPreRaw !== p.moic_post_tax)
    ? ` (pre-tax ${fmtX(moicPreRaw)})`
    : '';

  // NPV
  const npvHeadline  = p.npv_post_tax ?? p.npv;
  const npvPreRaw    = p.npv;
  const npvStr       = npvHeadline != null ? fmtUSD(npvHeadline) : '—';
  const npvSub       = (hasPostTax && p.npv_post_tax != null && npvPreRaw != null && npvPreRaw !== p.npv_post_tax)
    ? ` (pre-tax ${fmtUSD(npvPreRaw)})`
    : '';

  // Payback and DSCR — no tax basis distinction
  const paybackStr = p.payback_years != null ? `${p.payback_years} yr` : 'never within horizon';
  const dscrStr    = p.dscr_stabilized != null ? fmtX(p.dscr_stabilized) : 'n/a';

  // Assemble engine line
  const legacyNote = !hasPostTax ? ' [pre-tax basis — projection predates tax layer]' : '';
  const basisLabel = hasPostTax ? 'post-tax, levered equity' : 'levered-equity';

  lines.push(
    `Engine (${basisLabel}): IRR ${irrStr}${irrSub} · MOIC ${moicStr}${moicSub} · NPV ${npvStr}${npvSub} · Payback ${paybackStr} · DSCR ${dscrStr}${legacyNote}`,
  );

  // Marqueur de fraîcheur — date du dernier calcul (YYYY-MM-DD) quand disponible.
  const freshnessTs = s.last_calculated_at ?? s.updated_at ?? null;
  if (freshnessTs) {
    lines.push(`As of: ${String(freshnessTs).slice(0, 10)}`);
  }

  // Verdict from deriveVerdict (PROCEED / REVIEW / REJECT / etc.)
  const verdictLabel = verdict.key ?? verdict.label ?? 'INSUFFICIENT_DATA';
  const verdictDrivers = Array.isArray(verdict.drivers) && verdict.drivers.length
    ? ' — ' + verdict.drivers.join('; ')
    : '';
  lines.push(`Engine verdict: ${verdictLabel}${verdictDrivers}`);

  // Warnings — chaque warning est sanitisé avant injection dans le system prompt.
  const warnings = Array.isArray(deal.warnings) ? deal.warnings : [];
  const sanitizedWarnings = warnings.map(sanitizeWarning);
  lines.push(`Engine warnings: ${sanitizedWarnings.length ? sanitizedWarnings.join(' | ') : 'none'}`);

  // Returns composition — sourced from deriveReturnsComposition so the chat can
  // answer "where does the value come from?" and flag terminal-value dependency.
  const rc = deriveReturnsComposition(p);
  if (rc.available && rc.terminalPct != null) {
    const diligenceSuffix = rc.diligence ? ` (${rc.diligence})` : '';
    lines.push(`Returns composition: ${rc.label} — ${rc.note}${diligenceSuffix}`);
  }

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
