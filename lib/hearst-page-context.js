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
  '/admin/hearst/about': {
    title: 'How it works',
    mission: 'Educational primer. The user is learning data center business models, key actors (hyperscalers, operators, neoclouds), and financial vocabulary.',
    keyTerms: ['retail colocation', 'wholesale colocation', 'hyperscale lease', 'powered shell', 'sovereign AI', 'PUE', 'CAPEX/MW', 'IRR', 'NPV', 'MOIC', 'DSCR', 'terminal value'],
    advisorTips: 'Be a teacher. Answer in plain language with concrete examples. When the user asks about a term, give: (1) one-sentence definition, (2) one example from the public sources library (Equinix, Digital Realty, NTT, Compass, Brookfield, etc.), (3) one Qatar-specific implication. Avoid jargon stacking.',
    suggestedPrompts: [
      'Explain the difference between wholesale colocation and powered shell for Qatar',
      'What does Equinix typically negotiate with sovereign partners?',
      'Why is DLC mandatory for GB200 racks in Qatar?',
    ],
  },

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

  '/admin/hearst/assumptions': {
    title: 'Assumptions',
    mission: 'The user is entering and sourcing the financial inputs that drive the 10-year projection. Every value must be sourced (Official / Uploaded / Admin Input / Calculated).',
    keyFields: [
      'total_mw (IT capacity MW)',
      'pue (Power Usage Effectiveness, 1.08–1.6)',
      'electricity_price_mwh ($/MWh, KAHRAMAA Qatar ~$30–45)',
      'target_occupancy_pct (% stabilized, 80–95)',
      'capex_shell_per_mw / capex_mep_per_mw / capex_substation_per_mw / capex_cooling_per_mw / capex_grid_per_mw / capex_land_per_mw ($/MW)',
      'price_retail_colo_kw_month / price_wholesale_kw_month / price_hyperscale_kw_month ($/kW/mo)',
      'debt_pct (0–95%), debt_interest_rate (% annual)',
      'equity_hearst_pct / equity_brookfield_pct / equity_qatar_pct',
      'exit_multiple (12–22× EBITDA), exit_year (default 10)',
    ],
    qatarDefaults: 'PUE 1.4–1.5 (with DLC), electricity $30–45/MWh, retail colo $140–180/kW/mo (~20% below NoVA), capex shell ~$4M/MW, capex MEP ~$3M/MW, debt 60–70%, debt interest 5.5–7%, exit multiple 14–18×.',
    advisorTips: 'For each missing field, propose: (1) a typical Qatar value with order-of-magnitude, (2) the public source from PUBLIC_SOURCES_LIBRARY that justifies it, (3) the source_type (official_source vs admin_input vs calculated). Use the create_source tool then attach_source_to_scenario in one flow. ALWAYS source what you fill.',
    suggestedPrompts: [
      'Fill the Base Case with sourced Qatar defaults',
      'What PUE should I use? Source it from KAHRAMAA + Uptime Institute',
      'Recommend a CAPEX breakdown for a 100 MW liquid-ready hyperscale shell',
    ],
  },

  '/admin/hearst/sources': {
    title: 'Source Ledger',
    mission: 'The user is managing the source ledger — the evidentiary backbone of the model. Every metric must have at least one source (with confidence_score 1–5, geography, date_published, page reference, applicability_to_qatar).',
    keyFields: ['metric_id', 'metric_name', 'source_type (official_source|uploaded_document|admin_input|calculated|contract)', 'source_name', 'source_url', 'value', 'confidence_score (1–5)', 'geography', 'date_published', 'page_number', 'quoted_excerpt', 'applicability_to_qatar', 'triangulation_status'],
    publicLibrary: 'Use the 16 sources in PUBLIC_SOURCES_LIBRARY: JLL Global DC Outlook, CBRE Global DC Trends, Turner & Townsend Construction Cost Index, Uptime Institute Tier standards, QIA/Brookfield/Qai $20B AI Infrastructure release, KAHRAMAA Qatar tariff, Equinix 10-K, Digital Realty 10-K, NTT Global DC, Lambda AI Pricing, NVIDIA GB200 NVL72, SEC MCSA, SEC Turn Key DC lease, Mayer Brown DC contracts, Ooredoo MENA Digital Hub.',
    advisorTips: 'When the user asks "what source for X?", look up the metric in PUBLIC_SOURCES_LIBRARY and propose a triangulation (2 sources minimum for CAPEX, ideally 3 for KAHRAMAA pricing). For Qatar-specific values that no public source covers, mark source_type=admin_input and warn the user that the value needs internal triangulation.',
    suggestedPrompts: [
      'Add the KAHRAMAA tariff as the source for electricity_price_mwh',
      'Triangulate capex_shell_per_mw with 2 sources from PUBLIC_SOURCES_LIBRARY',
      'List all metrics that have no source yet',
    ],
  },

  '/admin/hearst/financial': {
    title: 'Financial Projection',
    mission: 'The user is reviewing the 10-year financial projection: revenue ramp, EBITDA margin, FCF, DSCR, IRR, NPV, MOIC, payback, terminal value. If the projection cannot run, smart alerts are surfaced.',
    keyOutputs: ['years[].revenue', 'years[].power_cost', 'years[].opex', 'years[].ebitda / ebitda_margin', 'years[].free_cash_flow / cumulative_fcf', 'years[].dscr', 'total_capex', 'terminal_value', 'irr', 'npv', 'moic', 'payback_years', 'dscr_stabilized'],
    advisorTips: 'Explain what each KPI means in PLAIN ENGLISH plus the formula. If IRR < target IRR (set in assumptions), identify the 2 levers with the highest sensitivity (typically electricity price and target occupancy). Run a stress test using the existing scenario without persisting.',
    suggestedPrompts: [
      'Run a stress test: electricity at $60/MWh, occupancy at 75%',
      'Explain why DSCR is 3.7x and what lenders typically require',
      'Compare IRR sensitivity to PUE 1.4 vs 1.6',
    ],
  },

  '/admin/hearst/data-room': {
    title: 'Data Room',
    mission: 'The user is tracking the 25+ required documents (corporate, land, power, permits, technical, commercial, financial, legal, ESG, tax, insurance). Each document has status missing→in_progress→uploaded→reviewed→approved.',
    requiredDocs: 'The 25 required docs are pre-seeded with categories and linked metric_ids. Critical for first close: Land Title, Power Allocation Letter, KAHRAMAA Tariff/PPA, Substation Status, EPC Quote, MEP Quote, Cooling Proposal, Operator LOIs, Financing Term Sheets, Brookfield Term Sheet, Legal Structure Memo.',
    advisorTips: 'When data room is < 60% reviewed, prioritise: (1) docs that unblock financial inputs (Power Allocation → electricity_price_mwh; EPC Quote → capex_shell), (2) docs that unblock the deal (Brookfield Term Sheet, Legal Memo), (3) the rest. Highlight which docs are blocking which scenario fields.',
    suggestedPrompts: [
      'Which missing documents are blocking my source score?',
      'What is a typical Power Allocation Letter from KAHRAMAA?',
      'List the 5 most critical docs to close Phase 1 financing',
    ],
  },

  '/admin/hearst/contracts': {
    title: 'Contract Library',
    mission: 'The user manages the public + uploaded contract library (lease structures, MCSAs, term sheets). Status: draft → negotiation → executed.',
    keyEntities: ['document_type (lease, mcsa, term_sheet, ppa, government_source, market_report)', 'source_org (Equinix, DR, NTT, Brookfield, SEC, Mayer Brown)', 'jurisdiction', 'extracted_clauses', 'extracted_numbers', 'usable_in_model', 'confidence (1–5)'],
    advisorTips: 'When the user asks about a contract clause (e.g. "what is a typical NNN escalator?"), reference the SEC Turn Key DC Lease + Mayer Brown DC contracts memo. For Qatar-specific contracts, flag that we are negotiating with Equinix/NTT/DR and that the relevant comp is Equinix-Omantel MC1 + Equinix Jeddah $1B.',
    suggestedPrompts: [
      'What escalator rate is typical for hyperscaler NNN leases?',
      'Show me the public Master Colocation Services Agreement structure',
      'How does the Equinix-Omantel JV brand its building?',
    ],
  },

  '/admin/hearst/pipeline': {
    title: 'Commercial Pipeline',
    mission: 'The user tracks commercial prospects (hyperscalers, operators, neoclouds, sovereigns) at stages prospect → loi → term_sheet → contracted. Each prospect has mw_requested, target_price_kw_month, probability_pct, expected_signing_date, contract_length_years.',
    advisorTips: 'For each prospect, suggest: typical contract structure (NNN 15-yr for MSFT, 10-yr for Equinix anchor, 1–3 yr for CoreWeave), realistic probability_pct based on market 2024-25 (NoVA 74% pre-leased → demand outpacing supply), and target_price_kw_month benchmarked to the GCC discount (~20% below US tier-1).',
    suggestedPrompts: [
      'Add Microsoft as a prospect: 80 MW, hyperscale lease, 15 years',
      'What is a realistic probability_pct for Equinix anchor in Phase 1?',
      'List which hyperscalers are most active in 2024-25',
    ],
  },

  '/admin/hearst/risks': {
    title: 'Risk Dashboard',
    mission: 'The user rates and tracks project risks across categories (site, power, technical, commercial, financial, geopolitical, regulatory). Plus smart alerts (PUE not sourced, electricity not from PPA, etc.).',
    advisorTips: 'For each risk the user rates, propose a mitigation strategy referencing real comparables (e.g. greenfield site execution risk → use Brookfield-Compass single-tenant white-label template). For Qatar-specific risks (US AI Diffusion Rule, geopolitical), reference the actual May 2026 framework: Qatar Tier 2 VEU case-by-case, no blanket ban.',
    suggestedPrompts: [
      'What is the biggest risk on this project right now and how to mitigate?',
      'Explain the US AI Diffusion Rule impact for Qatar',
      'Rate the supply chain risk on liquid cooling for GB200 racks',
    ],
  },

  '/admin/hearst/timeline': {
    title: 'Timeline / Gantt',
    mission: 'The user reviews development phases (development → financial close → construction → commissioning → operations → expansion) with milestones derived from planned_cod and construction_months in Assumptions.',
    advisorTips: 'Typical Qatar timeline: 4 months dev + permits, 3 months financial close, 18 months construction (vs 14 months US — climate + supply chain premium), 2 months commissioning. Total ground-break to COD ~27 months. If site_readiness=greenfield, add 12 months upfront.',
    suggestedPrompts: [
      'Is 18 months construction realistic for a 100 MW liquid-ready shell in Qatar?',
      'What milestones must be hit to keep the COD date?',
      'Compare Phase 1 timeline to Equinix Jeddah ($1B/100MW, Feb 2025 announce)',
    ],
  },

  '/admin/hearst/scenarios': {
    title: 'Scenario Comparison',
    mission: 'The user compares Base / Downside / Upside scenarios side-by-side and creates custom scenarios. Each scenario is fully independent (own inputs and own sources).',
    advisorTips: 'Help the user calibrate Downside and Upside. Downside should stress: electricity +50%, occupancy -15pp, capex +20%, exit_multiple -3×. Upside: electricity -10%, occupancy +5pp, retail colo price +10%, exit_multiple +3×. Never invent values — clone the Base then PATCH the stress deltas.',
    suggestedPrompts: [
      'Build a realistic Downside scenario from the Base',
      'Why does my Upside IRR look unrealistic?',
      'Create a custom scenario for the 200 MW Phase 2 expansion',
    ],
  },

  '/admin/hearst/deal-simulator': {
    title: 'Deal Structure Simulator',
    mission: 'The user explores the 5 deal archetypes: Powered Shell + NNN (RECO), Branded JV 51/49, Manage-Only, White-Label (Compass), Sale-Leaseback. Read-only computational tool — does NOT persist to scenarios.',
    advisorTips: 'Recommend Powered Shell + NNN with Equinix anchor for Phase 1 + Compass white-label for the residual 30%. The Meta×Blue Owl Hyperion $27B deal (Oct 2025) is the closest analog. Equinix has never accepted brand subordination, so the only way HEARST keeps its name on the building is the powered shell + tenant-lease structure.',
    suggestedPrompts: [
      'Why is Powered Shell + NNN recommended for HEARST over Branded JV?',
      'Compare HEARST equity invested across the 5 archetypes',
      'What 3 deal terms should I negotiate hard with Equinix?',
    ],
  },

  '/admin/hearst/reports': {
    title: 'Reports & Export',
    mission: 'The user generates investor-grade reports (PDF via print) summarising project overview, financial summary, scenario comparison, sourcing compliance, and disclaimers.',
    advisorTips: 'Before exporting, audit: source_score ≥ 70 (else flag in disclaimer), missing_inputs count, alerts severity. Recommend running the audit chip first. The report is meant for Brookfield/QIA/MSFT board-level review, so quote actual numbers (no N/A in headline KPIs).',
    suggestedPrompts: [
      'Generate an investor report for the Base Case',
      'Is my source score high enough to share with Brookfield?',
      'What disclaimers should appear if source_score < 70?',
    ],
  },

  '/admin/hearst/audit': {
    title: 'Audit Trail',
    mission: 'The user reviews the full change log: which actor changed what field, when, with previous and new values. Used for compliance + accountability.',
    advisorTips: 'When the user asks "who changed X?", summarise the audit_log entries for that field. For governance, recommend that material scenario changes (debt_pct, exit_multiple, total_mw) require admin role + a comment explaining the rationale.',
    suggestedPrompts: [
      'Who last changed the PUE on the Base scenario?',
      'Summarise all changes in the last 24 hours',
      'List every time exit_multiple was modified',
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
 * (so /admin/hearst/scenarios/abc-123 resolves to the scenarios page).
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
