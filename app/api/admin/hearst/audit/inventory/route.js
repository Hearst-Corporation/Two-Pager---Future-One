// GET /api/admin/hearst/audit/inventory
//
// Snapshot du "moteur" du simulateur Hearst pour la page /admin/hearst/engine :
//   - counts par table Supabase (hearst_*)
//   - counts par catalog JS (PUBLIC_SOURCES_LIBRARY, DEAL_ARCHETYPES, GPU_CATALOG, …)
//   - liste explicite des magic numbers (avec valeur + fichier + ligne)
//   - état des env vars critiques
//
// Read-only, aucune mutation. Auth viewer suffit.

import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { PUBLIC_SOURCES_LIBRARY, OPERATORS, BUSINESS_MODELS, CLIENT_TYPES, SITE_READINESS } from '@/lib/hearst-constants';
import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { GPU_CATALOG } from '@/lib/hearst-gpu-catalog';
import { FIT_MATRIX } from '@/lib/hearst-fit-matrix';

const TABLES = [
  'hearst_projects',
  'hearst_scenarios',
  'hearst_sources',
  'hearst_contracts',
  'hearst_data_room',
  'hearst_pipeline',
  'hearst_gpu_catalog',
  'hearst_deals',
  'hearst_audit_log',
];

// Magic numbers répartis dans les libs de calcul — surfacés pour audit.
// Chaque entrée : { id, label, value, unit, file, line, why, suggested_action }
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;
const STALE_THRESHOLD_MONTHS = 18;

const MAGIC_NUMBERS = [
  {
    id: 'maintenance_capex_pct',
    label: 'Maintenance CAPEX (% of revenue)',
    value: 0.02, unit: 'ratio',
    file: 'lib/hearst-calculations.js', line: 17,
    why: 'CBRE H1 2025 — operator O&M 1.5–2.5% pour DC stabilisé.',
    suggested_action: 'Varier par archetype : colocation 1–2%, GPU cloud 4–5% (refresh hardware).',
  },
  {
    id: 'pref_rate',
    label: 'Preferred return rate (waterfall)',
    value: 0.08, unit: 'ratio',
    file: 'lib/hearst-calculations.js', line: 611,
    why: 'Convention infra LP : pref hurdle 8% avant catch-up GP.',
    suggested_action: 'Devrait varier par tier (LP=8%, GP=12%) et par devise (USD vs QAR).',
  },
  {
    id: 'host_overhead',
    label: 'GPU host overhead (rack power)',
    value: 1.15, unit: 'multiplier',
    file: 'lib/hearst-gpu-catalog.js', line: 112,
    why: 'host CPUs + switching + storage représentent ~15% de la puissance GPU brute.',
    suggested_action: 'Devrait varier par class : retail 1.05, enterprise 1.10, hyperscale 1.15.',
  },
  {
    id: 'hardware_markup',
    label: 'GPU integration markup (CAPEX)',
    value: 1.15, unit: 'multiplier',
    file: 'lib/hearst-gpu-catalog.js', line: 126,
    why: 'Integration + switching + host CPUs hors MSRP GPU brut.',
    suggested_action: 'GB200 (rack-scale) markup réel ~5%; H100 white-box ~15%; séparer.',
  },
  {
    id: 'qatar_capital_gains_tax',
    label: 'Qatar capital gains tax on exit',
    value: 0.10, unit: 'ratio',
    file: 'lib/hearst-deal-structures.js', line: 30,
    why: 'Law No. 24/2018 — 10% capital gains on non-Qatari investors. QFZA Free Zone peut exempter.',
    suggested_action: 'Param par scenario.tax_regime (qfza_exempt | standard_10pct).',
  },
  {
    id: 'default_dev_margin',
    label: 'Developer margin fallback',
    value: 0.15, unit: 'ratio',
    file: 'lib/hearst-deal-structures.js', line: 24,
    why: 'CBRE H1 2025 — 12–18% dev margin sur hyperscale shell.',
    suggested_action: 'OK comme fallback; jamais déclenché si EBITDA stabilisé connu.',
  },
  {
    id: 'occupancy_ramp',
    label: 'Occupancy ramp (10 years)',
    value: '[0, 0.25, 0.45, 0.60, 0.70, 0.78, 0.84, 0.88, 0.91, 0.93, 0.95]',
    unit: 'array',
    file: 'lib/hearst-calculations.js', line: 196,
    why: 'Ramp linéaire-puis-asymptote pour stabilisation à 95% en yr10.',
    suggested_action: 'Devrait varier par archetype (hyperscale → 80% yr3, retail → 80% yr5).',
  },
  {
    id: 'minority_equity_default',
    label: 'Default minority equity share',
    value: 0.20, unit: 'ratio',
    file: 'app/api/admin/hearst/simulate/route.js', line: 45,
    why: 'Fallback quand archetype.equity_share manquant pour archetype minority_equity.',
    suggested_action: 'Tous les minority_equity archetypes devraient définir equity_share — ce fallback ne doit JAMAIS être utilisé en prod.',
  },
  {
    id: 'irr_bisection_tol',
    label: 'Target IRR convergence tolerance',
    value: 0.001, unit: 'ratio',
    file: 'lib/hearst-solver.js', line: '~80',
    why: 'Bisection s\'arrête quand |IRR − target| ≤ 0.1%.',
    suggested_action: 'OK pour usage UI; pour reports exécutifs passer à 0.0001 (1 bp).',
  },
  {
    id: 'capex_contingency_default',
    label: 'Default capex contingency (%)',
    value: 10, unit: 'percent',
    file: 'lib/hearst-bootstrap.js', line: 98,
    why: 'Contingency standard infra hors greenfield.',
    suggested_action: 'Devrait utiliser SITE_READINESS.contingency_pct (greenfield → 15–20%).',
  },
  {
    id: 'equity_split_default',
    label: 'Default equity split (Hearst/Brookfield/Qatar)',
    value: '20% / 55% / 25%',
    unit: 'percent triple',
    file: 'lib/hearst-bootstrap.js', line: '104-106',
    why: 'Narrative Hearst minority + Brookfield infra lead + Qatar sovereign.',
    suggested_action: 'Param par scenario; aujourd\'hui hardcodé dans bootstrap.',
  },
  {
    id: 'debt_interest_rate_default',
    label: 'Default debt interest rate',
    value: 6.5, unit: 'percent',
    file: 'lib/hearst-bootstrap.js', line: 107,
    why: 'SOFR + spread infra DC 2025 (~250 bps over SOFR).',
    suggested_action: 'Varier par archetype : powered_shell (AAA tenant) → 4.5–5.5%; GPU cloud → 7–8%.',
  },
];

// Critical formulas inventory — chemins de calcul nommés (file:line)
const CRITICAL_FORMULAS = [
  { id: 'calcEnergyCost', file: 'lib/hearst-calculations.js', line: 21, formula: 'it_mw × pue × 8760 × electricity_price_mwh' },
  { id: 'calcOccupiedKw', file: 'lib/hearst-calculations.js', line: 28, formula: 'it_mw × 1000 × occupancy_pct/100' },
  { id: 'calcColoRevenue', file: 'lib/hearst-calculations.js', line: 34, formula: 'occupied_kw × monthly_price_kw × 12' },
  { id: 'calcGpuRevenue', file: 'lib/hearst-calculations.js', line: 46, formula: 'num_gpus × util/100 × 8760 × gpu_hour_price' },
  { id: 'calcEbitda', file: 'lib/hearst-calculations.js', line: 58, formula: 'revenue − power_cost − opex' },
  { id: 'calcIrr', file: 'lib/hearst-calculations.js', line: '~120', formula: 'Newton-Raphson NPV=0 (max 200 iter)' },
  { id: 'calcNpv', file: 'lib/hearst-calculations.js', line: '~95', formula: 'Σ CF_t / (1+r)^t' },
  { id: 'generateProjection', file: 'lib/hearst-calculations.js', line: '~150', formula: '10y ramp via occupancy_ramp[] · EBITDA · FCF · debt service · TV' },
  { id: 'generateDebtSchedule', file: 'lib/hearst-calculations.js', line: '~320', formula: 'French annuity post IO window' },
  { id: 'generateWaterfall', file: 'lib/hearst-calculations.js', line: '~600', formula: '3-tier : debt service → pref return 8% → residual par equity share' },
  { id: 'foldGpuRevenue', file: 'lib/hearst-calculations.js', line: '~420', formula: 'Merge GPU revenue dans projection avec ramp (rfs_year + ramp_years)' },
  { id: 'solveScenarioForMode', file: 'lib/hearst-solver.js', line: '~120', formula: 'capital→MW (linéaire) | target_irr→lever (bisection)' },
  { id: 'mwFromCapital', file: 'lib/hearst-solver.js', line: '~50', formula: 'capital / (Σ capex_per_mw × (1 + contingency))' },
  { id: 'bootstrapScenarioFromSources', file: 'lib/hearst-bootstrap.js', line: 87, formula: 'median(PUBLIC_SOURCES_LIBRARY filtré géo) → scenario fields' },
  { id: 'applyArchetype', file: 'lib/hearst-deal-structures.js', line: '~200', formula: 'scale revenue/opex/capex par archetype factors + adjust debt rate' },
  { id: 'projectArchetype', file: 'lib/hearst-deal-structures.js', line: '~280', formula: 'applyArchetype → generateProjection → score' },
];

// Pipeline stages : ordonné, donne la séquence du simulateur
const PIPELINE_STAGES = [
  { id: 'state', label: 'UI State', file: 'lib/hearst-simulator-state.js', kind: 'state', desc: 'INITIAL_STATE + reducer + URL hydration' },
  { id: 'payload', label: 'Build Payload', file: 'lib/hearst-simulator-state.js#buildSimulatePayload', kind: 'serialize', desc: 'Reduce reducer state → POST body' },
  { id: 'bootstrap', label: 'Bootstrap defaults', file: 'lib/hearst-bootstrap.js#bootstrapScenarioFromSources', kind: 'data', desc: 'Median sur PUBLIC_SOURCES_LIBRARY géofiltré' },
  { id: 'solver', label: 'Solve mode', file: 'lib/hearst-solver.js#solveScenarioForMode', kind: 'math', desc: 'capital→MW · target_irr→lever (bisection)' },
  { id: 'archetype', label: 'Apply archetype', file: 'lib/hearst-deal-structures.js#projectArchetype', kind: 'rules', desc: 'Scale capex/revenue/opex par DEAL_ARCHETYPES factors' },
  { id: 'projection', label: '10y projection', file: 'lib/hearst-calculations.js#generateProjection', kind: 'math', desc: 'occupancy_ramp × revenue × EBITDA × FCF + TV' },
  { id: 'fold', label: 'Fold GPU revenue', file: 'lib/hearst-calculations.js#foldGpuRevenue', kind: 'math', desc: 'Merge GPU economics si hardware_mix.ai_pct > 0' },
  { id: 'debt', label: 'Debt schedule', file: 'lib/hearst-calculations.js#generateDebtSchedule', kind: 'math', desc: 'Amortissement annuity post IO window' },
  { id: 'waterfall', label: 'Equity waterfall', file: 'lib/hearst-calculations.js#generateWaterfall', kind: 'rules', desc: '3-tier debt → pref 8% → résidu par equity_share' },
  { id: 'response', label: 'API response', file: 'app/api/admin/hearst/simulate/route.js', kind: 'serialize', desc: 'JSON { scenario, projection, waterfall, debt_schedule, archetype_outcome, source_map, confidence_score, solver }' },
];

async function countRow(supa, table) {
  try {
    const { count, error } = await supa.from(table).select('*', { count: 'exact', head: true });
    if (error) return { table, error: error.message };
    return { table, count: count ?? 0 };
  } catch (e) {
    return { table, error: e.message };
  }
}

async function latestUpdatedAt(supa, table) {
  try {
    const { data, error } = await supa
      .from(table)
      .select('updated_at, created_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data?.updated_at || data?.created_at || null;
  } catch {
    return null;
  }
}

function summarizeSources() {
  const byOperator = {};
  const byMetric = {};
  const byGeography = {};
  const byConfidence = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
  let oldest = null;
  let newest = null;

  for (const s of PUBLIC_SOURCES_LIBRARY) {
    byOperator[s.operator_id] = (byOperator[s.operator_id] || 0) + 1;
    byMetric[s.metric_id] = (byMetric[s.metric_id] || 0) + 1;
    const geoKey = (s.geography || 'unknown').toLowerCase().includes('qatar') ? 'qatar'
      : (s.geography || '').toLowerCase().includes('mena') || (s.geography || '').toLowerCase().includes('gulf') ? 'mena'
      : 'global';
    byGeography[geoKey] = (byGeography[geoKey] || 0) + 1;
    const c = s.confidence_score ?? 0;
    byConfidence[c] = (byConfidence[c] || 0) + 1;
    if (s.date_published) {
      if (!oldest || s.date_published < oldest) oldest = s.date_published;
      if (!newest || s.date_published > newest) newest = s.date_published;
    }
  }

  const avg_confidence = PUBLIC_SOURCES_LIBRARY.reduce((a, s) => a + (s.confidence_score || 0), 0) / PUBLIC_SOURCES_LIBRARY.length;

  return {
    total: PUBLIC_SOURCES_LIBRARY.length,
    by_operator: byOperator,
    by_metric: byMetric,
    by_geography: byGeography,
    by_confidence: byConfidence,
    avg_confidence: Math.round(avg_confidence * 100) / 100,
    oldest_published: oldest,
    newest_published: newest,
  };
}

export async function GET() {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  const supa = getAdminClient();

  // Parallel DB queries
  const [tableStats, freshness] = await Promise.all([
    Promise.all(TABLES.map(t => countRow(supa, t))),
    Promise.all(TABLES.map(t => latestUpdatedAt(supa, t).then(d => ({ table: t, latest: d })))),
  ]);

  const freshnessMap = Object.fromEntries(freshness.map(f => [f.table, f.latest]));

  const dbTables = tableStats.map(t => ({
    ...t,
    latest_change_at: freshnessMap[t.table] || null,
  }));

  const env = {
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_anthropic: !!process.env.ANTHROPIC_API_KEY,
    has_hypercli: !!process.env.HYPERCLI_API_KEY,
    has_langfuse: !!process.env.LANGFUSE_PUBLIC_KEY,
    node_env: process.env.NODE_ENV || 'unknown',
  };

  // ── Health warnings ────────────────────────────────────────────────────────
  const health_warnings = [];

  // area: 'sources'
  const CRITICAL_METRICS = [
    'pue', 'electricity_price_mwh', 'price_hyperscale_kw_month',
    'capex_shell_per_mw', 'capex_mep_per_mw', 'capex_substation_per_mw',
    'capex_cooling_per_mw',
  ];
  for (const s of PUBLIC_SOURCES_LIBRARY) {
    if ((s.confidence_score ?? 5) < 3) {
      health_warnings.push({
        id: `source-lowconf-${s.id}`,
        severity: 'P1',
        area: 'sources',
        label: `Low confidence (${s.confidence_score}/5) — ${s.metric_name}`,
        detail: `Source "${s.source_name}" has a confidence score below 3/5 and may produce unreliable bootstrap values.`,
        ref: s.id,
      });
    }
    if (s.date_published) {
      const todayUtc = new Date();
      const nowUtcMs = Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate());
      const pubMs = new Date(s.date_published).getTime();
      const diffMs = nowUtcMs - pubMs;
      const diffMonths = Math.floor(diffMs / MS_PER_MONTH);
      if (diffMonths > STALE_THRESHOLD_MONTHS) {
        health_warnings.push({
          id: `source-stale-${s.id}`,
          severity: 'P2',
          area: 'sources',
          label: `Stale source (${s.date_published}) — ${s.metric_name}`,
          detail: `Published ${s.date_published} — ${diffMonths} months ago (threshold: ${STALE_THRESHOLD_MONTHS} months). Source: "${s.source_name}".`,
          ref: s.id,
        });
      }
    }
  }

  for (const metric_id of CRITICAL_METRICS) {
    const found = PUBLIC_SOURCES_LIBRARY.some(s => s.metric_id === metric_id);
    if (!found) {
      health_warnings.push({
        id: `metric-missing-${metric_id}`,
        severity: 'P0',
        area: 'sources',
        label: `No public source for critical metric: ${metric_id}`,
        detail: `bootstrap utilisera fallback global ou défaut hardcodé`,
        ref: null,
      });
    }
  }

  // area: 'magic'
  const P0_MAGIC_IDS = ['minority_equity_default', 'qatar_capital_gains_tax'];
  for (const m of MAGIC_NUMBERS) {
    health_warnings.push({
      id: `magic-${m.id}`,
      severity: P0_MAGIC_IDS.includes(m.id) ? 'P0' : 'P2',
      area: 'magic',
      label: `Hardcoded: ${m.label}`,
      detail: m.suggested_action,
      ref: `${m.file}:${m.line}`,
    });
  }

  // area: 'db'
  for (const t of dbTables) {
    if (t.error) {
      health_warnings.push({
        id: `db-error-${t.table}`,
        severity: 'P0',
        area: 'db',
        label: `Table query failed: ${t.table}`,
        detail: t.error,
        ref: t.table,
      });
    } else if (t.count === 0) {
      if (t.table === 'hearst_projects') {
        health_warnings.push({
          id: 'db-empty-projects',
          severity: 'P0',
          area: 'db',
          label: 'Table hearst_projects is empty',
          detail: 'No projects found — the simulator has no base project to bootstrap from.',
          ref: 'hearst_projects',
        });
      } else if (t.table === 'hearst_scenarios') {
        health_warnings.push({
          id: 'db-empty-scenarios',
          severity: 'P1',
          area: 'db',
          label: 'Table hearst_scenarios is empty',
          detail: 'No saved scenarios found — users have not yet persisted any simulation.',
          ref: 'hearst_scenarios',
        });
      }
      // other empty tables → no warning
    }
  }

  // area: 'env'
  if (!env.has_supabase_url) {
    health_warnings.push({
      id: 'env-missing-supabase-url',
      severity: 'P0',
      area: 'env',
      label: 'Missing env var: NEXT_PUBLIC_SUPABASE_URL',
      detail: 'Supabase client cannot initialise without a project URL.',
      ref: null,
    });
  }
  if (!env.has_service_role) {
    health_warnings.push({
      id: 'env-missing-service-role',
      severity: 'P0',
      area: 'env',
      label: 'Missing env var: SUPABASE_SERVICE_ROLE_KEY',
      detail: 'Admin operations (row mutations, RLS bypass) require the service role key.',
      ref: null,
    });
  }
  if (!env.has_anthropic) {
    health_warnings.push({
      id: 'env-missing-anthropic',
      severity: 'P1',
      area: 'env',
      label: 'Missing env var: ANTHROPIC_API_KEY',
      detail: 'AI-assisted features (advisor, analysis) will be unavailable.',
      ref: null,
    });
  }
  if (!env.has_hypercli) {
    health_warnings.push({
      id: 'env-missing-hypercli',
      severity: 'P1',
      area: 'env',
      label: 'Missing env var: HYPERCLI_API_KEY',
      detail: 'Kimi K2.6 chat rail will be unavailable.',
      ref: null,
    });
  }

  const health_summary = health_warnings.reduce(
    (acc, w) => { acc[w.severity.toLowerCase()]++; return acc; },
    { p0: 0, p1: 0, p2: 0 }
  );
  // ── End health warnings ────────────────────────────────────────────────────

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    catalogs: {
      public_sources: summarizeSources(),
      deal_archetypes: { total: DEAL_ARCHETYPES.length, ids: DEAL_ARCHETYPES.map(a => a.id) },
      gpu_catalog:    { total: GPU_CATALOG.length, ids: GPU_CATALOG.map(g => g.id) },
      business_models:{ total: BUSINESS_MODELS.length },
      client_types:   { total: CLIENT_TYPES.length },
      operators:      { total: OPERATORS.length },
      fit_matrix:     { total: Object.keys(FIT_MATRIX).length },
      site_readiness: { total: Object.keys(SITE_READINESS).length },
    },
    pipeline_stages: PIPELINE_STAGES,
    magic_numbers: MAGIC_NUMBERS,
    critical_formulas: CRITICAL_FORMULAS,
    db_tables: dbTables,
    health_warnings,
    health_summary,
    env,
  });
}
