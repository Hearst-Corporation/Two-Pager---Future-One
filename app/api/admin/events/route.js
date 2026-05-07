import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function POST(req) {
  const { operator_id, type, subject, body, occurred_at } = await req.json();
  const supa = getAdminClient();
  const { data, error } = await supa
    .from('events')
    .insert({ operator_id, type, subject, body, occurred_at: occurred_at || new Date().toISOString() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function DELETE(req) {
  const { id } = await req.json();
  const supa = getAdminClient();
  const { error } = await supa.from('events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
