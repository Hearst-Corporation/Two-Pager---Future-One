import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { withValidation } from '@/lib/validators/withValidation';
import { SourceCreateSchema } from '@/lib/validators/hearst';
import { dbErrorResponse } from '@/lib/api-errors';

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  const metric_id = searchParams.get('metric_id');
  const source_type = searchParams.get('source_type');

  let q = supa.from('hearst_sources').select('*');
  if (project_id) q = q.eq('project_id', project_id);
  if (metric_id) q = q.eq('metric_id', metric_id);
  if (source_type) q = q.eq('source_type', source_type);
  q = q.order('created_at', { ascending: false }).limit(500);

  const { data, error } = await q;
  if (error) return dbErrorResponse(error, '[sources][GET]');
  return NextResponse.json({ sources: data || [] });
}

export const POST = withValidation(SourceCreateSchema, async (req, parsed) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = parsed;
  const { data, error } = await auth.supa
    .from('hearst_sources')
    .insert({ ...body, created_by: auth.actor })
    .select()
    .single();
  if (error) return dbErrorResponse(error, '[sources][POST]');

  // Audit
  await auth.supa.from('hearst_audit_log').insert({
    project_id: body.project_id,
    actor_id: auth.actor,
    action: 'add_source',
    entity_type: 'source',
    entity_id: data.id,
    field_name: 'metric_id',
    new_value: body.metric_id,
  });

  return NextResponse.json({ source: data }, { status: 201 });
});
