import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';

function generateToken() {
  // 12 hex chars — short enough for URL, plenty unique
  return crypto.randomBytes(8).toString('hex');
}

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const opId = new URL(req.url).searchParams.get('operator_id');
  const supa = getAdminClient();
  let q = supa.from('deck_links').select('*').order('created_at', { ascending: false });
  if (opId) q = q.eq('operator_id', opId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ links: data });
}

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const { operator_id, pillar, audience = 'operator', recipient, recipient_email, notes } = body;
  if (!operator_id || !pillar) {
    return NextResponse.json({ error: 'operator_id and pillar required' }, { status: 400 });
  }
  const supa = auth.supa;
  const token = generateToken();
  const { data, error } = await supa
    .from('deck_links')
    .insert({ operator_id, pillar, audience, recipient, recipient_email, notes, token, actor_id: auth.actor })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log a timeline event
  await supa.from('events').insert({
    operator_id,
    type: 'document_sent',
    subject: `Deck link generated · ${audience.toUpperCase()} · ${pillar}`,
    body: recipient ? `Recipient: ${recipient}${recipient_email ? ' <' + recipient_email + '>' : ''}\nToken: ${token}` : `Token: ${token}`,
    actor_id: auth.actor,
  });

  return NextResponse.json({ link: data });
}

export async function DELETE(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { id } = await req.json();
  const { data, error } = await auth.supa
    .from('deck_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data });
}
