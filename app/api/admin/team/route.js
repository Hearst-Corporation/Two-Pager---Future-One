import { NextResponse } from 'next/server';
import { getAdminClient, requireProfile } from '@/lib/supabase-admin';

const VALID_ROLES = new Set(['admin', 'editor', 'viewer']);

export async function GET() {
  const r = await requireProfile('editor');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();
  const { data, error } = await supa.from('profiles').select('*').order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

/**
 * Invite a new user (admin only). Sends a magic-link signup email.
 * The signup trigger will create the profile; we then bump the role
 * if the inviter chose something other than viewer.
 */
export async function POST(req) {
  const r = await requireProfile('admin');
  if (r instanceof NextResponse) return r;

  const { email, role = 'viewer', full_name } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  if (!VALID_ROLES.has(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const supa = getAdminClient();

  // Send the invite (creates auth.users row + emails the magic link)
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5005'}/admin/auth/callback?next=/admin`;
  const { data: invited, error: inviteErr } = await supa.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: full_name ? { full_name } : undefined,
  });

  if (inviteErr) {
    // If the user already exists, fall back to upserting their profile + role
    const existing = await supa.from('profiles').select('*').eq('email', email).maybeSingle();
    if (existing.data) {
      const upd = await supa
        .from('profiles')
        .update({ role, is_active: true, invited_by: r.profile.id, invited_at: new Date().toISOString(), full_name: full_name || existing.data.full_name })
        .eq('id', existing.data.id)
        .select()
        .single();
      if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });
      return NextResponse.json({ member: upd.data, reused: true });
    }
    return NextResponse.json({ error: inviteErr.message }, { status: 500 });
  }

  // Set the desired role on the freshly-created profile (the trigger defaults to viewer)
  const newId = invited?.user?.id;
  if (newId) {
    await supa
      .from('profiles')
      .update({ role, full_name: full_name || null, invited_by: r.profile.id, invited_at: new Date().toISOString() })
      .eq('id', newId);
  }

  return NextResponse.json({ ok: true, email, role });
}
