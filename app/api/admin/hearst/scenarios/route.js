import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { generateProjection, calcSourceScore } from '@/lib/hearst-calculations';
import { normalizeScenarioForRead } from '@/lib/hearst-scenario-normalize';
import { withValidation } from '@/lib/validators/withValidation';
import { ScenarioCreateSchema } from '@/lib/validators/hearst';
import { dbErrorResponse } from '@/lib/api-errors';

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

  const { data, error, count } = await supa
    .from('hearst_scenarios')
    .select('*', { count: 'exact' })
    .eq('project_id', project_id)
    .order('created_at')
    .limit(100);
  if (error) return dbErrorResponse(error, '[scenarios][GET]');

  // Attach calculated projections and source scores
  const enriched = (data || []).map((row) => {
    const s = normalizeScenarioForRead(row);
    const proj = generateProjection(s);
    return { ...s, projection: proj, source_score: calcSourceScore(s) };
  });

  return NextResponse.json({ scenarios: enriched, count: count ?? enriched.length });
}

export const POST = withValidation(ScenarioCreateSchema, async (req, parsed) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  // Normalise `kind` -> `scenario_type` if only the alias was sent.
  const body = { ...parsed };
  if (!body.scenario_type && body.kind) body.scenario_type = body.kind;
  delete body.kind;
  const { data, error } = await auth.supa
    .from('hearst_scenarios')
    .insert({ ...body, created_by: auth.actor })
    .select()
    .single();
  if (error) return dbErrorResponse(error, '[scenarios][POST]');
  return NextResponse.json({ scenario: data });
});
