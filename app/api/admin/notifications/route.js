import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const url = new URL(req.url);
  const onlyUnread = url.searchParams.get('unread') === '1';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const supa = getAdminClient();

  let q = supa
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(id, full_name, email, avatar_url)')
    .eq('recipient_id', r.profile.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (onlyUnread) q = q.is('read_at', null);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count: unreadCount } = await supa
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', r.profile.id)
    .is('read_at', null);

  return NextResponse.json({ notifications: data, unread: unreadCount || 0 });
}

/**
 * Mark notifications as read.
 *   - { ids: ['…', '…'] }  → mark those specific notifications
 *   - { all: true }        → mark every unread notification for me
 */
export async function PATCH(req) {
  const auth = await authedWrite('viewer');
  if (auth instanceof NextResponse) return auth;
  const { ids, all } = await req.json();
  const now = new Date().toISOString();
  let q = auth.supa.from('notifications').update({ read_at: now }).eq('recipient_id', auth.profile.id);
  if (all === true) {
    q = q.is('read_at', null);
  } else if (Array.isArray(ids) && ids.length > 0) {
    q = q.in('id', ids);
  } else {
    return NextResponse.json({ error: 'ids[] or all=true required' }, { status: 400 });
  }
  const { error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: count || null });
}
