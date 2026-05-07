import { getAdminClient, STATUS_FLOW, STATUS_LABEL, PILLAR_LABEL, PILLAR_ROUTE } from '@/lib/supabase-admin';
import Dashboard from './Dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
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
    stats[op.pillar].total += 1;
    stats[op.pillar].byStatus[op.status] = (stats[op.pillar].byStatus[op.status] || 0) + 1;
  }

  // Recent activity
  const { data: recent } = await supa
    .from('events')
    .select('*, operators(name, pillar)')
    .order('occurred_at', { ascending: false })
    .limit(15);

  return (
    <Dashboard
      operators={operators || []}
      stats={stats}
      recent={recent || []}
      pillarLabel={PILLAR_LABEL}
      pillarRoute={PILLAR_ROUTE}
      statusFlow={STATUS_FLOW}
      statusLabel={STATUS_LABEL}
    />
  );
}
