// Pure constants safe to import from Client Components.
// No server-only deps (no next/headers, no service_role).

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

export const PILLAR_ACCENT = {
  datacenter: '#3b82f6',
  mining: '#f59e0b',
  hub: '#10b981',
};

export const PARTNER_KIND_COLOR = {
  institution: '#8b5cf6',
  authority: '#ef4444',
  foundation: '#10b981',
  sponsor: '#f59e0b',
};

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

export const OWNER_ENTITY_COLOR = {
  hearst: '#3b82f6',
  jv: '#8b5cf6',
  you: '#10b981',
  partner: '#f59e0b',
  joint: '#ec4899',
};

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

export const INIT_STATUS_COLOR = {
  not_started: '#94a3b8',
  planned: '#3b82f6',
  in_progress: '#f59e0b',
  blocked: '#ef4444',
  done: '#10b981',
  archived: '#64748b',
};

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
