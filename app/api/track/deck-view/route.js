import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAdminClient } from '@/lib/supabase-admin';

/**
 * Public endpoint. Validates a deck token and logs one slide-view event.
 * No CORS, same-origin only (the deck pages call it directly).
 */
export async function POST(req) {
  const { token, session_id, slide_index, slide_label, duration_ms } = await req.json();
  if (!token || !session_id || typeof slide_index !== 'number') {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  const supa = getAdminClient();
  const { data: link } = await supa
    .from('deck_links')
    .select('id, operator_id, revoked_at')
    .eq('token', token)
    .single();

  if (!link || link.revoked_at) {
    return NextResponse.json({ ok: false, reason: 'invalid token' }, { status: 200 });
  }

  const ua = req.headers.get('user-agent') || '';
  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip = (fwd.split(',')[0] || '').trim();
  const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16) : null;

  await supa.from('deck_views').insert({
    link_id: link.id,
    operator_id: link.operator_id,
    session_id,
    slide_index,
    slide_label: slide_label || null,
    duration_ms: duration_ms ?? null,
    user_agent: ua.slice(0, 240),
    ip_hash: ipHash,
  });

  return NextResponse.json({ ok: true });
}
