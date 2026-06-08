import { NextResponse } from 'next/server';
import { authedWrite } from '@/lib/supabase-admin';
import { requireRowOwnership } from '@/lib/auth-guards';
import { withValidationPartial } from '@/lib/validators/withValidation';
import { SourceUpdateSchema } from '@/lib/validators/hearst';

export const PATCH = withValidationPartial(SourceUpdateSchema, async (req, parsed, { params }) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  try {
    await requireRowOwnership({
      table: 'hearst_sources',
      id: params.id,
      actorId: auth.actor,
      allowSharedWorkspace: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
  const body = parsed;
  const { data, error } = await auth.supa
    .from('hearst_sources')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data });
});

export async function DELETE(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;

  // Shared workspace: guard verifies the row exists (404 if not) without an
  // ownership check. Logs the destruction attempt through the helper.
  try {
    await requireRowOwnership({
      table: 'hearst_sources',
      id: params.id,
      actorId: auth.actor,
      allowSharedWorkspace: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const { error } = await auth.supa.from('hearst_sources').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
