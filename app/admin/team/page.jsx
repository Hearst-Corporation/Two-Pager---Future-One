import { getAdminClient } from '@/lib/supabase-admin';
import { getSessionProfile } from '@/lib/supabase-server';
import TeamView from './TeamView';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getSessionProfile();
  const supa = getAdminClient();
  const { data: members } = await supa
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  return <TeamView members={members || []} me={session?.profile || null} />;
}
