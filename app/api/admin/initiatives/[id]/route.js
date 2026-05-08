import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';

export async function GET(_req, { params }) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const [{ data: init, error }, { data: tasks }, { data: opLinks }, { data: partnerLinks }] = await Promise.all([
    supa.from('initiatives').select('*, workstreams(*)').eq('id', params.id).single(),
    supa.from('tasks').select('*').eq('initiative_id', params.id).order('due_date', { ascending: true, nullsFirst: false }),
    supa.from('initiative_operators').select('operator_id, operators(*)').eq('initiative_id', params.id),
    supa.from('initiative_partners').select('partner_id, partners(*)').eq('initiative_id', params.id),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({
    initiative: init,
    tasks: tasks || [],
    operators: (opLinks || []).map((l) => l.operators).filter(Boolean),
    partners: (partnerLinks || []).map((l) => l.partners).filter(Boolean),
  });
}

export async function PATCH(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  if (body.status === 'done' && !body.done_at) body.done_at = new Date().toISOString();
  if (body.status && body.status !== 'done') body.done_at = null;
  const { data, error } = await auth.supa.from('initiatives').update(body).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ initiative: data });
}

export async function DELETE(_req, { params }) {
  const auth = await authedWrite('admin');
  if (auth instanceof NextResponse) return auth;
  const { error } = await auth.supa.from('initiatives').update({ archived: true }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
