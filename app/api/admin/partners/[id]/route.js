import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';

export async function GET(_req, { params }) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const [{ data: partner, error }, { data: events }, { data: stake }, { data: docs }, { data: tasks }, { data: links }] =
    await Promise.all([
      supa.from('partners').select('*').eq('id', params.id).single(),
      supa.from('events').select('*').eq('partner_id', params.id).order('occurred_at', { ascending: false }).limit(200),
      supa.from('stakeholders').select('*').eq('partner_id', params.id).order('created_at', { ascending: false }),
      supa.from('documents').select('*').eq('partner_id', params.id).order('uploaded_at', { ascending: false }),
      supa.from('tasks').select('*').eq('partner_id', params.id).order('due_date', { ascending: true, nullsFirst: false }),
      supa.from('initiative_partners').select('initiative_id, initiatives(*, workstreams(slug, label, accent, code))').eq('partner_id', params.id),
    ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({
    partner,
    events: events || [],
    stakeholders: stake || [],
    documents: docs || [],
    tasks: tasks || [],
    initiatives: (links || []).map((l) => l.initiatives).filter(Boolean),
  });
}

export async function PATCH(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const { data, error } = await auth.supa.from('partners').update(body).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partner: data });
}

export async function DELETE(_req, { params }) {
  const auth = await authedWrite('admin');
  if (auth instanceof NextResponse) return auth;
  const { error } = await auth.supa.from('partners').update({ archived: true }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
