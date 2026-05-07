import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function POST(req) {
  const payload = await req.json();
  const supa = getAdminClient();
  const { data, error } = await supa.from('stakeholders').insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stakeholder: data });
}

export async function DELETE(req) {
  const { id } = await req.json();
  const supa = getAdminClient();
  const { error } = await supa.from('stakeholders').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
