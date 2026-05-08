import { NextResponse } from 'next/server';
import { getAdminClient, requireProfile } from '@/lib/supabase-admin';

const VALID_ROLES = new Set(['admin', 'editor', 'viewer']);

export async function PATCH(req, { params }) {
  const r = await requireProfile('admin');
  if (r instanceof NextResponse) return r;
  const body = await req.json();
  const patch = {};
  if (body.role) {
    if (!VALID_ROLES.has(body.role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    patch.role = body.role;
  }
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;
  if (body.full_name !== undefined) patch.full_name = body.full_name;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  // Don't let an admin demote themselves to viewer if they're the only admin left
  if (patch.role && patch.role !== 'admin' && params.id === r.profile.id) {
    const supa = getAdminClient();
    const { count } = await supa
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true);
    if ((count || 0) <= 1) {
      return NextResponse.json({ error: 'You are the only admin — promote someone else first.' }, { status: 400 });
    }
  }

  const supa = getAdminClient();
  const { data, error } = await supa.from('profiles').update(patch).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}
