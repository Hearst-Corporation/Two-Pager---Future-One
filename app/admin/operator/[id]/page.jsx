import { notFound } from 'next/navigation';
import {
  getAdminClient,
  STATUS_FLOW,
  STATUS_LABEL,
  PILLAR_LABEL,
  PILLAR_ROUTE,
  OPERATOR_DECK_ROUTE,
  EVENT_LABEL,
  INIT_STATUS_LABEL,
  INIT_STATUS_COLOR,
} from '@/lib/supabase-admin';
import { getSessionProfile } from '@/lib/supabase-server';
import OperatorDetail from './OperatorDetail';

export const dynamic = 'force-dynamic';

export default async function OperatorPage({ params }) {
  const supa = getAdminClient();
  const session = await getSessionProfile();
  const [
    { data: operator, error },
    { data: stakeholders },
    { data: events },
    { data: documents },
    { data: deckLinks },
    { data: tasks },
    { data: initLinks },
  ] = await Promise.all([
    supa.from('operators').select('*, assignee:profiles!operators_assignee_id_fkey(id, full_name, email, avatar_url)').eq('id', params.id).single(),
    supa.from('stakeholders').select('*').eq('operator_id', params.id).order('created_at', { ascending: false }),
    supa.from('events').select('*').eq('operator_id', params.id).order('occurred_at', { ascending: false }).limit(200),
    supa.from('documents').select('*').eq('operator_id', params.id).order('uploaded_at', { ascending: false }),
    supa.from('deck_links').select('*').eq('operator_id', params.id).order('created_at', { ascending: false }),
    supa.from('tasks').select('*').eq('operator_id', params.id).order('due_date', { ascending: true, nullsFirst: false }),
    supa.from('initiative_operators').select('initiatives(id, code, title, status, workstreams(slug, label, accent, code))').eq('operator_id', params.id),
  ]);

  if (error || !operator) notFound();

  return (
    <OperatorDetail
      me={session?.profile || null}
      operator={operator}
      stakeholders={stakeholders || []}
      events={events || []}
      documents={documents || []}
      deckLinks={deckLinks || []}
      tasks={tasks || []}
      initiatives={(initLinks || []).map((l) => l.initiatives).filter(Boolean)}
      statusFlow={STATUS_FLOW}
      statusLabel={STATUS_LABEL}
      pillarLabel={PILLAR_LABEL}
      pillarRoute={PILLAR_ROUTE}
      operatorDeckRoute={OPERATOR_DECK_ROUTE}
      eventLabel={EVENT_LABEL}
      initStatusLabel={INIT_STATUS_LABEL}
      initStatusColor={INIT_STATUS_COLOR}
    />
  );
}
