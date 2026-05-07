import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function GET(_req, { params }) {
  const supa = getAdminClient();
  const [{ data: op, error: e1 }, { data: stake }, { data: ev }, { data: docs }] =
    await Promise.all([
      supa.from('operators').select('*').eq('id', params.id).single(),
      supa.from('stakeholders').select('*').eq('operator_id', params.id).order('created_at', { ascending: false }),
      supa.from('events').select('*').eq('operator_id', params.id).order('occurred_at', { ascending: false }).limit(200),
      supa.from('documents').select('*').eq('operator_id', params.id).order('uploaded_at', { ascending: false }),
    ]);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 404 });
  return NextResponse.json({
    operator: op,
    stakeholders: stake || [],
    events: ev || [],
    documents: docs || [],
  });
}

export async function PATCH(req, { params }) {
  const body = await req.json();
  const supa = getAdminClient();
  const { data, error } = await supa
    .from('operators')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ operator: data });
}

export async function DELETE(_req, { params }) {
  const supa = getAdminClient();
  const { error } = await supa.from('operators').update({ archived: true }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
