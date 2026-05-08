import { NextResponse } from 'next/server';
import { authedWrite } from '@/lib/supabase-admin';

const TABLE = {
  operator: { table: 'initiative_operators', fk: 'operator_id' },
  partner: { table: 'initiative_partners', fk: 'partner_id' },
};

function resolve(kind) {
  return TABLE[kind] || null;
}

export async function POST(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { kind, target_id } = await req.json();
  const map = resolve(kind);
  if (!map) return NextResponse.json({ error: 'Invalid kind (must be operator or partner)' }, { status: 400 });
  if (!target_id) return NextResponse.json({ error: 'Missing target_id' }, { status: 400 });
  const { error } = await auth.supa.from(map.table).insert({ initiative_id: params.id, [map.fk]: target_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { kind, target_id } = await req.json();
  const map = resolve(kind);
  if (!map) return NextResponse.json({ error: 'Invalid kind (must be operator or partner)' }, { status: 400 });
  if (!target_id) return NextResponse.json({ error: 'Missing target_id' }, { status: 400 });
  const { error } = await auth.supa.from(map.table).delete().eq('initiative_id', params.id).eq(map.fk, target_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
