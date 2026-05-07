import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const supa = getAdminClient();
  const { data, error } = await supa
    .from('operators')
    .select('*')
    .eq('archived', false)
    .order('pillar', { ascending: true })
    .order('rank', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ operators: data });
}

export async function POST(req) {
  const body = await req.json();
  const supa = getAdminClient();
  const { data, error } = await supa.from('operators').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ operator: data });
}
