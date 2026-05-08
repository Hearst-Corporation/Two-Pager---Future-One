import { notFound } from 'next/navigation';
import {
  getAdminClient,
  STATUS_FLOW,
  STATUS_LABEL,
  EVENT_LABEL,
  INIT_STATUS_LABEL,
  INIT_STATUS_COLOR,
} from '@/lib/supabase-admin';
import { getSessionProfile } from '@/lib/supabase-server';
import PartnerDetail from './PartnerDetail';

export const dynamic = 'force-dynamic';

export default async function PartnerPage({ params }) {
  const supa = getAdminClient();
  const session = await getSessionProfile();
  const [
    { data: partner, error },
    { data: events },
    { data: stakeholders },
    { data: documents },
    { data: tasks },
    { data: links },
  ] = await Promise.all([
    supa.from('partners').select('*, assignee:profiles!partners_assignee_id_fkey(id, full_name, email, avatar_url)').eq('id', params.id).single(),
    supa.from('events').select('*').eq('partner_id', params.id).order('occurred_at', { ascending: false }).limit(200),
    supa.from('stakeholders').select('*').eq('partner_id', params.id).order('created_at', { ascending: false }),
    supa.from('documents').select('*').eq('partner_id', params.id).order('uploaded_at', { ascending: false }),
    supa.from('tasks').select('*').eq('partner_id', params.id).order('due_date', { ascending: true, nullsFirst: false }),
    supa.from('initiative_partners').select('initiatives(id, code, title, status, workstreams(slug, label, accent, code))').eq('partner_id', params.id),
  ]);

  if (error || !partner) notFound();

  return (
    <PartnerDetail
      me={session?.profile || null}
      partner={partner}
      events={events || []}
      stakeholders={stakeholders || []}
      documents={documents || []}
      tasks={tasks || []}
      initiatives={(links || []).map((l) => l.initiatives).filter(Boolean)}
      statusFlow={STATUS_FLOW}
      statusLabel={STATUS_LABEL}
      eventLabel={EVENT_LABEL}
      initStatusLabel={INIT_STATUS_LABEL}
      initStatusColor={INIT_STATUS_COLOR}
    />
  );
}
