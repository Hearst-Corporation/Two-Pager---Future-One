// lib/hearst-page-context.js
// Per-route knowledge base injected into the HEARST Advisor system prompt.
// When a user is on /admin/hearst/<route>, the advisor receives:
//   - title + mission of the page (what the user is trying to accomplish)
//   - key fields / entities on that page (so it can speak about them precisely)
//   - field-level tips (how to fill, typical Qatar values, sourcing requirements)
//   - 3-4 suggested prompts surfaced as quick chips
//
// The advisor uses this to give CONTEXT-AWARE help: explaining the page,
// guiding the user through the field, recommending values, anticipating
// the next step.

export const HEARST_PAGE_CONTEXT = {
  '/admin/hearst': {
    title: 'Overview',
    mission: 'The user is reviewing high-level project state: source compliance, data room completeness, active scenario KPIs, and smart alerts.',
    keyFields: ['source_score', 'data room completeness', 'active scenario IRR/NPV/EBITDA/DSCR', 'critical alerts'],
    advisorTips: 'Lead with the WORST thing visible right now. If source_score < 50, name the top 3 missing sources. If alerts are critical, explain WHICH input is unsourced and WHY it blocks the financial engine. Recommend exactly one next action.',
    suggestedPrompts: [
      'Audit current state and give 3 next actions',
      'Why is my IRR showing N/A?',
      'Which sources should I add first to unblock the projection?',
    ],
  },

  '/admin/hearst/simulator': {
    title: 'Investment Simulator',
    mission: 'The user is building and stress-testing an investment scenario: picking a deal archetype, equipment mix, and starting point (MW / Capital / IRR target), then reviewing the 10-year projection (IRR, NPV, MOIC, DSCR, payback). They can save the plan and generate a strategic memo.',
    keyFields: [
      'mode (mw_first | capital_first | target_irr_first)',
      'total_mw (IT capacity MW)',
      'capital_usd (equity capital $)',
      'target_irr_pct (%)',
      'primary_archetype_id (powered_shell | branded_jv | manage_only | white_label | sale_leaseback)',
      'hardware_mix (classic_pct / liquid_pct / ai_pct / gpu_sku_id / utilization_pct / gpu_hour_price)',
    ],
    keyOutputs: ['projection.irr', 'projection.npv', 'projection.moic', 'projection.payback_years', 'projection.dscr_stabilized', 'projection.total_capex', 'projection.terminal_value', 'projection.stabilized_revenue', 'projection.stabilized_ebitda'],
    advisorTips: 'When the user asks about a KPI, give: (1) plain-English definition, (2) formula used by the engine (lib/hearst-calculations.js), (3) Qatar benchmark range. For mode=target_irr_first, explain which lever (pricing / capex / leverage / MW) is most sensitive. Recommend powered_shell + Equinix anchor as the baseline scenario.',
    suggestedPrompts: [
      'What deal archetype should I use for a 100 MW Qatar greenfield?',
      'Stress-test: what happens to IRR if electricity goes to $60/MWh?',
      'Explain the difference between MOIC and IRR for my investors',
    ],
  },

  '/admin/hearst/dossier': {
    title: 'Decision Canvas & Memo Approval',
    mission: 'The user reviews and approves strategic memos generated from simulator scenarios. This is the institutional approval surface for investment decisions.',
    advisorTips: 'Help the user assess whether a memo is ready for institutional sign-off. Check that the underlying scenario has all key KPIs (IRR, NPV, MOIC, DSCR), that the deal archetype recommendation is justified (powered_shell + Equinix anchor default), and that the capital stack (HEARST + Brookfield + Qatar sovereign) is correctly documented.',
    suggestedPrompts: [
      'Is this memo ready for Brookfield/QIA review?',
      'What are the 3 key risks I should flag in this investment decision?',
      'Summarise the investment thesis in 3 bullet points',
    ],
  },
};

const DEFAULT_CONTEXT = {
  title: 'HEARST Module',
  mission: 'The user is somewhere in the HEARST module.',
  advisorTips: 'Use the state snapshot to figure out where the user likely is. Suggest navigating to a specific tab if the question is about a topic that has its own page.',
  suggestedPrompts: [
    'Audit current state and give 3 next actions',
    'Where should I start with this dashboard?',
  ],
};

/**
 * Look up page context by pathname. Exact match first, then prefix match
 * (so /admin/hearst/dossier/abc-123 resolves to the dossier page).
 */
export function getPageContext(pathname) {
  if (!pathname) return DEFAULT_CONTEXT;
  if (HEARST_PAGE_CONTEXT[pathname]) return HEARST_PAGE_CONTEXT[pathname];
  // Try prefix match (longest first)
  const keys = Object.keys(HEARST_PAGE_CONTEXT).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (pathname.startsWith(k)) return HEARST_PAGE_CONTEXT[k];
  }
  return DEFAULT_CONTEXT;
}

/**
 * Build the system-prompt text block for a given page context. Server-side.
 */
export function buildPageContextBlock(pageContext) {
  if (!pageContext) return null;
  const lines = [
    `# Current page context`,
    `**Page:** ${pageContext.title}`,
    `**User mission:** ${pageContext.mission}`,
  ];
  if (pageContext.keyFields) lines.push(`**Key fields visible to user:** ${(pageContext.keyFields || []).join(', ')}`);
  if (pageContext.keyOutputs) lines.push(`**Key outputs visible:** ${(pageContext.keyOutputs || []).join(', ')}`);
  if (pageContext.keyTerms) lines.push(`**Key terms in scope:** ${(pageContext.keyTerms || []).join(', ')}`);
  if (pageContext.qatarDefaults) lines.push(`**Qatar defaults:** ${pageContext.qatarDefaults}`);
  if (pageContext.publicLibrary) lines.push(`**Public library focus:** ${pageContext.publicLibrary}`);
  if (pageContext.requiredDocs) lines.push(`**Required documents:** ${pageContext.requiredDocs}`);
  if (pageContext.keyEntities) lines.push(`**Key entities:** ${(pageContext.keyEntities || []).join(', ')}`);
  lines.push(`**Advisor tips:** ${pageContext.advisorTips}`);
  if (pageContext.simulation_live) {
    const safe = String(pageContext.simulation_live)
      .replace(/`/g, "'")
      .replace(/<[^>]*>/g, '')
      .slice(0, 500);
    lines.push(`**SIMULATION EN COURS (valeurs live des sliders):** ${safe}`);
  }
  return { type: 'text', text: lines.join('\n\n') };
}
