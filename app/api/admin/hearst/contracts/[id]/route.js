import { NextResponse } from 'next/server';
import { authedWrite } from '@/lib/supabase-admin';
import { requireRowOwnership } from '@/lib/auth-guards';
import { withValidationPartial } from '@/lib/validators/withValidation';
import { ContractUpdateSchema } from '@/lib/validators/hearst';

export const PATCH = withValidationPartial(ContractUpdateSchema, async (req, parsed, { params }) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = parsed;
  const { data: existing } = await auth.supa.from('hearst_contracts').select('id').eq('id', params.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

  // Shared workspace: guard verifies the contract exists (404 if not) without
  // an ownership check. The destruction is audited via the helper lookup.
  try {
    await requireRowOwnership({
      table: 'hearst_contracts',
      id: params.id,
      actorId: auth.actor,
      allowSharedWorkspace: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const { error } = await auth.supa.from('hearst_contracts').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
