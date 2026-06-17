import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { DATA_ROOM_REQUIRED } from '@/lib/hearst-constants';
import { bootstrapScenarioFromSources } from '@/lib/hearst-bootstrap';
import { PUBLIC_SOURCES_LIBRARY } from '@/lib/oracle-intelligence/source-library.js';
import { withValidation } from '@/lib/validators/withValidation';
import { ProjectUpdateSchema } from '@/lib/validators/hearst';
import { dbErrorResponse } from '@/lib/api-errors';

/** Fetch the single HEARST project row (no .single() to avoid PostgREST 406 on empty). */
async function fetchProject(supa) {
  const { data } = await supa
    .from('hearst_projects')
    .select('*, hearst_scenarios(id,name,scenario_type,is_active)')
    .limit(1);
  return data?.[0] ?? null;
}

const SCENARIO_SEED_META = [
  { name: 'Base Case', scenario_type: 'base', is_active: true },
  { name: 'Downside Case', scenario_type: 'downside', is_active: false },
  { name: 'Upside Case', scenario_type: 'upside', is_active: false },
];

const REQUIRED_SCENARIO_FIELDS = [
  'total_mw',
  'pue',
  'target_occupancy_pct',
  'electricity_price_mwh',
  'capex_shell_per_mw',
  'capex_mep_per_mw',
  'capex_substation_per_mw',
  'capex_cooling_per_mw',
  'price_retail_colo_kw_month',
  'commercial_split',
  'debt_pct',
  'debt_interest_rate',
  'exit_multiple',
];

function buildSeedScenario(meta, actorId) {
  const boot = bootstrapScenarioFromSources({
    geography: 'qatar',
    business_model_id: 'retail_colo',
    mw_target: 50,
  });

  return {
    ...boot.scenario,
    project_id: null,
    name: meta.name,
    scenario_type: meta.scenario_type,
    is_active: meta.is_active,
    created_by: actorId,
  };
}

function isIncompleteAutoSeedScenario(row) {
  if (!row) return false;
  if (!SCENARIO_SEED_META.some((meta) => meta.scenario_type === row.scenario_type && meta.name === row.name)) {
    return false;
  }

  const missingCount = REQUIRED_SCENARIO_FIELDS.filter((field) => {
    const value = row[field];
    if (field === 'commercial_split') {
      return !value || typeof value !== 'object' || Object.keys(value).length === 0;
    }
    return value == null;
  }).length;

  return missingCount >= 4;
}

async function repairIncompleteSeedScenarios(supa, projectId, actorId) {
  const { data, error } = await supa
    .from('hearst_scenarios')
    .select('*')
    .eq('project_id', projectId)
    .in('scenario_type', ['base', 'downside', 'upside']);

  if (error || !Array.isArray(data) || data.length === 0) return;

  const seedDefaults = Object.fromEntries(
    SCENARIO_SEED_META.map((meta) => [meta.scenario_type, buildSeedScenario(meta, actorId)]),
  );
  const baseScenario = data.find((row) => row.scenario_type === 'base' && !isIncompleteAutoSeedScenario(row));

  let repairedCount = 0;
  for (const row of data) {
    if (!isIncompleteAutoSeedScenario(row)) continue;

    const fallback = row.scenario_type === 'base'
      ? seedDefaults.base
      : { ...seedDefaults[row.scenario_type], ...(baseScenario || {}) };

    const patch = {};
    for (const field of REQUIRED_SCENARIO_FIELDS) {
      if (row[field] == null && fallback[field] != null) {
        patch[field] = fallback[field];
      }
    }

    if (Object.keys(patch).length === 0) continue;

    const { error: updateError } = await supa
      .from('hearst_scenarios')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', row.id);

    if (!updateError) repairedCount += 1;
  }

  if (repairedCount > 0) {
    // eslint-disable-next-line no-console
    console.info('[project][GET] repaired_seed_scenarios', {
      projectId,
      repairedCount,
    });
  }
}

/** GET — fetch or auto-create the single HEARST project */
export async function GET() {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();

  let project = await fetchProject(supa);

  if (project?.id) {
    await repairIncompleteSeedScenarios(supa, project.id, r.profile.id);
    project = await fetchProject(supa);
  }

  if (!project) {
    // Re-check existence immediately before insert to narrow the race window when no unique
    // constraint is present.  If another concurrent request already seeded, return early.
    const raceCheck = await fetchProject(supa);
    if (raceCheck) return NextResponse.json({ project: raceCheck });

    // Auto-create project + base scenario + data room index + public contract library.
    // Race-safe: on unique violation (concurrent cold-start) we re-fetch instead of erroring.
    const { data: newProject, error: pe } = await supa
      .from('hearst_projects')
      .insert({ name: 'HEARST Qatar AI & Data Center Hub', created_by: r.profile.id })
      .select()
      .single();

    if (pe) {
      // 23505 = unique_violation — another request already seeded; re-fetch and return it.
      if (pe.code === '23505') {
        const existing = await fetchProject(supa);
        if (existing) return NextResponse.json({ project: existing });
      }
      return dbErrorResponse(pe, '[project][GET][auto-create]');
    }

    const { data: baseScenario } = await supa
      .from('hearst_scenarios')
      .insert({ ...buildSeedScenario(SCENARIO_SEED_META[0], r.profile.id), project_id: newProject.id })
      .select()
      .single();

    const { data: downScenario } = await supa
      .from('hearst_scenarios')
      .insert({ ...buildSeedScenario(SCENARIO_SEED_META[1], r.profile.id), project_id: newProject.id })
      .select()
      .single();

    const { data: upScenario } = await supa
      .from('hearst_scenarios')
      .insert({ ...buildSeedScenario(SCENARIO_SEED_META[2], r.profile.id), project_id: newProject.id })
      .select()
      .single();

    if (baseScenario) {
      await supa.from('hearst_projects').update({ active_scenario_id: baseScenario.id }).eq('id', newProject.id);
    }

    // Seed data room with required documents
    const dataRoomRows = DATA_ROOM_REQUIRED.map((d) => ({
      project_id: newProject.id,
      category: d.category,
      document_type: d.category,
      title: d.title,
      required_for_base_case: d.required,
      linked_metric_ids: d.metric_ids,
      status: 'missing',
    }));
    await supa.from('hearst_data_room').insert(dataRoomRows);

    // Seed public contract library
    const contractRows = PUBLIC_SOURCES_LIBRARY.map((s) => ({
      project_id: newProject.id,
      document_type: s.document_type,
      title: s.title,
      source_org: s.source_org,
      url: s.url,
      notes: s.caveat,
      usable_in_model: false,
      confidence: 3,
    }));
    await supa.from('hearst_contracts').insert(contractRows);

    project = { ...newProject, hearst_scenarios: [baseScenario, downScenario, upScenario].filter(Boolean) };
  }

  return NextResponse.json({ project });
}

/** PATCH — update project meta */
export const PATCH = withValidation(ProjectUpdateSchema, async (req, parsed) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { id, ...fields } = parsed;
  const { data, error } = await auth.supa.from('hearst_projects').update(fields).eq('id', id).select().single();
  if (error) return dbErrorResponse(error, '[project][PATCH]');
  return NextResponse.json({ project: data });
});
