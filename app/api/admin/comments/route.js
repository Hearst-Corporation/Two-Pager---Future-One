import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { requireRowOwnership } from '@/lib/auth-guards';

const VALID = new Set(['operator', 'partner', 'initiative', 'task']);

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const url = new URL(req.url);
  const parent_kind = url.searchParams.get('parent_kind');
  const parent_id = url.searchParams.get('parent_id');
  if (!VALID.has(parent_kind) || !parent_id) {
    return NextResponse.json({ error: 'parent_kind and parent_id required' }, { status: 400 });
  }
  const supa = getAdminClient();
  const { data, error } = await supa
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(id, full_name, email, avatar_url, role)')
    .eq('parent_kind', parent_kind)
    .eq('parent_id', parent_id)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data });
}

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { parent_kind, parent_id, body, parent_thread, mentions = [] } = await req.json();
  if (!VALID.has(parent_kind) || !parent_id || !body) {
    return NextResponse.json({ error: 'parent_kind, parent_id and body required' }, { status: 400 });
  }

  const { data, error } = await auth.supa
    .from('comments')
    .insert({
      parent_kind,
      parent_id,
      parent_thread: parent_thread || null,
      author_id: auth.actor,
      body,
      mentions: Array.isArray(mentions) ? mentions : [],
    })
    .select('*, author:profiles!comments_author_id_fkey(id, full_name, email, avatar_url, role)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}

export async function PATCH(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { id, body } = await req.json();
  if (!id || !body) return NextResponse.json({ error: 'id and body required' }, { status: 400 });
  const supa = auth.supa;
  // Authors can edit their own comments; admins can edit anything
  const { data: existing } = await supa.from('comments').select('author_id').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.author_id !== auth.actor && auth.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only the author or an admin can edit this comment' }, { status: 403 });
  }
  const { data, error } = await supa
    .from('comments')
    .update({ body, edited_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, author:profiles!comments_author_id_fkey(id, full_name, email, avatar_url, role)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}

export async function DELETE(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Authors can delete their own comments; admins can delete anything.
  try {
    await requireRowOwnership({
      table: 'comments',
      id,
      actorId: auth.actor,
      ownerColumn: 'author_id',
      adminProfile: auth.profile,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const supa = auth.supa;
  const { error } = await supa.from('comments').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
