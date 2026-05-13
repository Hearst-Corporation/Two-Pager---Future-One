import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { DATA_ROOM_REQUIRED, PUBLIC_SOURCES_LIBRARY } from '@/lib/hearst-constants';

/** GET — fetch or auto-create the single HEARST project */
export async function GET() {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();

  let { data: project } = await supa.from('hearst_projects').select('*, hearst_scenarios(id,name,scenario_type,is_active)').limit(1).single();

  if (!project) {
    // Auto-create project + base scenario + data room index + public contract library
    const { data: newProject, error: pe } = await supa
      .from('hearst_projects')
      .insert({ name: 'HEARST Qatar AI & Data Center Hub' })
      .select()
      .single();
    if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });

    const { data: baseScenario } = await supa
      .from('hearst_scenarios')
      .insert({ project_id: newProject.id, name: 'Base Case', scenario_type: 'base', is_active: true })
      .select()
      .single();

    const { data: downScenario } = await supa
      .from('hearst_scenarios')
      .insert({ project_id: newProject.id, name: 'Downside Case', scenario_type: 'downside', is_active: false })
      .select()
      .single();

    const { data: upScenario } = await supa
      .from('hearst_scenarios')
      .insert({ project_id: newProject.id, name: 'Upside Case', scenario_type: 'upside', is_active: false })
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
export async function PATCH(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { data, error } = await auth.supa.from('hearst_projects').update(fields).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}
