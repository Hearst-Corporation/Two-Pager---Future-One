import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { requireRowOwnership } from '@/lib/auth-guards';
import { generateProjection, calcSourceScore } from '@/lib/hearst-calculations';
import { withValidationPartial } from '@/lib/validators/withValidation';
import { ScenarioUpdateSchema } from '@/lib/validators/hearst';
import { dbErrorResponse, notFoundResponse } from '@/lib/api-errors';

export async function GET(req, { params }) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  try {
    await requireRowOwnership({
      table: 'hearst_scenarios',
      id: params.id,
      actorId: r.actor,
      allowSharedWorkspace: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
  const supa = getAdminClient();
  const { data, error } = await supa.from('hearst_scenarios').select('*').eq('id', params.id).single();
  if (error) return notFoundResponse();
  const projection = generateProjection(data);
  return NextResponse.json({ scenario: data, projection, source_score: calcSourceScore(data) });
}

export const PATCH = withValidationPartial(ScenarioUpdateSchema, async (req, parsed, { params }) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  try {
    await requireRowOwnership({
      table: 'hearst_scenarios',
      id: params.id,
      actorId: auth.actor,
      allowSharedWorkspace: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
  const body = parsed;

  // Audit trail: record what changed
  const supa = getAdminClient();
  const { data: before } = await supa.from('hearst_scenarios').select('*').eq('id', params.id).single();
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await auth.supa
    .from('hearst_scenarios')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return dbErrorResponse(error, '[scenarios/[id]][PATCH]');

  const changed = Object.keys(body).filter(k => body[k] !== before[k]);
  if (changed.length > 0) {
    const auditRows = changed.map((field) => ({
      project_id: data.project_id,
      actor_id: auth.actor,
      action: 'update_scenario',
      entity_type: 'scenario',
      entity_id: params.id,
      field_name: field,
      previous_value: String(before[field] ?? ''),
      new_value: String(body[field] ?? ''),
    }));
    await auth.supa.from('hearst_audit_log').insert(auditRows);
  }

  const projection = generateProjection(data);
  return NextResponse.json({ scenario: data, projection, source_score: calcSourceScore(data) });
});

export async function DELETE(req, { params }) {
  const auth = await authedWrite('admin');
  if (auth instanceof NextResponse) return auth;
  try {
    await requireRowOwnership({
      table: 'hearst_scenarios',
      id: params.id,
      actorId: auth.actor,
      allowSharedWorkspace: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
  const { data: existing } = await auth.supa.from('hearst_scenarios').select('id').eq('id', params.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { error } = await auth.supa.from('hearst_scenarios').delete().eq('id', params.id);
  if (error) return dbErrorResponse(error, '[scenarios/[id]][DELETE]');
  return NextResponse.json({ ok: true });
}
