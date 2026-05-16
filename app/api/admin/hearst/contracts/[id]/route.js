import { NextResponse } from 'next/server';
import { authedWrite } from '@/lib/supabase-admin';
import { withValidationPartial } from '@/lib/validators/withValidation';
import { ContractUpdateSchema } from '@/lib/validators/hearst';

export const PATCH = withValidationPartial(ContractUpdateSchema, async (req, parsed, { params }) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = parsed;
  const { data, error } = await auth.supa
    .from('hearst_contracts')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contract: data });
});

export async function DELETE(req, { params }) {
  const auth = await authedWrite('admin');
  if (auth instanceof NextResponse) return auth;
  const { error } = await auth.supa.from('hearst_contracts').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
