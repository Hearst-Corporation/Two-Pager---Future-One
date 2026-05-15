import { getAdminClient } from '@/lib/supabase-admin';
import { getSessionProfile } from '@/lib/supabase-server';
import NotificationsView from './NotificationsView';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supa = getAdminClient();
  const { data: notifs } = await supa
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(id, full_name, email, avatar_url)')
    .eq('recipient_id', session.profile.id)
    .order('created_at', { ascending: false })
    .limit(200);
  return <NotificationsView notifications={notifs || []} />;
}
