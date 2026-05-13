import { NextResponse } from 'next/server';
import { authedWrite } from '@/lib/supabase-admin';

export async function PATCH(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const { data, error } = await auth.supa
    .from('hearst_pipeline')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospect: data });
}

export async function DELETE(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { error } = await auth.supa.from('hearst_pipeline').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
