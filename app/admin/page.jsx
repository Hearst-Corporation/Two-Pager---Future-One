import { getAdminClient } from '@/lib/supabase-admin';
import { getSessionProfile } from '@/lib/supabase-server';
import DashboardView from './DashboardView';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const session = await getSessionProfile();
  if (!session) return null;
  const me = session.profile;
  const supa = getAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    initiativesList,
    initiativesActiveCount,
    initiativesStuckCount,
    operatorsList,
    operatorsActiveCount,
    operatorsStalledCount,
    partnersList,
    partnersActiveCount,
    partnersOverdueCount,
    tasksList,
    tasksOpenCount,
    tasksOverdueCount,
    activityList,
    notifsList,
    notifsUnreadCount,
  ] = await Promise.all([
    supa
      .from('initiatives')
      .select('id, code, title, status, priority, due_date, workstreams(label, accent, code)')
      .eq('archived', false)
      .in('status', ['in_progress', 'blocked'])
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(7),
    supa
      .from('initiatives')
      .select('id', { count: 'exact', head: true })
      .eq('archived', false)
      .in('status', ['in_progress', 'blocked']),
    supa
      .from('initiatives')
      .select('id', { count: 'exact', head: true })
      .eq('archived', false)
      .eq('status', 'blocked'),

    supa
      .from('operators')
      .select('id, name, pillar, status, next_step, next_step_due')
      .eq('archived', false)
      .not('status', 'in', '(closed_won,closed_lost)')
      .order('next_step_due', { ascending: true, nullsFirst: false })
      .limit(7),
    supa
      .from('operators')
      .select('id', { count: 'exact', head: true })
      .eq('archived', false)
      .not('status', 'in', '(closed_won,closed_lost)'),
    supa
      .from('operators')
      .select('id', { count: 'exact', head: true })
      .eq('archived', false)
      .not('status', 'in', '(closed_won,closed_lost)')
      .lt('next_step_due', today),

    supa
      .from('partners')
      .select('id, name, kind, status, next_step_due')
      .eq('archived', false)
      .order('next_step_due', { ascending: true, nullsFirst: false })
      .limit(7),
    supa
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('archived', false),
    supa
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('archived', false)
      .lt('next_step_due', today),

    supa
      .from('tasks')
      .select('id, title, due_date, operator_id, partner_id, initiative_id, operators(name), partners(name), assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url)')
      .eq('done', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(7),
    supa
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('done', false),
    supa
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('done', false)
      .lt('due_date', today),

    supa
      .from('events')
      .select('id, type, subject, occurred_at, operator_id, partner_id, actor:profiles!events_actor_id_fkey(id, full_name, email, avatar_url), operators(name, pillar), partners(name)')
      .order('occurred_at', { ascending: false })
      .limit(7),

    supa
      .from('notifications')
      .select('id, type, body, parent_kind, parent_id, created_at, actor:profiles!notifications_actor_id_fkey(id, full_name, email, avatar_url)')
      .eq('recipient_id', me.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(7),
    supa
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', me.id)
      .is('read_at', null),
  ]);

  const cards = {
    roadmap: {
      items: initiativesList.data || [],
      total: initiativesActiveCount.count || 0,
      stuck: initiativesStuckCount.count || 0,
    },
    pipeline: {
      items: operatorsList.data || [],
      total: operatorsActiveCount.count || 0,
      stalled: operatorsStalledCount.count || 0,
    },
    partners: {
      items: partnersList.data || [],
      total: partnersActiveCount.count || 0,
      overdue: partnersOverdueCount.count || 0,
    },
    tasks: {
      items: tasksList.data || [],
      total: tasksOpenCount.count || 0,
      overdue: tasksOverdueCount.count || 0,
    },
    activity: {
      items: activityList.data || [],
    },
    notifications: {
      items: notifsList.data || [],
      total: notifsUnreadCount.count || 0,
    },
  };

  return <DashboardView me={me} cards={cards} />;
}
