import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { DealCreateSchema } from '@/lib/validators/hearst';

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get('project_id');
    if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

    const supa = getAdminClient();
    const { data, error } = await supa
      .from('hearst_deals')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet or RLS/permission issue — return empty array gracefully
      if (error.code === '42P01' || error.code === '42501' || error.code === 'PGRST116') {
        return NextResponse.json({ deals: [] });
      }
      throw error;
    }
    return NextResponse.json({ deals: data || [] });
  } catch (err) {
    console.error('[deals GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const parsed = DealCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    }

    const { data, error } = await auth.supa
      .from('hearst_deals')
      .insert([parsed.data])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ deal: data }, { status: 201 });
  } catch (err) {
    console.error('[deals POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
