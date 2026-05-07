import { notFound } from 'next/navigation';
import {
  getAdminClient,
  STATUS_FLOW,
  STATUS_LABEL,
  PILLAR_LABEL,
  EVENT_LABEL,
} from '@/lib/supabase-admin';
import OperatorDetail from './OperatorDetail';

export const dynamic = 'force-dynamic';

export default async function OperatorPage({ params }) {
  const supa = getAdminClient();
  const [{ data: operator, error }, { data: stakeholders }, { data: events }, { data: documents }] =
    await Promise.all([
      supa.from('operators').select('*').eq('id', params.id).single(),
      supa.from('stakeholders').select('*').eq('operator_id', params.id).order('created_at', { ascending: false }),
      supa.from('events').select('*').eq('operator_id', params.id).order('occurred_at', { ascending: false }).limit(200),
      supa.from('documents').select('*').eq('operator_id', params.id).order('uploaded_at', { ascending: false }),
    ]);

  if (error || !operator) notFound();

  return (
    <OperatorDetail
      operator={operator}
      stakeholders={stakeholders || []}
      events={events || []}
      documents={documents || []}
      statusFlow={STATUS_FLOW}
      statusLabel={STATUS_LABEL}
      pillarLabel={PILLAR_LABEL}
      eventLabel={EVENT_LABEL}
    />
  );
}
