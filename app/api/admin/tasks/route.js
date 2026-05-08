import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const { searchParams } = new URL(req.url);
  const opId = searchParams.get('operator_id');
  const scope = searchParams.get('scope'); // 'open' | 'overdue' | 'week' | undefined
  const supa = getAdminClient();

  let q = supa.from('tasks').select('*, operators(name, pillar)').order('due_date', { ascending: true, nullsFirst: false });
  if (opId) q = q.eq('operator_id', opId);
  if (scope === 'open') q = q.eq('done', false);
  if (scope === 'overdue') {
    const today = new Date().toISOString().slice(0, 10);
    q = q.eq('done', false).lt('due_date', today);
  }
  if (scope === 'week') {
    const today = new Date();
    const in7 = new Date(today);
    in7.setDate(in7.getDate() + 7);
    q = q
      .eq('done', false)
      .gte('due_date', today.toISOString().slice(0, 10))
      .lte('due_date', in7.toISOString().slice(0, 10));
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const { data, error } = await auth.supa.from('tasks').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function PATCH(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { id, ...rest } = await req.json();
  if (rest.done === true && !rest.done_at) rest.done_at = new Date().toISOString();
  if (rest.done === false) rest.done_at = null;
  const { data, error } = await auth.supa.from('tasks').update(rest).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { id } = await req.json();
  const { error } = await auth.supa.from('tasks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
