// lib/hearst-advisor-tools.js
// Tool schemas + handlers exposed to the HEARST Advisor agent.
//
// Each handler signature: ({ input, supa, actor, project_id }) => Promise<string>
// where the returned string is fed back as the `tool_result.content` (Anthropic Messages API).
// Audit-log writes happen inside the handler so the agent never has to think about it.
//
// Whitelisted fields prevent the agent from mutating system fields (id, project_id, created_by).

import { generateProjection, calcSourceScore } from './hearst-calculations.js';
import { detectAlerts } from './hearst-alerts.js';
import { PUBLIC_SOURCES_LIBRARY } from './hearst-constants.js';

// ────────────────────────────────────────────────────────────────────────
// Whitelists
// ────────────────────────────────────────────────────────────────────────

const SCENARIO_WRITABLE_FIELDS = new Set([
  'name', 'scenario_type', 'description', 'is_active',
  'total_mw', 'phase1_mw', 'phase1_complete_year', 'phase2_mw', 'phase2_complete_year', 'phase3_mw', 'phase3_complete_year',
  'pue', 'target_occupancy_pct', 'start_year',
  'capex_shell_per_mw', 'capex_mep_per_mw', 'capex_substation_per_mw', 'capex_cooling_per_mw', 'capex_grid_per_mw',
  'capex_contingency_pct', 'capex_liquid_cooling_premium_per_mw', 'capex_land_per_mw',
  'electricity_price_mwh',
  'opex_maintenance_pct', 'opex_staff_annual_musd', 'opex_insurance_pct', 'opex_ga_pct', 'opex_operator_mgmt_fee_pct',
  'price_retail_colo_kw_month', 'price_wholesale_kw_month', 'price_hyperscale_kw_month', 'annual_escalation_pct',
  'equity_hearst_pct', 'equity_brookfield_pct', 'equity_qatar_pct', 'debt_pct', 'debt_interest_rate',
  'exit_multiple', 'exit_year',
  'commercial_split', 'operator_strategy',
]);

const SCENARIO_SOURCE_FIELDS = new Set([
  'total_mw_source_id', 'pue_source_id', 'electricity_price_source_id',
  'capex_shell_source_id', 'capex_mep_source_id', 'capex_substation_source_id',
  'capex_cooling_source_id', 'capex_grid_source_id', 'capex_land_source_id',
  'price_retail_source_id', 'price_wholesale_source_id', 'price_hyperscale_source_id',
  'exit_multiple_source_id', 'debt_interest_source_id',
]);

const PIPELINE_WRITABLE_FIELDS = new Set([
  'prospect_name', 'prospect_type', 'mw_requested', 'target_price_kw_month',
  'probability_pct', 'expected_signing_date', 'contract_length_years',
  'status', 'credit_quality', 'strategic_value', 'cooling_type', 'fit_out_required', 'notes',
]);

// ────────────────────────────────────────────────────────────────────────
// Tool schemas (sent to Anthropic Messages API)
// ────────────────────────────────────────────────────────────────────────

// Convert Anthropic-style tool defs to OpenAI-compatible tool defs
export function toOpenAITools(toolDefs) {
  return toolDefs.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

export const TOOL_DEFS = [
  {
    name: 'get_project_state',
    description: 'Refresh and return the full HEARST project state: project metadata, all scenarios (with projections and source scores), source ledger summary, data room status, pipeline summary, and active smart alerts. Call this after writes or when the snapshot in the system block feels stale.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_scenario_details',
    description: 'Return one scenario with its full 10-year projection (every year row: mw_live, occupancy, revenue, power_cost, opex, ebitda, fcf, dscr) and the list of sources currently attached.',
    input_schema: {
      type: 'object',
      properties: { scenario_id: { type: 'string', description: 'UUID of the scenario' } },
      required: ['scenario_id'],
    },
  },
  {
    name: 'list_sources',
    description: 'List sources in the evidence ledger. Optional filters by metric_id (e.g. "pue", "electricity_price_mwh") or source_type.',
    input_schema: {
      type: 'object',
      properties: {
        metric_id: { type: 'string' },
        source_type: { type: 'string', enum: ['official_source', 'uploaded_document', 'admin_input', 'calculated', 'contract'] },
      },
      required: [],
    },
  },
  {
    name: 'list_public_sources_library',
    description: 'Return the curated PUBLIC_SOURCES_LIBRARY (JLL, CBRE, KAHRAMAA, SEC filings, etc.). Use this BEFORE auto-filling assumptions to pick the right source to attach.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_scenario',
    description: 'Update writable fields on a scenario (capex, opex, prices, phasing, debt, exit). Audit-logged with the rationale string. Cannot modify id, project_id, created_by, or *_source_id fields (use attach_source_to_scenario for those).',
    input_schema: {
      type: 'object',
      properties: {
        scenario_id: { type: 'string' },
        fields: { type: 'object', description: 'Map of field_name -> new value. Only whitelisted scenario fields are accepted.' },
        rationale: { type: 'string', description: 'Why this change is being made. Will appear in hearst_audit_log.impact_description.' },
      },
      required: ['scenario_id', 'fields', 'rationale'],
    },
  },
  {
    name: 'create_source',
    description: 'Create a new row in the hearst_sources ledger. Use this BEFORE attaching a source to a scenario field. Pulling a candidate from list_public_sources_library is encouraged.',
    input_schema: {
      type: 'object',
      properties: {
        metric_id:              { type: 'string', description: 'e.g. "pue", "electricity_price_mwh", "capex_shell_per_mw"' },
        metric_name:            { type: 'string', description: 'Human-readable metric label' },
        value:                  { type: 'number' },
        value_text:             { type: 'string' },
        unit:                   { type: 'string' },
        currency:               { type: 'string' },
        geography:              { type: 'string', description: 'e.g. "Qatar", "Global", "MENA"' },
        source_name:            { type: 'string' },
        source_type:            { type: 'string', enum: ['official_source', 'uploaded_document', 'admin_input', 'calculated', 'contract'] },
        source_url:             { type: 'string' },
        document_title:         { type: 'string' },
        page_number:            { type: 'string' },
        quoted_excerpt:         { type: 'string' },
        confidence_score:       { type: 'integer', minimum: 1, maximum: 5 },
        applicability_to_qatar: { type: 'string' },
        caveat:                 { type: 'string' },
      },
      required: ['metric_id', 'metric_name', 'source_name', 'source_type'],
    },
  },
  {
    name: 'attach_source_to_scenario',
    description: 'Bind a source row (created via create_source) to a scenario field, by setting the matching <field>_source_id column. Audit-logged.',
    input_schema: {
      type: 'object',
      properties: {
        scenario_id: { type: 'string' },
        field_name:  { type: 'string', description: 'One of *_source_id fields, e.g. "pue_source_id".' },
        source_id:   { type: 'string', description: 'UUID returned by create_source' },
      },
      required: ['scenario_id', 'field_name', 'source_id'],
    },
  },
  {
    name: 'create_scenario',
    description: 'Create a new scenario, optionally cloning from base_scenario_id and applying overrides on top. Useful for stress tests and what-ifs the user explicitly wants to persist.',
    input_schema: {
      type: 'object',
      properties: {
        name:              { type: 'string' },
        scenario_type:     { type: 'string', enum: ['downside', 'base', 'upside', 'custom'] },
        description:       { type: 'string' },
        base_scenario_id:  { type: 'string', description: 'Optional UUID to clone from' },
        overrides:         { type: 'object', description: 'Map of writable scenario fields to override' },
        rationale:         { type: 'string' },
      },
      required: ['name', 'scenario_type', 'rationale'],
    },
  },
  {
    name: 'add_pipeline_prospect',
    description: 'Add a commercial prospect (operator, hyperscaler, sovereign, etc.) to the pipeline. Useful for filling commercial assumptions.',
    input_schema: {
      type: 'object',
      properties: {
        prospect_name:         { type: 'string' },
        prospect_type:         { type: 'string', description: 'e.g. hyperscalers, operators, neocloud, qatar_gov, defense' },
        mw_requested:          { type: 'number' },
        target_price_kw_month: { type: 'number' },
        probability_pct:       { type: 'integer', minimum: 0, maximum: 100 },
        contract_length_years: { type: 'integer' },
        status:                { type: 'string', enum: ['prospect', 'loi', 'term_sheet', 'contracted'] },
        credit_quality:        { type: 'string', description: 'e.g. AAA, AA, A, BBB' },
        strategic_value:       { type: 'string' },
        cooling_type:          { type: 'string', description: 'e.g. air, liquid, hybrid' },
        notes:                 { type: 'string' },
      },
      required: ['prospect_name', 'prospect_type'],
    },
  },
  {
    name: 'update_data_room_item',
    description: 'Update the status (or notes) of a data room checklist item — typically after attaching a source for a metric tied to a document.',
    input_schema: {
      type: 'object',
      properties: {
        item_id: { type: 'string' },
        status:  { type: 'string', enum: ['missing', 'in_progress', 'uploaded', 'reviewed', 'approved'] },
        notes:   { type: 'string' },
        file_url: { type: 'string' },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'run_what_if_projection',
    description: 'Recompute the 10-year projection for a scenario WITH OVERRIDES APPLIED IN-MEMORY (no DB write). Returns IRR, NPV, MOIC, DSCR, year rows, plus deltas vs the persisted version. Use this for sensitivity analysis before deciding to persist via create_scenario or update_scenario.',
    input_schema: {
      type: 'object',
      properties: {
        base_scenario_id: { type: 'string' },
        overrides:        { type: 'object', description: 'Map of fields to override (e.g. { electricity_price_mwh: 60, target_occupancy_pct: 80 })' },
      },
      required: ['base_scenario_id', 'overrides'],
    },
  },
  {
    name: 'compare_scenarios',
    description: 'Side-by-side comparison of N scenarios on the key KPIs: IRR, NPV, MOIC, DSCR stab, payback, total capex, terminal value, source score.',
    input_schema: {
      type: 'object',
      properties: { scenario_ids: { type: 'array', items: { type: 'string' }, minItems: 2 } },
      required: ['scenario_ids'],
    },
  },
  {
    name: 'generate_executive_report',
    description: 'Build a structured executive summary for a scenario, ready for an investor deck: sections Executive Summary, Capital Structure, Returns, Sensitivities, Risks, Sources & Caveats. Returns a markdown document. Does not persist anything.',
    input_schema: {
      type: 'object',
      properties: {
        scenario_id: { type: 'string' },
        audience:    { type: 'string', enum: ['investor', 'board', 'lender', 'internal'], default: 'investor' },
      },
      required: ['scenario_id'],
    },
  },
];

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

async function audit(supa, { project_id, actor_id, action, entity_type, entity_id, field_name, previous_value, new_value, impact_description }) {
  try {
    await supa.from('hearst_audit_log').insert({
      project_id, actor_id, action, entity_type, entity_id,
      field_name: field_name ?? null,
      previous_value: previous_value == null ? null : String(previous_value),
      new_value: new_value == null ? null : String(new_value),
      impact_description: impact_description ?? null,
    });
  } catch {
    // never let audit failure break the user-facing flow
  }
}

function filterWritable(obj, whitelist) {
  const out = {};
  const rejected = [];
  for (const [k, v] of Object.entries(obj || {})) {
    if (whitelist.has(k)) out[k] = v;
    else rejected.push(k);
  }
  return { out, rejected };
}

function projForCompare(s) {
  const p = s.projection || {};
  return {
    name: s.name,
    type: s.scenario_type,
    irr: p.irr,
    npv: p.npv,
    moic: p.moic,
    dscr_stabilized: p.dscr_stabilized,
    payback_years: p.payback_years,
    total_capex: p.total_capex,
    terminal_value: p.terminal_value,
    stabilized_revenue: p.stabilized_revenue,
    stabilized_ebitda: p.stabilized_ebitda,
    source_score: s.source_score ?? calcSourceScore(s),
    missing_inputs: p.missing_inputs || [],
  };
}

// ────────────────────────────────────────────────────────────────────────
// Tool runner
// ────────────────────────────────────────────────────────────────────────

export async function runTool({ name, input, supa, actor, project_id }) {
  switch (name) {
    case 'get_project_state': {
      const [{ data: project }, { data: scenarios }, { data: sources }, { data: dataRoom }, { data: pipeline }] = await Promise.all([
        supa.from('hearst_projects').select('*').eq('id', project_id).single(),
        supa.from('hearst_scenarios').select('*').eq('project_id', project_id).order('created_at'),
        supa.from('hearst_sources').select('*').eq('project_id', project_id).order('created_at', { ascending: false }).limit(200),
        supa.from('hearst_data_room').select('*').eq('project_id', project_id),
        supa.from('hearst_pipeline').select('*').eq('project_id', project_id),
      ]);
      const enriched = (scenarios || []).map(s => {
        const projection = generateProjection(s);
        return { ...s, projection, source_score: calcSourceScore(s) };
      });
      const base = enriched.find(s => s.scenario_type === 'base') || enriched[0];
      const alerts = base ? detectAlerts(base, project) : [];
      return JSON.stringify({
        project,
        scenarios: enriched.map(s => ({
          id: s.id, name: s.name, scenario_type: s.scenario_type,
          total_mw: s.total_mw, pue: s.pue, target_occupancy_pct: s.target_occupancy_pct,
          electricity_price_mwh: s.electricity_price_mwh,
          capex_shell_per_mw: s.capex_shell_per_mw, capex_mep_per_mw: s.capex_mep_per_mw,
          price_retail_colo_kw_month: s.price_retail_colo_kw_month,
          price_wholesale_kw_month: s.price_wholesale_kw_month,
          price_hyperscale_kw_month: s.price_hyperscale_kw_month,
          exit_multiple: s.exit_multiple, exit_year: s.exit_year,
          debt_pct: s.debt_pct, debt_interest_rate: s.debt_interest_rate,
          projection: s.projection,
          source_score: s.source_score,
        })),
        sources_count: (sources || []).length,
        sources_by_type: (sources || []).reduce((acc, s) => { acc[s.source_type] = (acc[s.source_type] || 0) + 1; return acc; }, {}),
        data_room: { total: (dataRoom || []).length, missing: (dataRoom || []).filter(d => d.status === 'missing').length, approved: (dataRoom || []).filter(d => d.status === 'approved' || d.status === 'reviewed').length },
        pipeline: { total: (pipeline || []).length, total_mw: (pipeline || []).reduce((s, p) => s + Number(p.mw_requested || 0), 0) },
        active_alerts: alerts,
      });
    }

    case 'get_scenario_details': {
      const { data, error } = await supa.from('hearst_scenarios').select('*').eq('id', input.scenario_id).single();
      if (error) return JSON.stringify({ error: error.message });
      const projection = generateProjection(data);
      const source_score = calcSourceScore(data);
      // Pull attached sources
      const source_ids = Object.entries(data).filter(([k, v]) => k.endsWith('_source_id') && v).map(([_, v]) => v);
      let attached_sources = [];
      if (source_ids.length) {
        const { data: srcs } = await supa.from('hearst_sources').select('id, metric_id, source_name, source_type, value, value_text, source_url, confidence_score').in('id', source_ids);
        attached_sources = srcs || [];
      }
      return JSON.stringify({ scenario: data, projection, source_score, attached_sources });
    }

    case 'list_sources': {
      let q = supa.from('hearst_sources').select('*').eq('project_id', project_id);
      if (input.metric_id) q = q.eq('metric_id', input.metric_id);
      if (input.source_type) q = q.eq('source_type', input.source_type);
      q = q.order('created_at', { ascending: false }).limit(50);
      const { data, error } = await q;
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ sources: data || [], count: (data || []).length });
    }

    case 'list_public_sources_library': {
      return JSON.stringify({ library: PUBLIC_SOURCES_LIBRARY });
    }

    case 'update_scenario': {
      const { out: fields, rejected } = filterWritable(input.fields, SCENARIO_WRITABLE_FIELDS);
      if (Object.keys(fields).length === 0) {
        return JSON.stringify({ error: 'No writable fields provided', rejected });
      }
      const { data: before } = await supa.from('hearst_scenarios').select('*').eq('id', input.scenario_id).single();
      if (!before) return JSON.stringify({ error: 'scenario not found' });
      const { data, error } = await supa
        .from('hearst_scenarios')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', input.scenario_id)
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message, rejected });

      const auditRows = Object.keys(fields).map(field => ({
        project_id,
        actor_id: actor,
        action: 'ai_update_scenario',
        entity_type: 'scenario',
        entity_id: input.scenario_id,
        field_name: field,
        previous_value: before[field] == null ? null : String(before[field]),
        new_value: fields[field] == null ? null : String(fields[field]),
        impact_description: input.rationale,
      }));
      if (auditRows.length) await supa.from('hearst_audit_log').insert(auditRows);

      const projection = generateProjection(data);
      return JSON.stringify({
        ok: true,
        scenario_id: data.id,
        updated_fields: Object.keys(fields),
        rejected,
        new_projection: { irr: projection.irr, npv: projection.npv, moic: projection.moic, dscr_stabilized: projection.dscr_stabilized },
        source_score: calcSourceScore(data),
      });
    }

    case 'create_source': {
      const { data, error } = await supa
        .from('hearst_sources')
        .insert({
          project_id,
          metric_id: input.metric_id,
          metric_name: input.metric_name,
          value: input.value ?? null,
          value_text: input.value_text ?? null,
          unit: input.unit ?? null,
          currency: input.currency ?? null,
          geography: input.geography ?? null,
          source_name: input.source_name,
          source_type: input.source_type,
          source_url: input.source_url ?? null,
          document_title: input.document_title ?? null,
          page_number: input.page_number ?? null,
          quoted_excerpt: input.quoted_excerpt ?? null,
          confidence_score: input.confidence_score ?? null,
          applicability_to_qatar: input.applicability_to_qatar ?? null,
          caveat: input.caveat ?? null,
          created_by: actor,
        })
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });

      await audit(supa, {
        project_id, actor_id: actor,
        action: 'ai_create_source', entity_type: 'source', entity_id: data.id,
        field_name: 'metric_id', new_value: input.metric_id,
        impact_description: `${input.source_type} from ${input.source_name}`,
      });

      return JSON.stringify({ ok: true, source_id: data.id, metric_id: data.metric_id, source_name: data.source_name });
    }

    case 'attach_source_to_scenario': {
      if (!SCENARIO_SOURCE_FIELDS.has(input.field_name)) {
        return JSON.stringify({ error: `field_name "${input.field_name}" is not a valid scenario source field`, allowed: [...SCENARIO_SOURCE_FIELDS] });
      }
      const { data: before } = await supa.from('hearst_scenarios').select('id, project_id, ' + input.field_name).eq('id', input.scenario_id).single();
      if (!before) return JSON.stringify({ error: 'scenario not found' });

      const { data, error } = await supa
        .from('hearst_scenarios')
        .update({ [input.field_name]: input.source_id, updated_at: new Date().toISOString() })
        .eq('id', input.scenario_id)
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });

      await audit(supa, {
        project_id, actor_id: actor,
        action: 'ai_attach_source', entity_type: 'scenario', entity_id: input.scenario_id,
        field_name: input.field_name, previous_value: before[input.field_name], new_value: input.source_id,
        impact_description: `attached source to ${input.field_name}`,
      });

      return JSON.stringify({ ok: true, scenario_id: data.id, field: input.field_name, source_id: input.source_id, source_score: calcSourceScore(data) });
    }

    case 'create_scenario': {
      let payload = { project_id, name: input.name, scenario_type: input.scenario_type, description: input.description ?? null, created_by: actor };
      if (input.base_scenario_id) {
        const { data: base } = await supa.from('hearst_scenarios').select('*').eq('id', input.base_scenario_id).single();
        if (base) {
          const { id, created_at, updated_at, created_by, ...clone } = base;
          payload = { ...clone, ...payload };
        }
      }
      if (input.overrides) {
        const { out } = filterWritable(input.overrides, SCENARIO_WRITABLE_FIELDS);
        payload = { ...payload, ...out };
      }
      const { data, error } = await supa.from('hearst_scenarios').insert(payload).select().single();
      if (error) return JSON.stringify({ error: error.message });

      await audit(supa, {
        project_id, actor_id: actor,
        action: 'ai_create_scenario', entity_type: 'scenario', entity_id: data.id,
        field_name: 'name', new_value: data.name,
        impact_description: input.rationale,
      });

      const projection = generateProjection(data);
      return JSON.stringify({
        ok: true,
        scenario_id: data.id,
        name: data.name,
        projection: { irr: projection.irr, npv: projection.npv, moic: projection.moic, dscr_stabilized: projection.dscr_stabilized, total_capex: projection.total_capex },
      });
    }

    case 'add_pipeline_prospect': {
      const { out } = filterWritable(input, PIPELINE_WRITABLE_FIELDS);
      if (!out.prospect_name || !out.prospect_type) return JSON.stringify({ error: 'prospect_name and prospect_type required' });
      const { data, error } = await supa
        .from('hearst_pipeline')
        .insert({ ...out, project_id, created_by: actor })
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });

      await audit(supa, {
        project_id, actor_id: actor,
        action: 'ai_add_prospect', entity_type: 'pipeline', entity_id: data.id,
        field_name: 'prospect_name', new_value: data.prospect_name,
        impact_description: `added ${data.prospect_type} prospect`,
      });

      return JSON.stringify({ ok: true, prospect_id: data.id, name: data.prospect_name });
    }

    case 'update_data_room_item': {
      const updates = {};
      if (input.status) updates.status = input.status;
      if (input.notes != null) updates.notes = input.notes;
      if (input.file_url) updates.file_url = input.file_url;
      if (Object.keys(updates).length === 0) return JSON.stringify({ error: 'no updates provided' });
      updates.updated_at = new Date().toISOString();

      const { data: before } = await supa.from('hearst_data_room').select('*').eq('id', input.item_id).single();
      if (!before) return JSON.stringify({ error: 'item not found' });

      const { data, error } = await supa.from('hearst_data_room').update(updates).eq('id', input.item_id).select().single();
      if (error) return JSON.stringify({ error: error.message });

      await audit(supa, {
        project_id, actor_id: actor,
        action: 'ai_update_data_room', entity_type: 'data_room', entity_id: data.id,
        field_name: 'status', previous_value: before.status, new_value: data.status,
        impact_description: input.notes || `status: ${before.status} → ${data.status}`,
      });

      return JSON.stringify({ ok: true, item_id: data.id, title: data.title, status: data.status });
    }

    case 'run_what_if_projection': {
      const { data: base, error } = await supa.from('hearst_scenarios').select('*').eq('id', input.base_scenario_id).single();
      if (error) return JSON.stringify({ error: error.message });
      const { out: overrides } = filterWritable(input.overrides, SCENARIO_WRITABLE_FIELDS);
      const merged = { ...base, ...overrides };
      const base_proj = generateProjection(base);
      const new_proj = generateProjection(merged);
      const delta = (a, b) => (a != null && b != null) ? a - b : null;
      return JSON.stringify({
        base: {
          irr: base_proj.irr, npv: base_proj.npv, moic: base_proj.moic,
          dscr_stabilized: base_proj.dscr_stabilized, total_capex: base_proj.total_capex,
          stabilized_ebitda: base_proj.stabilized_ebitda, payback_years: base_proj.payback_years,
        },
        what_if: {
          irr: new_proj.irr, npv: new_proj.npv, moic: new_proj.moic,
          dscr_stabilized: new_proj.dscr_stabilized, total_capex: new_proj.total_capex,
          stabilized_ebitda: new_proj.stabilized_ebitda, payback_years: new_proj.payback_years,
          missing_inputs: new_proj.missing_inputs,
          warnings: new_proj.warnings,
        },
        delta: {
          irr: delta(new_proj.irr, base_proj.irr),
          npv: delta(new_proj.npv, base_proj.npv),
          moic: delta(new_proj.moic, base_proj.moic),
          dscr_stabilized: delta(new_proj.dscr_stabilized, base_proj.dscr_stabilized),
          stabilized_ebitda: delta(new_proj.stabilized_ebitda, base_proj.stabilized_ebitda),
          payback_years: delta(new_proj.payback_years, base_proj.payback_years),
        },
        overrides_applied: overrides,
      });
    }

    case 'compare_scenarios': {
      const { data, error } = await supa.from('hearst_scenarios').select('*').in('id', input.scenario_ids);
      if (error) return JSON.stringify({ error: error.message });
      const enriched = (data || []).map(s => ({ ...s, projection: generateProjection(s), source_score: calcSourceScore(s) }));
      return JSON.stringify({ comparison: enriched.map(projForCompare) });
    }

    case 'generate_executive_report': {
      const { data: s, error } = await supa.from('hearst_scenarios').select('*').eq('id', input.scenario_id).single();
      if (error) return JSON.stringify({ error: error.message });
      const projection = generateProjection(s);
      const source_score = calcSourceScore(s);
      const { data: project } = await supa.from('hearst_projects').select('*').eq('id', project_id).single();
      const alerts = detectAlerts(s, project);
      // Return a structured report skeleton. The agent will turn this into prose in its next text turn.
      return JSON.stringify({
        ok: true,
        format: 'markdown_skeleton',
        audience: input.audience || 'investor',
        scenario: {
          name: s.name, type: s.scenario_type,
          total_mw: s.total_mw, pue: s.pue, target_occupancy_pct: s.target_occupancy_pct,
          electricity_price_mwh: s.electricity_price_mwh,
          exit_multiple: s.exit_multiple, exit_year: s.exit_year,
          debt_pct: s.debt_pct, debt_interest_rate: s.debt_interest_rate,
        },
        project: {
          name: project?.name, country: project?.country, site_readiness: project?.site_readiness,
          sponsor: project?.sponsor, partner: project?.institutional_partner, infra: project?.infrastructure_investor,
        },
        returns: {
          irr: projection.irr, npv: projection.npv, moic: projection.moic,
          dscr_stabilized: projection.dscr_stabilized, payback_years: projection.payback_years,
          total_capex: projection.total_capex, terminal_value: projection.terminal_value,
          stabilized_revenue: projection.stabilized_revenue, stabilized_ebitda: projection.stabilized_ebitda,
        },
        years: projection.years || [],
        sourcing: { source_score, missing_inputs: projection.missing_inputs, warnings: projection.warnings },
        alerts,
        instructions: 'Render this as a markdown executive summary with sections: 1) Executive Summary (1 paragraph), 2) Capital Structure & Phasing, 3) Returns & DSCR, 4) Sensitivities (call out top 3 levers), 5) Risks & Smart Alerts, 6) Sources & Caveats. Use the numbers above verbatim. Do not invent figures. Output the markdown directly in your next text turn.',
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
