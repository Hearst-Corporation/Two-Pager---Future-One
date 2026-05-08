import { NextResponse } from 'next/server';
import { getSessionProfile, touchLastSeen } from '@/lib/supabase-server';

export async function GET() {
  const session = await getSessionProfile();
  if (!session) return NextResponse.json({ profile: null }, { status: 401 });
  // Best-effort presence ping
  touchLastSeen(session.user.id).catch(() => {});
  return NextResponse.json({ profile: session.profile });
}
