import { getAdminClient, STATUS_FLOW, STATUS_LABEL, PILLAR_LABEL, PILLAR_ROUTE, OPERATOR_DECK_ROUTE } from '@/lib/supabase-admin';
import Dashboard from './Dashboard';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const supa = getAdminClient();
  const { data: operators } = await supa
    .from('operators')
    .select('*')
    .eq('archived', false)
    .order('pillar')
    .order('rank');

  // Aggregate counts per pillar / status
  const stats = {};
  for (const pid of ['datacenter', 'mining', 'hub']) {
    stats[pid] = { total: 0, byStatus: {} };
    for (const s of STATUS_FLOW) stats[pid].byStatus[s] = 0;
  }
  for (const op of operators || []) {
    if (!stats[op.pillar]) continue;
    stats[op.pillar].total += 1;
    stats[op.pillar].byStatus[op.status] = (stats[op.pillar].byStatus[op.status] || 0) + 1;
  }

  // Recent activity
  const { data: recent } = await supa
    .from('events')
    .select('*, operators(name, pillar)')
    .order('occurred_at', { ascending: false })
    .limit(15);

  // Open tasks (sort: overdue first, then this week, then later)
  const { data: openTasks } = await supa
    .from('tasks')
    .select('*, operators(name, pillar)')
    .eq('done', false)
    .order('due_date', { ascending: true, nullsFirst: false });

  // Most-recent live tracked deck links
  const { data: liveLinks } = await supa
    .from('deck_links')
    .select('*, operators(name, pillar)')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(8);

  // Roadmap health: workstreams + initiatives counts
  const { data: workstreams } = await supa.from('workstreams').select('*').order('ordering');
  const { data: initiatives } = await supa.from('initiatives').select('id, workstream_id, status, priority, due_date').eq('archived', false);

  const wsHealth = (workstreams || []).map((w) => {
    const items = (initiatives || []).filter((i) => i.workstream_id === w.id);
    const done = items.filter((i) => i.status === 'done').length;
    const live = items.filter((i) => i.status === 'in_progress').length;
    const blocked = items.filter((i) => i.status === 'blocked').length;
    const total = items.length;
    return { ...w, total, done, live, blocked, pct: total ? Math.round((done / total) * 100) : 0 };
  });

  // Partner count
  const { count: partnerCount } = await supa.from('partners').select('*', { count: 'exact', head: true }).eq('archived', false);

  return (
    <Dashboard
      operators={operators || []}
      stats={stats}
      recent={recent || []}
      openTasks={openTasks || []}
      liveLinks={liveLinks || []}
      wsHealth={wsHealth}
      partnerCount={partnerCount || 0}
      pillarLabel={PILLAR_LABEL}
      pillarRoute={PILLAR_ROUTE}
      operatorDeckRoute={OPERATOR_DECK_ROUTE}
      statusFlow={STATUS_FLOW}
      statusLabel={STATUS_LABEL}
    />
  );
}
