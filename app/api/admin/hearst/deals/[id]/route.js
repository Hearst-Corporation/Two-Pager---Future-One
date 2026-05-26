import { NextResponse } from 'next/server';
import { authedWrite } from '@/lib/supabase-admin';
import { DealUpdateSchema } from '@/lib/validators/hearst';

export async function PATCH(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = params;
    const body = await req.json();
    const parsed = DealUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
    }

    const { data: existing } = await auth.supa.from('hearst_deals').select('id').eq('id', id).maybeSingle();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data, error } = await auth.supa
      .from('hearst_deals')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ deal: data });
  } catch (err) {
    console.error('[deals PATCH]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = params;
    const { data: existing } = await auth.supa.from('hearst_deals').select('id').eq('id', id).maybeSingle();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { error } = await auth.supa.from('hearst_deals').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[deals DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
