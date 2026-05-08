import { getAdminClient } from '@/lib/supabase-admin';
import { getSessionProfile } from '@/lib/supabase-server';
import TodayView from './TodayView';

export const dynamic = 'force-dynamic';

export default async function AdminTodayPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const me = session.profile;
  const supa = getAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const in7s = in7.toISOString().slice(0, 10);

  const { data: myTasks } = await supa
    .from('tasks')
    .select('*, operators(name, pillar), partners(name)')
    .eq('done', false)
    .eq('assigned_to', me.id)
    .order('due_date', { ascending: true, nullsFirst: false });

  const { data: myInitiatives } = await supa
    .from('initiatives')
    .select('id, code, title, status, priority, due_date, workstreams(label, accent, code)')
    .eq('archived', false)
    .eq('assigned_to', me.id)
    .in('status', ['in_progress', 'blocked', 'planned']);

  const [{ data: myOps }, { data: myPartners }] = await Promise.all([
    supa.from('operators').select('id, name, pillar, status, next_step, next_step_due').eq('archived', false).eq('assignee_id', me.id),
    supa.from('partners').select('id, name, kind, status, next_step, next_step_due').eq('archived', false).eq('assignee_id', me.id),
  ]);

  const { data: unreadNotifs } = await supa
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(id, full_name, email, avatar_url)')
    .eq('recipient_id', me.id)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(8);

  const { data: recentActivity } = await supa
    .from('events')
    .select('id, type, subject, occurred_at, operator_id, partner_id, actor:profiles!events_actor_id_fkey(id, full_name, email, avatar_url), operators(name, pillar), partners(name)')
    .order('occurred_at', { ascending: false })
    .limit(8);

  const overdue = (myTasks || []).filter((t) => t.due_date && t.due_date < today);
  const dueToday = (myTasks || []).filter((t) => t.due_date === today);
  const dueThisWeek = (myTasks || []).filter((t) => t.due_date && t.due_date > today && t.due_date <= in7s);
  const later = (myTasks || []).filter((t) => !t.due_date || t.due_date > in7s);

  return (
    <TodayView
      me={me}
      buckets={{ overdue, dueToday, dueThisWeek, later }}
      myInitiatives={myInitiatives || []}
      myOps={myOps || []}
      myPartners={myPartners || []}
      unreadNotifs={unreadNotifs || []}
      recentActivity={recentActivity || []}
    />
  );
}
