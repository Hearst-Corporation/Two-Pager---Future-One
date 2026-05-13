import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

  let q = supa.from('hearst_contracts').select('*').eq('project_id', project_id);
  const status = searchParams.get('status');
  if (status) q = q.eq('status', status);
  q = q.order('created_at', { ascending: false });

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contracts: data || [] });
}

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const { data, error } = await auth.supa
    .from('hearst_contracts')
    .insert({ ...body, created_by: auth.actor })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auth.supa.from('hearst_audit_log').insert({
    project_id: body.project_id,
    actor_id: auth.actor,
    action: 'add_contract',
    entity_type: 'contract',
    entity_id: data.id,
    field_name: 'title',
    new_value: body.title,
  });

  return NextResponse.json({ contract: data }, { status: 201 });
}
