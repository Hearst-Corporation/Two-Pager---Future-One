import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const { data, error } = await supa.from('workstreams').select('*').order('ordering');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workstreams: data });
}
