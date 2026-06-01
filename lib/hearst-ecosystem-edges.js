// Relations explicites entre OPERATORS / CLIENT_TYPES pour rendre le diagramme
// d'écosystème lisible. Sourcé manuellement (news publiques + 10-K + filings).
//
// `kind` :
//   - contract : tenant / customer-supplier
//   - jv       : joint venture / co-investment
//   - invest   : LP / equity stake
//   - regulate : regulator over operator
//   - operate  : operator runs facility for owner

export const ECOSYSTEM_EDGES = [
  // ── Hyperscalers as tenants of operators ───────────────────────
  { from: 'aws',        to: 'equinix',         kind: 'contract', label: 'IBX colocation tenant' },
  { from: 'microsoft',  to: 'equinix',         kind: 'contract', label: 'IBX colocation tenant' },
  { from: 'google',     to: 'equinix',         kind: 'contract', label: 'IBX colocation tenant' },
  { from: 'meta',       to: 'digital_realty',  kind: 'contract', label: 'PlatformDIGITAL wholesale' },
  { from: 'oracle',     to: 'equinix',         kind: 'contract', label: 'Cloud@Customer' },
  { from: 'aws',        to: 'digital_realty',  kind: 'contract', label: 'Wholesale colo' },
  { from: 'microsoft',  to: 'ntt',             kind: 'contract', label: 'APAC anchor tenant' },
  { from: 'google',     to: 'ntt',             kind: 'contract', label: 'APAC tenant' },

  // ── Meta × Blue Owl Hyperion ───────────────────────────────────
  { from: 'meta',       to: 'vantage',         kind: 'contract', label: 'Vantage campus tenant' },

  // ── Neocloud GPU ────────────────────────────────────────────────
  { from: 'coreweave',  to: 'nvidia',          kind: 'contract', label: 'GPU procurement' },
  { from: 'lambda',     to: 'nvidia',          kind: 'contract', label: 'GPU procurement' },
  { from: 'coreweave',  to: 'digital_realty',  kind: 'contract', label: 'Wholesale colo' },
  { from: 'lambda',     to: 'digital_realty',  kind: 'contract', label: 'Wholesale colo' },

  // ── Investors → operators ──────────────────────────────────────
  { from: 'brookfield', to: 'qia',             kind: 'jv',       label: '$20B AI infra (2024)' },
  { from: 'brookfield', to: 'qai',             kind: 'jv',       label: '$20B AI infra (2024)' },
  { from: 'qia',        to: 'qai',             kind: 'invest',   label: 'Government equity' },
  { from: 'brookfield', to: 'vantage',         kind: 'invest',   label: 'Majority owner' },
  { from: 'brookfield', to: 'ntt',             kind: 'invest',   label: 'Brookfield Infra LP' },

  // ── Regulators → operators (Qatar) ─────────────────────────────
  { from: 'kahramaa',   to: 'equinix',         kind: 'regulate', label: 'Power tariff & grid' },
  { from: 'kahramaa',   to: 'digital_realty',  kind: 'regulate', label: 'Power tariff' },
  { from: 'kahramaa',   to: 'ntt',             kind: 'regulate', label: 'Power tariff' },
  { from: 'cra',        to: 'ooredoo',         kind: 'regulate', label: 'Telecom regulator' },
  { from: 'cra',        to: 'vodafone_qatar',  kind: 'regulate', label: 'Telecom regulator' },
  { from: 'moct',       to: 'qai',             kind: 'regulate', label: 'Digital strategy' },

  // ── Telcos → operators ─────────────────────────────────────────
  { from: 'ooredoo',    to: 'equinix',         kind: 'contract', label: 'Carrier interconnect' },
  { from: 'vodafone_qatar', to: 'equinix',     kind: 'contract', label: 'Carrier interconnect' },

  // ── Legal / Standards (advisory) ───────────────────────────────
  { from: 'mayer_brown',    to: 'brookfield',  kind: 'contract', label: 'Legal advisor' },
  { from: 'baker_mckenzie', to: 'qia',         kind: 'contract', label: 'Legal advisor' },
  { from: 'uptime',         to: 'equinix',     kind: 'regulate', label: 'Tier III/IV certif' },
  { from: 'uptime',         to: 'ntt',         kind: 'regulate', label: 'Tier III/IV certif' },
  { from: 'sec',            to: 'equinix',     kind: 'regulate', label: 'SEC reporting' },
  { from: 'sec',            to: 'digital_realty', kind: 'regulate', label: 'SEC reporting' },

  // ── Brokers advise operators (research) ────────────────────────
  { from: 'cbre',           to: 'equinix',     kind: 'contract', label: 'Advisory / leasing' },
  { from: 'jll',            to: 'digital_realty', kind: 'contract', label: 'Advisory' },
  { from: 'turner_townsend', to: 'brookfield', kind: 'contract', label: 'Cost consultant' },
  { from: 'cushman',        to: 'ntt',         kind: 'contract', label: 'Advisory' },
];

/**
 * Type d'edge → token CSS pour styling.
 */
export const EDGE_KIND_COLOR = {
  contract: 'var(--cp-info)',
  jv:       'var(--cp-accent-strong)',
  invest:   'var(--cp-success)',
  regulate: 'var(--cp-warning)',
  operate:  'var(--cp-violet)',
};
