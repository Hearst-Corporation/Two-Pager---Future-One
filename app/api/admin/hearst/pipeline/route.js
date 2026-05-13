import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  const { data, error } = await supa
    .from('hearst_pipeline')
    .select('*')
    .eq('project_id', project_id)
    .order('probability_pct', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospects: data || [] });
}

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const { data, error } = await auth.supa
    .from('hearst_pipeline')
    .insert({ ...body, created_by: auth.actor })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospect: data }, { status: 201 });
}
