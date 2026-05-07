import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client (service_role).
 * Targets the `crm` schema by default. Never import this from a Client Component.
 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    db: { schema: 'crm' },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const STATUS_FLOW = [
  'identified',
  'contacted',
  'in_discussion',
  'nda_signed',
  'loi',
  'term_sheet',
  'closed_won',
  'closed_lost',
];

export const STATUS_LABEL = {
  identified: 'Identified',
  contacted: 'Contacted',
  in_discussion: 'In Discussion',
  nda_signed: 'NDA Signed',
  loi: 'LOI',
  term_sheet: 'Term Sheet',
  closed_won: 'Closed-Won',
  closed_lost: 'Closed-Lost',
};

export const PILLAR_LABEL = {
  datacenter: 'Data Center',
  mining: 'Mining',
  hub: 'Hub',
};

export const PILLAR_ROUTE = {
  datacenter: '/pitch-datacenter',
  mining: '/pitch-mining',
  hub: '/pitch-hub',
};

export const EVENT_LABEL = {
  email_sent: 'Email sent',
  email_received: 'Email received',
  call: 'Call',
  meeting: 'Meeting',
  document_sent: 'Document sent',
  document_received: 'Document received',
  note: 'Note',
  status_change: 'Status change',
};
