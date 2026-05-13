// Pure constants safe to import from Client Components.
// No server-only deps (no next/headers, no service_role).

import {
  PILLAR_COLOR,
  STATUS_COLOR,
  PARTNER_KIND_COLOR as _PARTNER_KIND_COLOR,
  OWNER_ENTITY_COLOR as _OWNER_ENTITY_COLOR,
} from './admin-tokens';

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

export const PILLAR_ACCENT = PILLAR_COLOR;

export const PARTNER_KIND_COLOR = _PARTNER_KIND_COLOR;

export const PILLAR_ROUTE = {
  datacenter: '/pitch-datacenter',
  mining: '/pitch-mining',
  hub: '/pitch-hub',
};

export const OPERATOR_DECK_ROUTE = {
  datacenter: '/pitch-op-datacenter',
  mining: '/pitch-op-mining',
  hub: '/pitch-op-hub',
};

export const OWNER_ENTITY_LABEL = {
  hearst: 'Hearst',
  jv: 'JV',
  you: 'You',
  partner: 'Partner',
  joint: 'Joint',
};

export const OWNER_ENTITY_COLOR = _OWNER_ENTITY_COLOR;

export const INIT_STATUS_FLOW = [
  'not_started',
  'planned',
  'in_progress',
  'blocked',
  'done',
  'archived',
];

export const INIT_STATUS_LABEL = {
  not_started: 'Not Started',
  planned: 'Planned',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
  archived: 'Archived',
};

export const INIT_STATUS_COLOR = STATUS_COLOR;

export const PRIORITY_LABEL = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
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
