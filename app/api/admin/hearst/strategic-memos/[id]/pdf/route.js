// GET /api/admin/hearst/strategic-memos/[id]/pdf
//
// Board Memo PDF — Concept B template.
// Renders memo_json data into the approved 6-page (+ cover) A4 institutional layout.
// Pipeline unchanged: auth → Supabase → buildHtml → Puppeteer → PDF response.

import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { requireRowOwnership } from '@/lib/auth-guards';
import { dbErrorResponse, notFoundResponse } from '@/lib/api-errors';
import { deriveVerdict, deriveRiskLevel, fmtPct as ddPct } from '@/lib/dossier-derive';
import { fmtUSD, fmtPctFromRatio, fmtPctRaw as fmtPctRawCore, fmtYears, MISSING } from '@/lib/hearst-format';
import { deriveReturnsComposition } from '@/lib/returns-composition';
import { boardFormatted, boardLabel } from '@/lib/hearst-board-metrics';
import { resolveCitationsInText, resolveCitation } from '@/lib/citation-resolver';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ── Helpers ───────────────────────────────────────────────────────────────────

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Helper: render null from dossier-derive formatters as 'N/A'
const orNA = (x) => x == null ? 'N/A' : x;

// Layout formatters DELEGATE to lib/hearst-format (the single formatter layer) so
// the board PDF renders identical glyph / rounding / tiers to every on-screen
// surface (audit P0-2 / P1-2: the $B tier is now reached; payback is "yr" not
// "yrs"). Missing values render as 'N/A' (PDF convention) instead of the screen "—".
const naIf = (s) => (s === MISSING ? 'N/A' : s);
const fmtUsd = (v) => naIf(fmtUSD(v));
const fmtPct = (v) => naIf(fmtPctFromRatio(v));
const fmtPctRaw = (v) => naIf(fmtPctRawCore(v));
const fmtYr = (v) => naIf(fmtYears(v));
const fmtDate = (s) => { try { return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return String(s ?? ''); } };

const REGION_MAP = {
  qatar: 'State of Qatar · Ras Laffan Industrial City',
  uae:   'United Arab Emirates',
  ksa:   'Kingdom of Saudi Arabia',
  gcc:   'Gulf Cooperation Council',
};

function regionLabel(r) {
  return REGION_MAP[(r || '').toLowerCase()] || esc(r || 'MENA');
}

// IRR sensitivity — base case only, no stress engine available
function sensLine(irr) {
  if (irr == null) return '<div class="muted-note">IRR sensitivity — base case only. No value shown.</div>';
  const base = irr > 1 ? irr / 100 : irr;
  const scale = { min: 0.05, max: 0.35 };
  const toPos = v => 8 + ((v - scale.min) / (scale.max - scale.min)) * 84;
  const basePos = toPos(base).toFixed(1);
  return `
  <div class="sens-line">
    <div class="sens-base" style="left:${basePos}%;">
      <span class="sb-lbl">Base ${fmtPctRaw(base)}</span>
    </div>
  </div>
  <div class="muted-note" style="margin-top:6mm;">Base case IRR ${orNA(ddPct(irr))}. Sensitivity analysis pending stress engine.</div>`;
}

// CAPEX — total only (component breakdown not modeled)
function capexRows(snap) {
  const total = snap?.total_capex;
  if (!total) return '<div class="muted-note">Capex detail not available.</div>';
  return `
    <div class="cap-total">
      <span class="ct-name">Total CAPEX</span>
      <span class="ct-share tnum"></span>
      <span class="ct-val tnum">${fmtUsd(total)}</span>
    </div>
    <div class="muted-note" style="margin-top:4mm;">Component breakdown not modeled.</div>`;
}

// Risk table rows (max 5)
function riskRows(risks) {
  const items = (risks?.items || []).slice(0, 5);
  if (!items.length) return '<div class="muted-note">No structured risk data.</div>';
  const lvl = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return items.map((r, i) => `
    <div class="risk-row">
      <div class="r-no">${i + 1}</div>
      <div>
        <div class="r-name">${esc(r.label)}</div>
        <div class="r-mit">${esc(r.mitigation || '')}</div>
      </div>
      <div class="risk-meta">
        <div class="rm-lab">Severity</div>
        <div class="rm-val">
          <span class="ticks lv${lvl[(r.severity || 'MEDIUM').toUpperCase()] || 2}"><i></i><i></i><i></i></span>
          ${esc(r.severity || 'Medium')}
        </div>
      </div>
      <div class="risk-meta">
        <div class="rm-lab">Category</div>
        <div class="rm-val">${esc((r.category || 'operational').replace(/_/g, ' '))}</div>
      </div>
    </div>`).join('');
}

// Conditions precedent from roadmap phase 0 gating events (max 4)
function condRows(roadmap) {
  const events = (roadmap?.phases?.[0]?.gating_events || []).slice(0, 4);
  if (!events.length) return '';
  const nums = ['i.', 'ii.', 'iii.', 'iv.'];
  return `<div class="cond-row">
    ${events.map((ev, i) => `
    <div class="cond">
      <div class="ci">${nums[i]}</div>
      <div class="cv">${esc(ev)}</div>
    </div>`).join('')}
  </div>`;
}

// Timeline stops from deployment roadmap phases (max 5)
function timelineStops(roadmap) {
  const phases = (roadmap?.phases || []).slice(0, 5);
  if (!phases.length) return '';
  return phases.map((p, i) => `
    <div class="tl-stop${i === 0 ? ' first' : ''}">
      <div class="tl-when">${esc(p.months_from_t0 ? `T+${p.months_from_t0}` : `Phase ${i + 1}`)}</div>
      <div class="tl-what">${esc(p.label)}</div>
    </div>`).join('');
}

// Appendix assumptions from _exec_projection + fin_metrics
function assumptions(snap, finMetrics) {
  const metrics = finMetrics?.metrics || [];
  const debt = metrics.find(m => m.label === 'Debt / leverage');
  const rows = [
    { k: 'WACC',          v: 'Not specified' },
    { k: 'Hold period',   v: (typeof snap?.exit_year === 'number') ? `${snap.exit_year} years` : 'Not modeled' },
    { k: 'Total CAPEX',   v: fmtUsd(snap?.total_capex) },
    { k: 'Debt',          v: debt ? `${debt.value}% @ ${debt.unit.replace('% @ ', '') || 'not specified'}` : 'not specified' },
    { k: 'IRR (Pre-tax, base)', v: fmtPct(snap?.irr) },
    { k: 'IRR (Post-tax)',      v: fmtPct(snap?.irr_post_tax ?? snap?.irr) },
    { k: 'NPV (Post-tax)',      v: fmtUsd(snap?.npv_post_tax ?? snap?.npv) },
    { k: 'Terminal Value',      v: fmtUsd(snap?.terminal_value) },
    { k: 'Payback',             v: fmtYr(snap?.payback_years) },
    { k: 'Tax',                 v: snap?.tax_assumptions ? `${snap.tax_assumptions.income_tax_rate_pct}% Qatar · straight-line ${snap.tax_assumptions.depreciable_life_years}y` : 'Not modeled' },
    { k: 'Utilization',   v: 'not specified' },
  ];
  return rows.map(r => `
    <li><span class="al-k">${esc(r.k)}</span><span class="al-v tnum">${esc(r.v)}</span></li>`).join('');
}

// Sources from confidence block known_unknowns + fin_metrics sources
function sourcesList(cb, finMetrics) {
  const kus = (cb?.known_unknowns || []).slice(0, 3);
  // m.source is a raw datapoint_id (or "ASSUMED") — resolve to a human source name.
  const srcs = [...new Set(
    (finMetrics?.metrics || [])
      .map(m => m.source)
      .filter(Boolean)
      .map(src => (src === 'ASSUMED' ? 'Assumed (no public comparable)' : resolveCitation(src).label)),
  )].slice(0, 4);
  const all = [...srcs, ...kus.map(k => `Note: ${k}`)].slice(0, 6);
  if (!all.length) return '<li>ORACLE internal model</li>';
  return all.map(s => `<li><span class="src">${esc(s)}</span></li>`).join('');
}

// Appendix contract & power table from fin_metrics
function contractTable(finMetrics) {
  const m = finMetrics?.metrics || [];
  const rent  = m.find(r => r.label === 'Hyperscale rent');
  const debt  = m.find(r => r.label === 'Debt / leverage');
  const rows = [
    { item: 'Anchor offtake',        terms: 'not specified' },
    { item: 'Contracted before FID', terms: 'not specified' },
    { item: 'Rental rate',           terms: rent ? `$${rent.value}/kW/mo` : 'N/A' },
    { item: 'Debt structure',        terms: debt ? `${debt.value} ${debt.unit}` : 'not specified' },
  ];
  return rows.map(r => `<tr><td>${esc(r.item)}</td><td class="r">${esc(r.terms)}</td></tr>`).join('');
}

// ── Main HTML builder ─────────────────────────────────────────────────────────

function buildHtml(row) {
  const m      = row.memo_json || {};
  const snap   = m._exec_projection || {};
  const cb     = m.confidence_block || {};
  const exsum  = m.executive_summary || {};
  const risks  = m.risks_constraints || {};
  const roadmap = m.deployment_roadmap || {};
  const arch   = m.recommended_architecture || {};
  const ctx    = m.strategic_context || {};
  const fin    = m.key_financial_metrics || {};
  const comm   = m.commercialization_strategy || {};

  // Verdict and risk level from single source of truth (dossier-derive)
  const v          = deriveVerdict(m);
  const verdict    = v.label;
  const verdictKey = v.key;
  const riskLevel  = deriveRiskLevel(m).label;

  // Verdict-gated copy map — ALL approval language is derived from here
  const RECO = {
    PROCEED: {
      approve:     'Approve Phase 1 capital commitment and authorize the Final Investment Decision (FID).',
      decision:    'Approve the {CAPEX} Phase 1 FID; authorize EPC award and anchor offtake execution.',
      page5:       'Commit Phase 1. Gate Phase 2 on commissioning and contracted demand.',
      cardLabel:   'Approve Now',
      showApprove: true,
    },
    PROCEED_WITH_CONDITIONS: {
      approve:     'Conditional approval — commit Phase 1 ONLY once the conditions precedent below are satisfied.',
      decision:    'Approve the {CAPEX} Phase 1 FID SUBJECT TO the conditions precedent below.',
      page5:       'Commit Phase 1 only once conditions precedent are met; gate Phase 2 on commissioning and 80% contracted demand.',
      cardLabel:   'Approve — With Conditions',
      showApprove: true,
    },
    REVIEW: {
      approve:     'Return for analysis. Base-case returns are marginal or below the cost-of-capital hurdle — not yet an IC decision.',
      decision:    'No FID recommended yet. Resolve the open items below and re-underwrite before any capital commitment.',
      page5:       'Do not commit capital yet. Resolve the open items, then re-underwrite.',
      cardLabel:   'Not Ready — Review',
      showApprove: false,
    },
    REJECT: {
      approve:     'Do not commit capital. On the base case the returns do not clear the cost of capital / destroy value.',
      decision:    'No FID. The investment is not recommended on the current base case.',
      page5:       'Do not proceed. Returns do not meet the threshold for capital commitment.',
      cardLabel:   'Do Not Approve',
      showApprove: false,
    },
    INSUFFICIENT_DATA: {
      approve:     'Insufficient engine-derived data to make a recommendation; regenerate from a complete simulation.',
      decision:    'No recommendation possible — the memo lacks engine-derived financials.',
      page5:       'Insufficient data. Re-run the simulator and regenerate before review.',
      cardLabel:   'Insufficient Data',
      showApprove: false,
    },
  };
  const reco = RECO[verdictKey] || RECO.INSUFFICIENT_DATA;
  const projDate  = fmtDate(row.created_at);
  const location  = regionLabel(row.region);

  // P0-4: financial figures come from the ENGINE snapshot, never scraped from LLM
  // key_financial_metrics label strings. Stabilized revenue + EBITDA margin are
  // engine-computed; when absent the PDF shows an honest 'N/A', not a label fallback.
  const stabRevenue = snap.stabilized_revenue ?? null;
  const stabEbitda = snap.stabilized_ebitda ?? null;
  const ebitdaMarginRatio = (stabRevenue && stabEbitda != null && stabRevenue !== 0)
    ? stabEbitda / stabRevenue
    : null;

  // Returns composition (audit P0): operations vs terminal-value share of equity
  // value, from the engine snapshot (years[].fcf + terminal_value_to_equity).
  const returnsComp = deriveReturnsComposition(snap);

  // Recommendation body — gated by verdictKey; LLM rationale only used for PROCEED family
  const approveBody = (verdictKey === 'PROCEED' || verdictKey === 'PROCEED_WITH_CONDITIONS')
    ? (arch.rationale ? resolveCitationsInText(arch.rationale.replace(/^WHY:\s*/i, '')).slice(0, 280) + '…' : reco.approve)
    : reco.approve;

  const holdBody = comm.ramp_profile
    ? `Phase 2 capital gated on Phase 1 occupancy ≥80%. ${comm.ramp_profile.slice(0, 160)}…`
    : 'Phase 2 capital. Gate commitment on Phase 1 commissioning and contracted demand reaching 80%.';

  // Committee quote — headline
  const committeeQuote = exsum.headline
    ? exsum.headline.slice(0, 220)
    : 'The decision before the Committee is not whether AI compute will be built — it is whether this platform builds it first.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${esc(row.title)} — ORACLE Board Memo</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--preview-bg); color: var(--ink);
  font-family: "Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased; }
:root {
  --preview-bg: #57534e;
  --ink: #111111; --ink-soft: #2A2A2A; --gray-1: #585858; --gray-2: #8C8C8C;
  --hair: #D7D3CD; --hair-soft: #E7E3DD; --paper: #FFFFFF; --whisper: #F6F4F1;
  --oxblood: #6E1423;
  --sans: "Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, sans-serif;
  --serif: Georgia, "Times New Roman", Times, serif;
  --mx: 22mm; --mtop: 22mm; --mbot: 20mm;
}
.page { position: relative; width: 210mm; height: 297mm; background: var(--paper);
  margin: 0 auto; overflow: hidden; page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
.frame { position: absolute; top: var(--mtop); left: var(--mx); right: var(--mx); bottom: var(--mbot); }
@media screen { body { padding: 28px 0; }
  .page { box-shadow: 0 1px 2px rgba(0,0,0,.18), 0 18px 44px rgba(0,0,0,.30); margin-bottom: 28px; } }
.tnum { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
.runhead { position: absolute; top: 13mm; left: var(--mx); right: var(--mx);
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 7.4pt; letter-spacing: .16em; text-transform: uppercase; color: var(--gray-2); }
.runhead .rh-name { color: var(--gray-1); font-weight: 600; }
.runfoot { position: absolute; bottom: 12mm; left: var(--mx); right: var(--mx);
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 7.4pt; letter-spacing: .14em; text-transform: uppercase; color: var(--gray-2); }
.runfoot .rf-pg { color: var(--gray-1); font-weight: 600; }
.eyebrow { font-size: 8pt; letter-spacing: .28em; text-transform: uppercase; color: var(--gray-2);
  font-weight: 600; margin: 0 0 8mm 0; }
.eyebrow .num { color: var(--oxblood); margin-right: 1.2em; font-weight: 700; }
.headline { font-family: var(--sans); font-weight: 700; font-size: 23pt; line-height: 1.06;
  letter-spacing: -0.014em; margin: 0; color: var(--ink); }
.headline.smaller { font-size: 19.5pt; }
.accentline { height: 1.5px; background: var(--oxblood); border: 0; width: 24mm; margin: 7mm 0 0 0; }
p { margin: 0; }
.label { font-size: 7.6pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; }
.break-avoid { break-inside: avoid; page-break-inside: avoid; }
.muted-note { color: var(--gray-2); font-size: 9pt; font-style: italic; }

/* COVER */
.cover .frame { display: flex; flex-direction: column; }
.cover-top { display: flex; justify-content: space-between; align-items: baseline;
  font-size: 7.8pt; letter-spacing: .22em; text-transform: uppercase; color: var(--gray-2);
  padding-bottom: 6mm; border-bottom: 1px solid var(--hair); }
.cover-top .org { color: var(--ink); font-weight: 700; letter-spacing: .2em; }
.cover-kicker { margin-top: auto; font-size: 8.4pt; letter-spacing: .34em; text-transform: uppercase;
  color: var(--gray-2); font-weight: 600; margin-bottom: 11mm; }
.wordmark { font-family: var(--sans); font-weight: 700; font-size: 56pt; line-height: 1.0;
  letter-spacing: -0.025em; margin: 0; padding-top: 2mm; color: var(--ink); }
.wordmark .two { display: block; color: var(--ink); }
.cover-sub { font-size: 14pt; color: var(--gray-1); letter-spacing: -.01em; margin: 5mm 0 0 0; font-weight: 400; }
.cover-accent { height: 2px; background: var(--oxblood); border: 0; width: 30mm; margin: 7mm 0 0 0; }
.cover-thesis { font-size: 11.5pt; line-height: 1.55; color: var(--ink-soft); margin: 8mm 0 0 0;
  max-width: 148mm; font-style: italic; }
.cover-thesis .q { font-style: normal; font-weight: 700; }
.cover-foot { margin-top: auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
.cf-k { font-size: 7.2pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 3mm; }
.cf-v { font-size: 10pt; color: var(--ink); line-height: 1.4; }

/* DECISION PAGE */
.dec-head { display: flex; flex-direction: column; gap: 1mm; }
.dec-meta { display: flex; justify-content: space-between; align-items: center; }
.dm-k { font-size: 8pt; letter-spacing: .16em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; }
.dec-risk { display: flex; align-items: center; gap: 6mm; }
.rk { font-size: 9pt; font-weight: 700; color: var(--ink); }
.verdict-block { margin-top: 11mm; flex-shrink: 0; padding: 14mm 0 10mm; }
.verdict-eyebrow { font-size: 8pt; letter-spacing: .24em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 5mm; }
.verdict { font-family: var(--sans); font-weight: 700; font-size: 44pt; line-height: 1.0;
  letter-spacing: -0.02em; color: var(--ink); margin: 0; white-space: normal; }
.recommendation { font-size: 11.5pt; line-height: 1.5; color: var(--ink-soft); margin-top: 6mm; max-width: 140mm; }
.figs { margin-top: 10mm; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8mm; }
.fig .fk { font-size: 7.6pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 3mm; }
.fig .fv { font-size: 28pt; font-weight: 700; line-height: 1.0; letter-spacing: -0.02em; color: var(--ink); }
.fig .fv.accent { color: var(--oxblood); }
.fig .fsub { font-size: 8.5pt; color: var(--gray-1); margin-top: 2mm; }
.decision-required { margin-top: 9mm; padding-top: 7mm; border-top: 1px solid var(--ink); }
.dr-k { font-size: 7.6pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 3mm; }
.dr-v { font-size: 10pt; line-height: 1.5; color: var(--ink); max-width: 148mm; }

/* OPPORTUNITY */
.opp-grid { margin-top: 10mm; display: grid; grid-template-columns: 1fr 1fr; gap: 7mm 12mm; }
.opp-cell .oc-k { font-size: 7.6pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2);
  font-weight: 600; margin-bottom: 3.5mm; }
.opp-cell .oc-v { font-size: 10pt; line-height: 1.55; color: var(--ink); }
.opp-cell.is-thesis { background: var(--whisper); padding: 7mm 8mm; }
.drivers { margin-top: 9mm; padding-top: 7mm; border-top: 1px solid var(--hair); }
.dr-title { font-size: 7.6pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 6mm; }
.driver-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8mm; }
.driver { break-inside: avoid; }
.di { font-family: var(--serif); font-size: 12pt; color: var(--oxblood); margin-bottom: 3mm; }
.dv { font-size: 10pt; line-height: 1.4; color: var(--ink); }
.dfig { font-weight: 700; }

/* FINANCIAL */
.fin-hero { margin-top: 9mm; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8mm; border-bottom: 1px solid var(--hair); padding-bottom: 8mm; }
.fin-kpi .fk { font-size: 7.6pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 3mm; }
.fin-kpi .fv { font-size: 26pt; font-weight: 700; line-height: 1.0; letter-spacing: -0.02em; color: var(--ink); }
.fin-kpi .fv.accent { color: var(--oxblood); }
.fin-kpi .fs { font-size: 8.5pt; color: var(--gray-1); margin-top: 2mm; }
.fin-body { margin-top: 8mm; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
.cap-title { font-size: 8pt; letter-spacing: .16em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 4mm; }
.cap-row { display: grid; grid-template-columns: 1fr auto auto; gap: 4mm; align-items: baseline;
  padding: 3mm 0; border-bottom: 1px solid var(--hair-soft); }
.cr-name { font-size: 9.5pt; color: var(--ink); }
.cr-share { font-size: 9pt; color: var(--gray-1); }
.cr-val { font-size: 9.5pt; font-weight: 700; color: var(--ink); min-width: 26mm; text-align: right; }
.cap-total { display: grid; grid-template-columns: 1fr auto auto; gap: 4mm; align-items: baseline;
  padding: 3mm 0 0 0; border-top: 1.5px solid var(--ink); }
.ct-name { font-size: 9.5pt; font-weight: 700; color: var(--ink); }
.ct-share { font-size: 9pt; color: var(--gray-1); }
.ct-val { font-size: 9.5pt; font-weight: 700; color: var(--oxblood); min-width: 26mm; text-align: right; }
.sens-wrap { }
.sens-title { font-size: 8pt; letter-spacing: .16em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 5mm; }
.sens-line { position: relative; height: 6px; background: var(--hair-soft); border-radius: 3px; margin-bottom: 3mm; }
.sens-base { position: absolute; top: -8px; transform: translateX(-50%); }
.sb-lbl { font-size: 7.5pt; font-weight: 700; color: var(--oxblood); white-space: nowrap; }
.sens-note { font-size: 8.5pt; color: var(--gray-1); line-height: 1.5; margin-top: 4mm; }

/* RISKS */
.risk-table { margin-top: 9mm; }
.risk-headrow { display: grid; grid-template-columns: 24px 1fr 80px 80px; gap: 4mm;
  padding: 0 0 3mm 0; border-bottom: 1px solid var(--ink); }
.rh { font-size: 7.2pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; }
.risk-row { display: grid; grid-template-columns: 24px 1fr 80px 80px; gap: 4mm;
  padding: 5mm 0; border-bottom: 1px solid var(--hair-soft); align-items: start; }
.r-no { font-family: var(--serif); font-size: 10pt; color: var(--oxblood); font-weight: 700; }
.r-name { font-size: 9.5pt; font-weight: 700; color: var(--ink); margin-bottom: 2mm; }
.r-mit { font-size: 8.5pt; color: var(--gray-1); line-height: 1.4; }
.risk-meta { }
.rm-lab { font-size: 7.2pt; letter-spacing: .14em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 2mm; }
.rm-val { font-size: 8.5pt; color: var(--ink); display: flex; align-items: center; gap: 4px; }
.ticks { display: inline-flex; gap: 2px; }
.ticks i { width: 3px; height: 10px; background: var(--hair); display: inline-block; }
.ticks.lv1 i:nth-child(1) { background: var(--ink); }
.ticks.lv2 i:nth-child(1), .ticks.lv2 i:nth-child(2) { background: var(--ink); }
.ticks.lv3 i { background: var(--ink); }

/* SCENARIO */
.scen-grid { margin-top: 9mm; display: grid; grid-template-columns: repeat(3, 1fr); column-gap: 10mm; }
.scen { break-inside: avoid; border-top: 2px solid var(--hair); padding-top: 6mm; }
.scen.base { border-top-color: var(--oxblood); }
.scen .sc-name { font-size: 10pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--ink); margin-bottom: 2mm; }
.scen.base .sc-name { color: var(--oxblood); }
.scen .sc-tag { font-size: 9pt; color: var(--gray-1); line-height: 1.5; min-height: 20mm; margin-bottom: 5mm; border-bottom: 1px solid var(--hair-soft); padding-bottom: 5mm; }
.scen .sc-irr-k { font-size: 7.2pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 2mm; }
.scen .sc-irr { font-size: 34pt; font-weight: 700; line-height: 0.92; letter-spacing: -0.02em; color: var(--ink); }
.scen.base .sc-irr { color: var(--oxblood); }
.scen .sc-rows { margin-top: 6mm; }
.scen .sc-line { display: flex; justify-content: space-between; align-items: baseline; padding: 3mm 0; border-top: 1px solid var(--hair-soft); }
.scen .sc-line:first-child { border-top: 0; }
.scen .sc-lk { font-size: 9pt; color: var(--gray-1); }
.scen .sc-lv { font-size: 10pt; font-weight: 700; color: var(--ink); }
.scen-note { margin-top: 10mm; border-top: 1px solid var(--ink); padding-top: 6mm; font-size: 9pt; color: var(--gray-1); line-height: 1.6; max-width: 152mm; }
.scen-note b { color: var(--ink); }

/* RECOMMENDATION */
.rec-two { margin-top: 9mm; display: grid; grid-template-columns: 1fr 1fr; column-gap: 14mm; }
.rec-card { break-inside: avoid; padding-top: 5mm; border-top: 2px solid var(--oxblood); }
.rec-card.hold { border-top-color: var(--ink); }
.rec-card .rc-k { font-size: 8pt; letter-spacing: .2em; text-transform: uppercase; font-weight: 700; margin-bottom: 4mm; }
.rec-card.go .rc-k { color: var(--oxblood); }
.rec-card.hold .rc-k { color: var(--ink); }
.rec-card .rc-v { font-size: 10pt; line-height: 1.6; color: var(--ink); }
.conditions { margin-top: 10mm; border-top: 1px solid var(--ink); padding-top: 7mm; }
.cd-title { font-size: 8pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 7mm; }
.cond-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8mm; }
.cond .ci { font-family: var(--serif); font-size: 12pt; color: var(--oxblood); margin-bottom: 3mm; }
.cond .cv { font-size: 9.5pt; line-height: 1.5; color: var(--ink); }
.timeline { margin-top: 10mm; border-top: 1px solid var(--ink); padding-top: 7mm; }
.tl-title { font-size: 8pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2); font-weight: 600; margin-bottom: 8mm; }
.tl-track { display: grid; grid-template-columns: repeat(5, 1fr); position: relative; }
.tl-track::before { content: ""; position: absolute; left: 0; right: 0; top: 3.5px; height: 1px; background: var(--hair); }
.tl-stop { position: relative; padding-top: 9mm; padding-right: 4mm; break-inside: avoid; }
.tl-stop::before { content: ""; position: absolute; left: 0; top: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--paper); border: 1.5px solid var(--gray-1); }
.tl-stop.first::before { background: var(--oxblood); border-color: var(--oxblood); }
.tl-when { font-size: 7.8pt; letter-spacing: .12em; text-transform: uppercase; color: var(--gray-1); font-weight: 700; margin-bottom: 2mm; }
.tl-stop.first .tl-when { color: var(--oxblood); }
.tl-what { font-size: 8.5pt; line-height: 1.4; color: var(--ink); }
.rec-quote { margin-top: 7mm; font-family: var(--serif); font-size: 11.5pt; line-height: 1.52; color: var(--ink); max-width: 148mm; }
.rec-quote b { font-weight: 700; }

/* APPENDIX */
.apx-grid { margin-top: 9mm; display: grid; grid-template-columns: 1fr 1fr; column-gap: 16mm; row-gap: 10mm; }
.apx-block .ab-k { font-size: 8pt; letter-spacing: .2em; text-transform: uppercase; color: var(--gray-2);
  font-weight: 600; margin-bottom: 4mm; padding-bottom: 3mm; border-bottom: 1px solid var(--ink); }
.apx-list { list-style: none; margin: 0; padding: 0; }
.apx-list li { font-size: 9.5pt; line-height: 1.5; color: var(--ink); padding: 3mm 0;
  border-bottom: 1px solid var(--hair-soft); display: flex; justify-content: space-between; gap: 6mm; align-items: baseline; }
.apx-list li:last-child { border-bottom: 0; }
.apx-list li .al-k { color: var(--gray-1); }
.apx-list li .al-v { font-weight: 700; color: var(--ink); text-align: right; white-space: nowrap; }
.apx-list.plain li { display: block; padding: 3.5mm 0; }
.apx-list.plain li .src { color: var(--ink); font-size: 9pt; }
.apx-table { width: 100%; border-collapse: collapse; }
.apx-table th { text-align: left; font-size: 7.2pt; letter-spacing: .18em; text-transform: uppercase;
  color: var(--gray-2); font-weight: 600; padding: 0 0 3mm 0; border-bottom: 1px solid var(--ink); }
.apx-table th.r, .apx-table td.r { text-align: right; }
.apx-table td { font-size: 9.5pt; color: var(--ink); padding: 3mm 0; border-bottom: 1px solid var(--hair-soft); }
.apx-table tr:last-child td { border-bottom: 0; }
.apx-disc { position: absolute; left: var(--mx); right: var(--mx); bottom: 20mm;
  font-size: 7.5pt; line-height: 1.55; color: var(--gray-2); border-top: 1px solid var(--hair); padding-top: 4mm; }
</style>
</head>
<body>

<!-- PAGE 0 — COVER -->
<section class="page cover">
  <div class="frame">
    <div class="cover-top">
      <span class="org">ORACLE STRATEGY GROUP</span>
      <span>Investment Committee Memorandum</span>
    </div>
    <div class="cover-kicker">${esc(location)}</div>
    <h1 class="wordmark">${esc(row.title || 'Investment Memo')}</h1>
    <div class="cover-sub">${esc(row.stakeholder === 'sovereign' ? 'National AI Compute Platform' : 'Strategic Investment Memorandum')}</div>
    <div class="cover-accent"></div>
    <p class="cover-thesis">
      ${exsum.headline
        ? `<span class="q">${esc(exsum.headline.slice(0, 180))}</span>`
        : '<span class="q">"AI is the new gas."</span> Qatar converts abundant, low-cost North Field gas into national AI compute — the highest-value export of the next decade.'}
    </p>
    <div class="cover-foot">
      <div>
        <div class="cf-k">Prepared For</div>
        <div class="cf-v">Investment Committee<br/>&amp; Board of Directors</div>
      </div>
      <div>
        <div class="cf-k">Prepared By</div>
        <div class="cf-v">ORACLE<br/>Strategy Group</div>
      </div>
      <div>
        <div class="cf-k">Location</div>
        <div class="cf-v">${esc(location.split(' · ').join('<br/>'))}</div>
      </div>
      <div>
        <div class="cf-k">Date · Classification</div>
        <div class="cf-v">${esc(projDate)}<br/>Strictly Private &amp; Confidential</div>
      </div>
    </div>
  </div>
</section>

<!-- PAGE 1 — EXECUTIVE SUMMARY -->
<section class="page decision">
  <div class="runhead">
    <span class="rh-name">${esc(row.title)}</span>
    <span class="rh-class">Strictly Private &amp; Confidential</span>
  </div>
  <div class="frame">
    <div class="dec-head">
      <p class="eyebrow"><span class="num">01</span>Executive Summary</p>
      <div class="dec-meta">
        <span class="dm-k">For the Investment Committee — ${esc(projDate)}</span>
        <span class="dec-risk">
          <span class="dm-k">Risk Level</span>
          <span class="rk">${esc(riskLevel)}</span>
        </span>
      </div>
    </div>
    <div class="verdict-block">
      <p class="verdict-eyebrow">Recommendation of the Strategy Group</p>
      <h2 class="verdict">${esc(verdict)}</h2>
      <p class="recommendation">
        ${esc(approveBody.slice(0, 200))}
      </p>
    </div>
    
    <div class="opp-grid" style="margin-top: 5mm; margin-bottom: 5mm;">
      <div class="opp-cell">
        <div class="oc-k">Why This Matters</div>
        <p class="oc-v">${ctx.body ? esc(ctx.body.slice(0, 280)) : 'N/A'}</p>
      </div>
      <div class="opp-cell is-thesis">
        <div class="oc-k">The Thesis</div>
        <p class="oc-v">${exsum.headline ? esc(exsum.headline.slice(0, 220)) : 'N/A'}</p>
      </div>
    </div>

    <div class="figs">
      <div class="fig">
        <div class="fk">Investment Size</div>
        <div class="fv accent tnum">${fmtUsd(snap.total_capex)}</div>
        <div class="fsub">${snap.total_mw ? `${snap.total_mw} MW IT load` : 'Phase 1'}</div>
      </div>
      <div class="fig">
        <div class="fk">IRR (Post-tax · Levered equity)</div>
        <div class="fv tnum">${fmtPct(snap.irr_post_tax ?? snap.irr)}</div>
        <div class="fsub">Base case${snap.irr_post_tax != null ? ` · Pre-tax ${fmtPct(snap.irr)}` : ''}</div>
      </div>
      <div class="fig">
        <div class="fk">NPV (Post-tax)</div>
        <div class="fv tnum">${fmtUsd(snap.npv_post_tax ?? snap.npv)}</div>
        <div class="fsub">Base case${snap.npv_post_tax != null ? ` · Pre-tax ${fmtUsd(snap.npv)}` : ''}</div>
      </div>
      <div class="fig">
        <div class="fk">Payback</div>
        <div class="fv tnum">${snap.payback_years ? snap.payback_years.toFixed(1) + ' yrs' : 'N/A'}</div>
        <div class="fsub">Stabilized from Yr 2–3</div>
      </div>
    </div>
    <div class="decision-required">
      <div class="dr-k">Decision Required</div>
      <div class="dr-v">
        ${esc(reco.decision.replace('{CAPEX}', fmtUsd(snap.total_capex)))}
        ${reco.showApprove && roadmap?.phases?.[0]?.gating_events?.[0] ? ` Condition: ${esc(roadmap.phases[0].gating_events[0])}.` : ''}
      </div>
    </div>
  </div>
  <div class="runfoot">
    <span class="rf-pg">01</span>
    <span class="rf-conf">Strictly Private &amp; Confidential</span>
    <span>${esc(projDate)}</span>
  </div>
</section>

<!-- PAGE 2 — FINANCIAL SUMMARY -->
<section class="page">
  <div class="runhead">
    <span class="rh-name">${esc(row.title)}</span>
    <span class="rh-class">Strictly Private &amp; Confidential</span>
  </div>
  <div class="frame">
    <p class="eyebrow"><span class="num">02</span>Financial Summary</p>
    <h2 class="headline smaller">Financial summary — built on the lowest marginal cost of power.</h2>
    <div class="fin-hero">
      <div class="fin-kpi">
        <div class="fk">Revenue (stabilized)</div>
        <div class="fv tnum">${fmtUsd(stabRevenue)}</div>
        <div class="fs">Engine · per year at stabilization</div>
      </div>
      <div class="fin-kpi">
        <div class="fk">EBITDA Margin</div>
        <div class="fv tnum">${fmtPct(ebitdaMarginRatio)}</div>
        <div class="fs">Engine · ${fmtUsd(stabEbitda)} stabilized</div>
      </div>
      <div class="fin-kpi">
        <div class="fk">IRR (Post-tax)</div>
        <div class="fv accent tnum">${fmtPct(snap.irr_post_tax ?? snap.irr)}</div>
        <div class="fs">${esc(boardLabel('moic'))} ${naIf(boardFormatted(snap, 'moic'))} · Levered equity${snap.irr_post_tax != null ? ` · Pre-tax ${fmtPct(snap.irr)}` : ''}</div>
      </div>
      <div class="fin-kpi">
        <div class="fk">NPV (Post-tax) · Payback</div>
        <div class="fv tnum">${fmtUsd(snap.npv_post_tax ?? snap.npv)}</div>
        <div class="fs">${fmtYr(snap.payback_years)}</div>
      </div>
    </div>
    <div class="returns-comp" style="margin-top:6mm; padding:4mm 5mm; border:0.3mm solid var(--hair); border-radius:1.5mm;">
      <div style="font-size:7.2pt; letter-spacing:.18em; text-transform:uppercase; color:var(--gray-1); font-weight:700; margin-bottom:2.5mm;">Returns Composition</div>
      ${returnsComp.available && returnsComp.operationsPct != null ? `
      <div style="display:flex; justify-content:space-between; font-size:9.5pt; margin-bottom:2mm;">
        <span><b class="tnum">${Math.round(returnsComp.operationsPct * 100)}%</b> Operations</span>
        <span><b class="tnum">${Math.round(returnsComp.terminalPct * 100)}%</b> Terminal value</span>
      </div>
      <div style="display:flex; height:2mm; border-radius:1mm; overflow:hidden; background:var(--whisper);">
        <div style="width:${Math.max(0, Math.min(100, returnsComp.operationsPct * 100))}%; background:var(--gray-1);"></div>
        <div style="width:${Math.max(0, Math.min(100, returnsComp.terminalPct * 100))}%; background:var(--oxblood);"></div>
      </div>` : ''}
      <div style="font-size:8.4pt; color:var(--ink-soft); margin-top:2.5mm;">${esc(returnsComp.note)}</div>
    </div>
    <div class="fin-body">
      <div class="break-avoid">
        <div class="cap-title">CAPEX — ${fmtUsd(snap.total_capex)}${snap.total_mw ? ` · ${snap.total_mw} MW` : ''}</div>
        ${capexRows(snap)}
      </div>
      <div class="sens-wrap">
        <div class="sens-title">IRR Sensitivity — Power Price &amp; Utilization</div>
        ${sensLine(snap.irr_post_tax ?? snap.irr)}
      </div>
    </div>
  </div>
  <div class="runfoot">
    <span class="rf-pg">02</span>
    <span class="rf-conf">Strictly Private &amp; Confidential</span>
    <span>${esc(projDate)}</span>
  </div>
</section>

<!-- PAGE 3 — RISKS -->
<section class="page">
  <div class="runhead">
    <span class="rh-name">${esc(row.title)}</span>
    <span class="rh-class">Strictly Private &amp; Confidential</span>
  </div>
  <div class="frame">
    <p class="eyebrow"><span class="num">03</span>Risk Assessment</p>
    <h2 class="headline smaller">${(risks?.items || []).length} principal risks — each mitigated to the boundary of acceptance.</h2>
    <hr class="accentline" />
    <div class="risk-table">
      <div class="risk-headrow">
        <span class="rh">№</span>
        <span class="rh">Risk &amp; Mitigation</span>
        <span class="rh">Severity</span>
        <span class="rh">Category</span>
      </div>
      ${riskRows(risks)}
    </div>
  </div>
  <div class="runfoot">
    <span class="rf-pg">03</span>
    <span class="rf-conf">Strictly Private &amp; Confidential</span>
    <span>${esc(projDate)}</span>
  </div>
</section>

<!-- PAGE 4 — SCENARIO ANALYSIS -->
<section class="page">
  <div class="runhead">
    <span class="rh-name">${esc(row.title)}</span>
    <span class="rh-class">Strictly Private &amp; Confidential</span>
  </div>
  <div class="frame">
    <p class="eyebrow"><span class="num">04</span>Scenario Analysis</p>
    <h2 class="headline smaller">Base case — the underwriting case for FID. Stress scenarios pending.</h2>
    <div class="scen-grid">
      <div class="scen">
        <div class="sc-name">Downside</div>
        <div class="sc-tag">Not modeled — pending stress engine.</div>
        <div class="sc-irr-k">IRR</div>
        <div class="sc-irr tnum muted-note" style="font-size:14pt;">Not modeled</div>
        <div class="sc-rows">
          <div class="sc-line"><span class="sc-lk">Utilization</span><span class="sc-lv tnum muted-note">not specified</span></div>
          <div class="sc-line"><span class="sc-lk">NPV</span><span class="sc-lv tnum muted-note">not modeled</span></div>
        </div>
      </div>
      <div class="scen base">
        <div class="sc-name">Base</div>
        <div class="sc-tag">${snap.total_mw ? snap.total_mw + ' MW' : 'Base'} at ${(snap.irr_post_tax ?? snap.irr) != null ? fmtPct(snap.irr_post_tax ?? snap.irr) : '—'} post-tax IRR — the underwriting case for FID.</div>
        <div class="sc-irr-k">IRR (Post-tax)</div>
        <div class="sc-irr tnum">${fmtPct(snap.irr_post_tax ?? snap.irr)}</div>
        <div class="sc-rows">
          ${snap.irr_post_tax != null ? `<div class="sc-line"><span class="sc-lk">Pre-tax IRR</span><span class="sc-lv tnum">${fmtPct(snap.irr)}</span></div>` : ''}
          <div class="sc-line"><span class="sc-lk">NPV (Post-tax)</span><span class="sc-lv tnum">${fmtUsd(snap.npv_post_tax ?? snap.npv)}</span></div>
          <div class="sc-line"><span class="sc-lk">Payback</span><span class="sc-lv tnum">${fmtYr(snap.payback_years)}</span></div>
        </div>
      </div>
      <div class="scen">
        <div class="sc-name">Upside</div>
        <div class="sc-tag">Not modeled — pending stress engine.</div>
        <div class="sc-irr-k">IRR</div>
        <div class="sc-irr tnum muted-note" style="font-size:14pt;">Not modeled</div>
        <div class="sc-rows">
          <div class="sc-line"><span class="sc-lk">Utilization</span><span class="sc-lv tnum muted-note">not specified</span></div>
          <div class="sc-line"><span class="sc-lk">NPV</span><span class="sc-lv tnum muted-note">not modeled</span></div>
        </div>
      </div>
    </div>
    <p class="scen-note">
      <b>Base case is model-derived.</b> Downside and upside scenarios are not yet modeled —
      a full three-scenario stress engine (separate utilization + power price runs) is pending.
      Only the base case figures are presented here; no estimated IRR or NPV is shown for Downside or Upside.
    </p>
  </div>
  <div class="runfoot">
    <span class="rf-pg">04</span>
    <span class="rf-conf">Strictly Private &amp; Confidential</span>
    <span>${esc(projDate)}</span>
  </div>
</section>

<!-- PAGE 5 — RECOMMENDATION -->
<section class="page">
  <div class="runhead">
    <span class="rh-name">${esc(row.title)}</span>
    <span class="rh-class">Strictly Private &amp; Confidential</span>
  </div>
  <div class="frame">
    <p class="eyebrow"><span class="num">05</span>Recommendation</p>
    <h2 class="headline smaller">${esc(reco.page5)}</h2>
    <hr class="accentline" />
    <div class="rec-two">
      <div class="rec-card${reco.showApprove ? ' go' : ' hold'}">
        <div class="rc-k">${esc(reco.cardLabel)}</div>
        <div class="rc-v">${esc(approveBody.slice(0, 320))}</div>
      </div>
      <div class="rec-card hold">
        <div class="rc-k">Do Not Approve Yet</div>
        <div class="rc-v">${esc(holdBody)}</div>
      </div>
    </div>
    ${roadmap?.phases?.[0]?.gating_events?.length ? `
    <div class="conditions">
      <div class="cd-title">Conditions Precedent</div>
      ${condRows(roadmap)}
    </div>` : ''}
    ${roadmap?.phases?.length ? `
    <div class="timeline">
      <div class="tl-title">Next Steps</div>
      <div class="tl-track">
        ${timelineStops(roadmap)}
      </div>
    </div>` : ''}
    <p class="rec-quote">${esc(committeeQuote)}</p>
  </div>
  <div class="runfoot">
    <span class="rf-pg">05</span>
    <span class="rf-conf">Strictly Private &amp; Confidential</span>
    <span>${esc(projDate)}</span>
  </div>
</section>

<!-- PAGE 6 — APPENDIX -->
<section class="page">
  <div class="runhead">
    <span class="rh-name">${esc(row.title)}</span>
    <span class="rh-class">Strictly Private &amp; Confidential</span>
  </div>
  <div class="frame">
    <p class="eyebrow"><span class="num">06</span>Appendix</p>
    <h2 class="headline smaller">Sources, assumptions &amp; supporting data.</h2>
    <div class="apx-grid">
      <div class="apx-block">
        <div class="ab-k">Model Assumptions</div>
        <ul class="apx-list">
          ${assumptions(snap, fin)}
        </ul>
      </div>
      <div class="apx-block">
        <div class="ab-k">Sources</div>
        <ul class="apx-list plain">
          ${sourcesList(cb, fin)}
        </ul>
      </div>
      <div class="apx-block">
        <div class="ab-k">Supporting Data — CAPEX</div>
        <table class="apx-table">
          <thead><tr><th>Component</th><th class="r">Amount</th></tr></thead>
          <tbody>
            <tr style="font-weight:700"><td>Total CAPEX</td><td class="r tnum">${fmtUsd(snap.total_capex)}</td></tr>
          </tbody>
        </table>
        <div class="muted-note" style="margin-top:4mm;">Component breakdown not modeled.</div>
      </div>
      <div class="apx-block">
        <div class="ab-k">Supporting Data — Contract &amp; Structure</div>
        <table class="apx-table">
          <thead><tr><th>Item</th><th class="r">Terms</th></tr></thead>
          <tbody>${contractTable(fin)}</tbody>
        </table>
      </div>
    </div>
    <div class="apx-disc">
      This memorandum has been prepared by the ORACLE Strategy Group for the Investment Committee and Board of Directors on a strictly private and
      confidential basis. Figures are derived from ORACLE internal model v${esc(String(row.version || 1))} and the sources listed; forward-looking estimates are
      subject to execution, market and macroeconomic conditions. AI-assisted — human review required. Not for distribution.
      Memo ID: ${esc(row.id)} · Generated ${esc(new Date(row.created_at).toISOString())} · Model: ${esc(row.provider_used || 'n/a')}.
    </div>
  </div>
  <div class="runfoot">
    <span class="rf-pg">06</span>
    <span class="rf-conf">Strictly Private &amp; Confidential</span>
    <span>${esc(projDate)}</span>
  </div>
</section>

</body></html>`;
}

// ── Route handler (unchanged) ─────────────────────────────────────────────────

export async function GET(_req, { params }) {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;
  try {
    await requireRowOwnership({
      table: 'strategic_memos',
      id: params.id,
      actorId: auth.actor,
      allowSharedWorkspace: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const supa = getAdminClient();
  const { data: row, error } = await supa.from('strategic_memos').select('*').eq('id', params.id).maybeSingle();
  if (error) return dbErrorResponse(error, '[strategic-memos/[id]/pdf][GET]');
  if (!row) return notFoundResponse();

  let browser;
  try {
    // On Vercel (read-only fs, no bundled Chrome), use @sparticuz/chromium + puppeteer-core.
    // Locally, fall back to the full puppeteer package which ships its own Chrome.
    const isVercel = !!process.env.VERCEL;
    let puppeteer, launchOptions;
    if (isVercel) {
      const chromium   = (await import('@sparticuz/chromium')).default;
      puppeteer        = (await import('puppeteer-core')).default;
      launchOptions    = {
        args:            chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath:  await chromium.executablePath(),
        headless:        chromium.headless,
      };
    } else {
      puppeteer     = (await import('puppeteer')).default;
      launchOptions = { headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    }
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(buildHtml(row), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    const filename = `oracle-memo-${(row.title || 'memo').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-v${row.version}.pdf`;
    return new NextResponse(Buffer.from(pdf), { status: 200, headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    }});
  } catch (e) {
    if (browser) { try { await browser.close(); } catch {} }
    console.error('[pdf/route] pdf_generation_failed', e);
    return NextResponse.json({ error: 'pdf_generation_failed' }, { status: 500 });
  }
}
