import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const entity_type = searchParams.get('entity_type');

  let q = supa
    .from('hearst_audit_log')
    .select('*')
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entity_type) q = q.eq('entity_type', entity_type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data || [] });
}
