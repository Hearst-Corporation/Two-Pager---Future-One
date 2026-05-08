import { notFound } from 'next/navigation';
import {
  getAdminClient,
  OWNER_ENTITY_LABEL,
  OWNER_ENTITY_COLOR,
  INIT_STATUS_FLOW,
  INIT_STATUS_LABEL,
  INIT_STATUS_COLOR,
  PRIORITY_LABEL,
} from '@/lib/supabase-admin';
import { getSessionProfile } from '@/lib/supabase-server';
import InitiativeDetail from './InitiativeDetail';

export const dynamic = 'force-dynamic';

export default async function InitiativePage({ params }) {
  const supa = getAdminClient();
  const session = await getSessionProfile();
  const [
    { data: initiative, error },
    { data: ws },
    { data: tasks },
    { data: opLinks },
    { data: partnerLinks },
    { data: allOperators },
    { data: allPartners },
    { data: dependsOnLinks },
    { data: blocksLinks },
    { data: allInitiatives },
  ] = await Promise.all([
    supa.from('initiatives').select('*, assignee:profiles!initiatives_assigned_to_fkey(id, full_name, email, avatar_url)').eq('id', params.id).single(),
    supa.from('workstreams').select('*'),
    supa.from('tasks').select('*').eq('initiative_id', params.id).order('due_date', { ascending: true, nullsFirst: false }),
    supa.from('initiative_operators').select('operator_id, operators(id, name, pillar)').eq('initiative_id', params.id),
    supa.from('initiative_partners').select('partner_id, partners(id, name, kind)').eq('initiative_id', params.id),
    supa.from('operators').select('id, name, pillar').eq('archived', false),
    supa.from('partners').select('id, name, kind').eq('archived', false),
    supa
      .from('initiative_dependencies')
      .select('depends_on_id, initiatives!initiative_dependencies_depends_on_id_fkey(id, code, title, status, workstream_id)')
      .eq('initiative_id', params.id),
    supa
      .from('initiative_dependencies')
      .select('initiative_id, initiatives!initiative_dependencies_initiative_id_fkey(id, code, title, status, workstream_id)')
      .eq('depends_on_id', params.id),
    supa.from('initiatives').select('id, code, title, workstream_id, status').eq('archived', false),
  ]);

  if (error || !initiative) notFound();

  const workstream = (ws || []).find((w) => w.id === initiative.workstream_id);

  // Build a map of workstream id -> accent so chip rendering knows colors
  const wsMap = Object.fromEntries((ws || []).map((w) => [w.id, w]));
  const dependsOn = (dependsOnLinks || []).map((l) => l.initiatives).filter(Boolean).map((i) => ({ ...i, workstream: wsMap[i.workstream_id] }));
  const blocks = (blocksLinks || []).map((l) => l.initiatives).filter(Boolean).map((i) => ({ ...i, workstream: wsMap[i.workstream_id] }));
  const allInits = (allInitiatives || []).filter((i) => i.id !== params.id).map((i) => ({ ...i, workstream: wsMap[i.workstream_id] }));

  return (
    <InitiativeDetail
      me={session?.profile || null}
      initiative={initiative}
      workstream={workstream}
      tasks={tasks || []}
      operators={(opLinks || []).map((l) => l.operators).filter(Boolean)}
      partners={(partnerLinks || []).map((l) => l.partners).filter(Boolean)}
      allOperators={allOperators || []}
      allPartners={allPartners || []}
      dependsOn={dependsOn}
      blocks={blocks}
      allInitiatives={allInits}
      ownerLabel={OWNER_ENTITY_LABEL}
      ownerColor={OWNER_ENTITY_COLOR}
      statusFlow={INIT_STATUS_FLOW}
      statusLabel={INIT_STATUS_LABEL}
      statusColor={INIT_STATUS_COLOR}
      priorityLabel={PRIORITY_LABEL}
    />
  );
}
