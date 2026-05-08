import { NextResponse } from 'next/server';
import { authedWrite } from '@/lib/supabase-admin';

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { operator_id, partner_id, type, subject, body, occurred_at } = await req.json();
  if (!operator_id && !partner_id) {
    return NextResponse.json({ error: 'operator_id or partner_id required' }, { status: 400 });
  }
  const { data, error } = await auth.supa
    .from('events')
    .insert({
      operator_id: operator_id || null,
      partner_id: partner_id || null,
      type,
      subject,
      body,
      actor_id: auth.actor,
      occurred_at: occurred_at || new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function DELETE(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { id } = await req.json();
  const { error } = await auth.supa.from('events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
