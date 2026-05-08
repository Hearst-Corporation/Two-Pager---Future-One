import { getAdminClient, OWNER_ENTITY_LABEL, OWNER_ENTITY_COLOR, INIT_STATUS_FLOW, INIT_STATUS_LABEL, INIT_STATUS_COLOR, PRIORITY_LABEL } from '@/lib/supabase-admin';
import RoadmapView from './RoadmapView';

export const dynamic = 'force-dynamic';

export default async function RoadmapPage() {
  const supa = getAdminClient();
  const [{ data: workstreams }, { data: initiatives }, { data: partners }, { data: operators }, { data: ipLinks }, { data: ioLinks }] = await Promise.all([
    supa.from('workstreams').select('*').order('ordering'),
    supa.from('initiatives').select('*').eq('archived', false).order('ordering'),
    supa.from('partners').select('id, name').eq('archived', false),
    supa.from('operators').select('id, name, pillar').eq('archived', false),
    supa.from('initiative_partners').select('initiative_id, partner_id'),
    supa.from('initiative_operators').select('initiative_id, operator_id'),
  ]);

  // Build a map: initiative_id -> {partners[], operators[]}
  const linksByInit = {};
  for (const i of initiatives || []) linksByInit[i.id] = { partners: [], operators: [] };
  const partnerMap = Object.fromEntries((partners || []).map((p) => [p.id, p]));
  const operatorMap = Object.fromEntries((operators || []).map((o) => [o.id, o]));
  for (const l of ipLinks || []) if (linksByInit[l.initiative_id]) linksByInit[l.initiative_id].partners.push(partnerMap[l.partner_id]);
  for (const l of ioLinks || []) if (linksByInit[l.initiative_id]) linksByInit[l.initiative_id].operators.push(operatorMap[l.operator_id]);

  return (
    <RoadmapView
      workstreams={workstreams || []}
      initiatives={initiatives || []}
      linksByInit={linksByInit}
      ownerLabel={OWNER_ENTITY_LABEL}
      ownerColor={OWNER_ENTITY_COLOR}
      statusFlow={INIT_STATUS_FLOW}
      statusLabel={INIT_STATUS_LABEL}
      statusColor={INIT_STATUS_COLOR}
      priorityLabel={PRIORITY_LABEL}
    />
  );
}
