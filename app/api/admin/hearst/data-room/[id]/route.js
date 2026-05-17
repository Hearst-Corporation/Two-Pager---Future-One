import { NextResponse } from 'next/server';
import { authedWrite } from '@/lib/supabase-admin';
import { withValidationPartial } from '@/lib/validators/withValidation';
import { DataRoomUpdateSchema } from '@/lib/validators/hearst';

export const PATCH = withValidationPartial(DataRoomUpdateSchema, async (req, parsed, { params }) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const body = parsed;
  const { data: existing } = await auth.supa.from('hearst_data_room').select('id').eq('id', params.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data, error } = await auth.supa
    .from('hearst_data_room')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
});
