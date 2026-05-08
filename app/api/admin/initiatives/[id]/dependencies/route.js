import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';

// List dependencies (both directions)
export async function GET(_req, { params }) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const [{ data: dependsOn }, { data: blocks }] = await Promise.all([
    supa
      .from('initiative_dependencies')
      .select('depends_on_id, initiatives!initiative_dependencies_depends_on_id_fkey(id, code, title, status, workstream_id)')
      .eq('initiative_id', params.id),
    supa
      .from('initiative_dependencies')
      .select('initiative_id, initiatives!initiative_dependencies_initiative_id_fkey(id, code, title, status, workstream_id)')
      .eq('depends_on_id', params.id),
  ]);

  return NextResponse.json({
    depends_on: (dependsOn || []).map((r) => r.initiatives).filter(Boolean),
    blocks: (blocks || []).map((r) => r.initiatives).filter(Boolean),
  });
}

export async function POST(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { depends_on_id } = await req.json();
  if (!depends_on_id || depends_on_id === params.id) {
    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  }
  const { error } = await auth.supa
    .from('initiative_dependencies')
    .insert({ initiative_id: params.id, depends_on_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { depends_on_id } = await req.json();
  const { error } = await auth.supa
    .from('initiative_dependencies')
    .delete()
    .eq('initiative_id', params.id)
    .eq('depends_on_id', depends_on_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
